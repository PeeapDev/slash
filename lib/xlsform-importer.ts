import * as XLSX from 'xlsx'
import type {
  Form,
  FormField,
  FormGroupMeta,
  RepeatGroupMeta,
  FieldCondition,
  FieldConstraint,
} from './form-store'

// ─── Type mapping: XLSForm → SLASH ───

const TYPE_MAP: Record<string, FormField['type']> = {
  text: 'text',
  integer: 'integer',
  int: 'integer',
  decimal: 'decimal',
  date: 'date',
  time: 'time',
  datetime: 'dateTime',
  geopoint: 'gps',
  geotrace: 'gps',
  geoshape: 'gps',
  barcode: 'barcode',
  image: 'image',
  audio: 'file',
  video: 'file',
  file: 'file',
  note: 'note',
  calculate: 'calculate',
  range: 'range',
  acknowledge: 'note',
  // ODK metadata types — auto-captured fields
  start: 'dateTime',
  end: 'dateTime',
  today: 'date',
  deviceid: 'text',
  phonenumber: 'text',
  username: 'text',
  email: 'text',
  simserial: 'text',
  subscriberid: 'text',
  audit: 'text',
  'start-geopoint': 'gps',
  'background-audio': 'file',
}

// ─── CSV / TSV parsing ───

function detectDelimiter(text: string): string {
  const firstLine = text.split('\n')[0] || ''
  const tabs = (firstLine.match(/\t/g) || []).length
  const commas = (firstLine.match(/,/g) || []).length
  return tabs >= commas ? '\t' : ','
}

function parseCSVLine(line: string, delimiter: string): string[] {
  const cells: string[] = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (inQuotes) {
      if (ch === '"' && line[i + 1] === '"') {
        current += '"'
        i++
      } else if (ch === '"') {
        inQuotes = false
      } else {
        current += ch
      }
    } else {
      if (ch === '"') {
        inQuotes = true
      } else if (ch === delimiter) {
        cells.push(current.trim())
        current = ''
      } else {
        current += ch
      }
    }
  }
  cells.push(current.trim())
  return cells
}

function parseSheet(text: string): { headers: string[]; rows: Record<string, string>[] } {
  const lines = text.split(/\r?\n/).filter(l => l.trim().length > 0)
  if (lines.length === 0) return { headers: [], rows: [] }

  const delimiter = detectDelimiter(text)
  const headers = parseCSVLine(lines[0], delimiter).map(h => h.trim().toLowerCase())
  const rows: Record<string, string>[] = []

  for (let i = 1; i < lines.length; i++) {
    const cells = parseCSVLine(lines[i], delimiter)
    const row: Record<string, string> = {}
    headers.forEach((h, idx) => {
      row[h] = cells[idx]?.trim() || ''
    })
    rows.push(row)
  }

  return { headers, rows }
}

// ─── Choices parsing ───

function parseChoices(text: string): Map<string, { name: string; label: string }[]> {
  const map = new Map<string, { name: string; label: string }[]>()
  if (!text.trim()) return map

  const { headers, rows } = parseSheet(text)

  // Find the label column — could be "label", "label::english", "label::en", etc.
  const labelCol = headers.find(h => h === 'label')
    || headers.find(h => h.startsWith('label::'))
    || headers.find(h => h.startsWith('label:'))
    || 'label'

  const listNameCol = headers.includes('list_name') ? 'list_name' : 'list name'
  const nameCol = 'name'

  for (const row of rows) {
    const listName = row[listNameCol] || row['list_name'] || ''
    const name = row[nameCol] || ''
    const label = row[labelCol] || row['label'] || name
    if (!listName || !name) continue

    if (!map.has(listName)) map.set(listName, [])
    map.get(listName)!.push({ name, label })
  }

  return map
}

// ─── Relevance XPath → FieldCondition[] ───

function normalizeFieldRef(expr: string): string {
  // Convert /data/field_name → ${field_name} and ${field} stays as-is
  return expr.replace(/\/data\/([a-zA-Z0-9_-]+)/g, '${$1}')
}

function parseRelevance(xpath: string, nameToId: Map<string, string>): FieldCondition[] {
  if (!xpath.trim()) return []

  const conditions: FieldCondition[] = []
  const normalized = normalizeFieldRef(xpath)

  // Split by 'and' / 'or' at the top level (not inside parentheses)
  const tokens = splitByConjunctions(normalized)

  for (const token of tokens) {
    if (token.type === 'conjunction') {
      if (conditions.length > 0) {
        conditions[conditions.length - 1].conjunction = token.value as 'and' | 'or'
      }
      continue
    }

    const expr = token.value.trim()
    const condition = parseSingleCondition(expr, nameToId)
    if (condition) {
      conditions.push(condition)
    }
  }

  return conditions
}

function splitByConjunctions(expr: string): { type: 'expr' | 'conjunction'; value: string }[] {
  const tokens: { type: 'expr' | 'conjunction'; value: string }[] = []
  let depth = 0
  let current = ''

  const words = expr.split(/\s+/)
  for (const word of words) {
    depth += (word.match(/\(/g) || []).length
    depth -= (word.match(/\)/g) || []).length

    if (depth === 0 && (word === 'and' || word === 'or')) {
      if (current.trim()) tokens.push({ type: 'expr', value: current.trim() })
      tokens.push({ type: 'conjunction', value: word })
      current = ''
    } else {
      current += (current ? ' ' : '') + word
    }
  }
  if (current.trim()) tokens.push({ type: 'expr', value: current.trim() })

  return tokens
}

function resolveFieldId(name: string, nameToId: Map<string, string>): string {
  return nameToId.get(name) || name
}

function parseSingleCondition(expr: string, nameToId: Map<string, string>): FieldCondition | null {
  // selected(${field}, 'value')
  const selectedMatch = expr.match(/selected\(\s*\$\{([^}]+)\}\s*,\s*'([^']*)'\s*\)/)
  if (selectedMatch) {
    return {
      fieldId: resolveFieldId(selectedMatch[1], nameToId),
      operator: 'contains',
      value: selectedMatch[2],
    }
  }

  // ${field} != ''  →  is_not_empty
  const notEmptyMatch = expr.match(/\$\{([^}]+)\}\s*!=\s*''/)
  if (notEmptyMatch && !expr.match(/\$\{([^}]+)\}\s*!=\s*'[^']+'/)) {
    return {
      fieldId: resolveFieldId(notEmptyMatch[1], nameToId),
      operator: 'is_not_empty',
    }
  }

  // ${field} = '' → is_empty
  const emptyMatch = expr.match(/\$\{([^}]+)\}\s*=\s*''/)
  if (emptyMatch && !expr.match(/\$\{([^}]+)\}\s*=\s*'[^']+'/)) {
    return {
      fieldId: resolveFieldId(emptyMatch[1], nameToId),
      operator: 'is_empty',
    }
  }

  // ${field} op 'value' or ${field} op number
  const compMatch = expr.match(/\$\{([^}]+)\}\s*(=|!=|>=|<=|>|<)\s*(?:'([^']*)'|(\d+\.?\d*))/)
  if (compMatch) {
    const fieldName = compMatch[1]
    const op = compMatch[2]
    const strVal = compMatch[3]
    const numVal = compMatch[4]
    const value = numVal !== undefined ? Number(numVal) : (strVal ?? '')

    const operatorMap: Record<string, FieldCondition['operator']> = {
      '=': 'eq', '!=': 'neq', '>': 'gt', '>=': 'gte', '<': 'lt', '<=': 'lte',
    }

    return {
      fieldId: resolveFieldId(fieldName, nameToId),
      operator: operatorMap[op] || 'eq',
      value,
    }
  }

  return null
}

// ─── Constraint XPath → FieldConstraint[] ───

function parseConstraint(xpath: string, constraintMsg: string): FieldConstraint[] {
  if (!xpath.trim()) return []

  const constraints: FieldConstraint[] = []
  const msg = constraintMsg || 'Invalid value'

  // regex(., 'pattern')
  const regexMatch = xpath.match(/regex\(\s*\.\s*,\s*'([^']*)'\s*\)/)
  if (regexMatch) {
    constraints.push({ type: 'regex', value: regexMatch[1], message: msg })
  }

  // string-length(.) >= N and/or string-length(.) <= M
  const lenMinMatch = xpath.match(/string-length\(\s*\.\s*\)\s*>=?\s*(\d+)/)
  const lenMaxMatch = xpath.match(/string-length\(\s*\.\s*\)\s*<=?\s*(\d+)/)
  if (lenMinMatch || lenMaxMatch) {
    constraints.push({
      type: 'length',
      min: lenMinMatch ? Number(lenMinMatch[1]) : undefined,
      max: lenMaxMatch ? Number(lenMaxMatch[1]) : undefined,
      message: msg,
    })
  }

  // . >= N and . <= M  (range) — only if no string-length
  if (!lenMinMatch && !lenMaxMatch && !regexMatch) {
    const rangeMinMatch = xpath.match(/\.\s*>=?\s*(-?\d+\.?\d*)/)
    const rangeMaxMatch = xpath.match(/\.\s*<=?\s*(-?\d+\.?\d*)/)
    if (rangeMinMatch || rangeMaxMatch) {
      constraints.push({
        type: 'range',
        min: rangeMinMatch ? Number(rangeMinMatch[1]) : undefined,
        max: rangeMaxMatch ? Number(rangeMaxMatch[1]) : undefined,
        message: msg,
      })
    }
  }

  // If nothing matched, store as custom_expression
  if (constraints.length === 0) {
    constraints.push({ type: 'custom_expression', value: xpath, message: msg })
  }

  return constraints
}

// ─── Calculation normalization ───

function normalizeCalculation(calcExpr: string): string {
  if (!calcExpr.trim()) return ''
  // Convert /data/field refs → ${field} format
  return calcExpr.replace(/\/data\/([a-zA-Z0-9_-]+)/g, '${$1}')
}

// ─── Multi-language detection ───

function detectLanguages(headers: string[]): { languages: string[]; defaultLanguage: string } {
  const langSet = new Set<string>()
  for (const h of headers) {
    const match = h.match(/^(?:label|hint)::(.+)$/)
    if (match) langSet.add(match[1].trim())
  }
  const languages = Array.from(langSet)
  return {
    languages,
    defaultLanguage: languages[0] || '',
  }
}

function getLabelForRow(row: Record<string, string>, headers: string[]): string {
  // Try plain 'label' first, then first label:: column
  if (row['label']) return row['label']
  const langLabel = headers.find(h => h.startsWith('label::'))
  if (langLabel && row[langLabel]) return row[langLabel]
  return ''
}

function getHintForRow(row: Record<string, string>, headers: string[]): string {
  if (row['hint']) return row['hint']
  const langHint = headers.find(h => h.startsWith('hint::'))
  if (langHint && row[langHint]) return row[langHint]
  return ''
}

function getTranslations(
  row: Record<string, string>,
  headers: string[],
  languages: string[],
  choiceLabels?: Map<string, { name: string; label: string }[]>,
  listName?: string
): Record<string, { label: string; hint?: string; options?: string[] }> | undefined {
  if (languages.length <= 1) return undefined

  const translations: Record<string, { label: string; hint?: string; options?: string[] }> = {}
  for (const lang of languages) {
    const label = row[`label::${lang}`] || ''
    const hint = row[`hint::${lang}`] || undefined
    if (label) {
      translations[lang] = { label, hint }
    }
  }

  return Object.keys(translations).length > 0 ? translations : undefined
}

// ─── Main importer ───

export interface ImportResult {
  form: Omit<Form, 'id' | 'createdAt' | 'updatedAt'>
  warnings: string[]
}

export function importXLSForm(surveyText: string, choicesText: string): ImportResult {
  const warnings: string[] = []
  const choicesMap = parseChoices(choicesText)

  const { headers: surveyHeaders, rows: surveyRows } = parseSheet(surveyText)

  if (surveyRows.length === 0) {
    throw new Error('Survey sheet is empty or could not be parsed.')
  }

  // Detect languages
  const { languages, defaultLanguage } = detectLanguages(surveyHeaders)

  // First pass: build name→id map (XLSForm name is the id in SLASH)
  const nameToId = new Map<string, string>()
  let fieldCounter = 0
  for (const row of surveyRows) {
    const type = (row['type'] || '').trim().toLowerCase()
    const name = (row['name'] || '').trim()
    if (!name || type.startsWith('begin_') || type.startsWith('end_')) continue
    const fieldId = name || `field-${String(++fieldCounter).padStart(3, '0')}`
    nameToId.set(name, fieldId)
  }

  // Second pass: build fields, groups, repeat groups
  const fields: FormField[] = []
  const groups: FormGroupMeta[] = []
  const repeatGroups: RepeatGroupMeta[] = []

  // Group/repeat nesting stack
  const groupStack: { type: 'group' | 'repeat'; id: string }[] = []

  let formName = 'Imported Form'

  for (const row of surveyRows) {
    const rawType = (row['type'] || '').trim()
    const typeLower = rawType.toLowerCase()
    const name = (row['name'] || '').trim()
    const label = getLabelForRow(row, surveyHeaders) || name
    const hint = getHintForRow(row, surveyHeaders)
    const required = (row['required'] || '').toLowerCase()
    const relevant = row['relevant'] || ''
    const constraint = row['constraint'] || ''
    const constraintMsg = row['constraint_message'] || row['constraint_msg'] || ''
    const calculation = row['calculation'] || row['calculate'] || ''
    const appearance = row['appearance'] || ''
    const defaultVal = row['default'] || ''
    const readOnly = (row['read_only'] || row['readonly'] || '').toLowerCase()
    const repeatCount = row['repeat_count'] || ''
    const choiceFilter = row['choice_filter'] || ''

    // ── begin_group ──
    if (typeLower === 'begin_group' || typeLower === 'begin group') {
      const groupId = name || `group-${groups.length + 1}`
      groups.push({
        id: groupId,
        label: label || groupId,
        description: hint || undefined,
        collapsed: false,
        appearance: appearance === 'field-list' ? 'field-list' : appearance || undefined,
      })
      groupStack.push({ type: 'group', id: groupId })
      continue
    }

    // ── end_group ──
    if (typeLower === 'end_group' || typeLower === 'end group') {
      if (groupStack.length > 0 && groupStack[groupStack.length - 1].type === 'group') {
        groupStack.pop()
      } else {
        warnings.push('Unexpected end_group without matching begin_group')
      }
      continue
    }

    // ── begin_repeat ──
    if (typeLower === 'begin_repeat' || typeLower === 'begin repeat') {
      const repeatId = name || `repeat-${repeatGroups.length + 1}`
      const rg: RepeatGroupMeta = {
        id: repeatId,
        label: label || repeatId,
        collapsed: false,
      }
      if (repeatCount) {
        const n = parseInt(repeatCount, 10)
        if (!isNaN(n)) {
          rg.repeatMin = n
          rg.repeatMax = n
        }
      }
      repeatGroups.push(rg)
      groupStack.push({ type: 'repeat', id: repeatId })
      continue
    }

    // ── end_repeat ──
    if (typeLower === 'end_repeat' || typeLower === 'end repeat') {
      if (groupStack.length > 0 && groupStack[groupStack.length - 1].type === 'repeat') {
        groupStack.pop()
      } else {
        warnings.push('Unexpected end_repeat without matching begin_repeat')
      }
      continue
    }

    // Skip empty type rows
    if (!typeLower) continue

    // ── Detect select_one / select_multiple / rank with list name ──
    let fieldType: FormField['type'] | undefined
    let listName = ''
    let orOther = false

    if (typeLower.startsWith('select_one ') || typeLower.startsWith('select one ')) {
      fieldType = 'radio'
      listName = rawType.split(/\s+/).slice(1).join(' ').trim()
    } else if (typeLower.startsWith('select_multiple ') || typeLower.startsWith('select multiple ')) {
      fieldType = 'checkbox'
      listName = rawType.split(/\s+/).slice(1).join(' ').trim()
    } else if (typeLower.startsWith('rank ')) {
      fieldType = 'ranking'
      listName = rawType.split(/\s+/).slice(1).join(' ').trim()
    } else {
      fieldType = TYPE_MAP[typeLower]
    }

    // Handle or_other suffix
    if (listName.endsWith(' or_other') || listName.endsWith(' or other')) {
      orOther = true
      listName = listName.replace(/\s+or[_ ]other$/i, '').trim()
    }

    if (!fieldType) {
      warnings.push(`Unknown type "${rawType}" for field "${name}" — defaulting to text`)
      fieldType = 'text'
    }

    const fieldId = nameToId.get(name) || name || `field-${String(++fieldCounter).padStart(3, '0')}`

    // Build options from choices
    let options: string[] | undefined
    if (listName) {
      const choiceList = choicesMap.get(listName)
      if (choiceList) {
        options = choiceList.map(c => c.label)
      } else {
        warnings.push(`Choice list "${listName}" not found for field "${name}"`)
      }
    }

    // Parse relevance
    const relevance = parseRelevance(relevant, nameToId)

    // Parse constraints
    const constraints = parseConstraint(constraint, constraintMsg)

    // Normalize calculation
    const calc = normalizeCalculation(calculation)

    // Build field
    const field: FormField = {
      id: fieldId,
      type: fieldType,
      label,
      required: required === 'yes' || required === 'true' || required === '1',
    }

    if (hint) field.hint = hint
    if (options && options.length > 0) field.options = options
    if (relevance.length > 0) field.relevance = relevance
    if (constraints.length > 0 && constraints[0].type !== 'custom_expression') {
      field.constraints = constraints
    } else if (constraints.length > 0) {
      field.constraints = constraints
    }
    if (calc) field.calculation = calc
    if (appearance) {
      const validAppearances = ['minimal', 'horizontal', 'likert', 'multiline', 'signature', 'map', 'label', 'quick']
      if (validAppearances.includes(appearance)) {
        field.appearance = appearance as FormField['appearance']
      }
    }
    if (defaultVal) {
      field.defaultValue = isNaN(Number(defaultVal)) ? defaultVal : Number(defaultVal)
    }
    if (readOnly === 'yes' || readOnly === 'true' || readOnly === '1') {
      field.readOnly = true
    }
    if (orOther) field.orOther = true
    if (choiceFilter) field.choiceFilterExpression = choiceFilter

    // Mark ODK metadata fields as hidden (auto-captured at runtime)
    const metadataTypes = ['start', 'end', 'today', 'deviceid', 'phonenumber', 'username', 'email', 'simserial', 'subscriberid', 'audit', 'start-geopoint', 'background-audio']
    if (metadataTypes.includes(typeLower)) {
      field.readOnly = true
      field.metadata = typeLower as any
    }

    // Range parameters from appearance (e.g., "picker" or params)
    if (fieldType === 'range') {
      // Defaults
      field.rangeMin = 0
      field.rangeMax = 100
      field.rangeStep = 1

      // Override from constraints if range type
      const rangeConstraint = constraints.find(c => c.type === 'range')
      if (rangeConstraint) {
        if (rangeConstraint.min !== undefined) field.rangeMin = rangeConstraint.min
        if (rangeConstraint.max !== undefined) field.rangeMax = rangeConstraint.max
      }
    }

    // Assign group/repeat context from stack
    if (groupStack.length > 0) {
      const current = groupStack[groupStack.length - 1]
      if (current.type === 'group') {
        field.groupId = current.id
      } else if (current.type === 'repeat') {
        field.repeatGroupId = current.id
      }
    }

    // Multi-language translations
    if (languages.length > 1) {
      const trans = getTranslations(row, surveyHeaders, languages)
      if (trans) field.translations = trans
    }

    fields.push(field)
  }

  // Warn about unclosed groups/repeats
  for (const item of groupStack) {
    warnings.push(`Unclosed ${item.type} "${item.id}" — missing end_${item.type}`)
  }

  // Try to extract form name from settings or first label
  if (fields.length > 0 && !formName) {
    formName = 'Imported Form'
  }

  const form: Omit<Form, 'id' | 'createdAt' | 'updatedAt'> = {
    name: formName,
    type: 'survey',
    targetRole: 'field-collector',
    assignedProjects: [],
    assignedRegions: [],
    fields,
    groups: groups.length > 0 ? groups : undefined,
    repeatGroups: repeatGroups.length > 0 ? repeatGroups : undefined,
    createdBy: 'import',
    status: 'active',
    publishStatus: 'published',
    ...(languages.length > 1 ? { languages, defaultLanguage } : {}),
  }

  return { form, warnings }
}

// ─── Preview helper (for UI — text paste mode) ───

export function previewXLSForm(surveyText: string, choicesText: string): {
  fieldCount: number
  groupCount: number
  repeatGroupCount: number
  warnings: string[]
  languages: string[]
  fieldTypes: Record<string, number>
} {
  try {
    const result = importXLSForm(surveyText, choicesText)
    const fieldTypes: Record<string, number> = {}
    for (const f of result.form.fields) {
      fieldTypes[f.type] = (fieldTypes[f.type] || 0) + 1
    }
    return {
      fieldCount: result.form.fields.length,
      groupCount: result.form.groups?.length || 0,
      repeatGroupCount: result.form.repeatGroups?.length || 0,
      warnings: result.warnings,
      languages: result.form.languages || [],
      fieldTypes,
    }
  } catch (e: any) {
    return {
      fieldCount: 0,
      groupCount: 0,
      repeatGroupCount: 0,
      warnings: [e.message || 'Failed to parse'],
      languages: [],
      fieldTypes: {},
    }
  }
}

// ─── Excel (.xlsx) file helpers ───

function sheetToTSV(sheet: XLSX.WorkSheet): string {
  return XLSX.utils.sheet_to_csv(sheet, { FS: '\t' })
}

async function readXLSXFile(file: File): Promise<XLSX.WorkBook> {
  const buffer = await file.arrayBuffer()
  return XLSX.read(buffer, { type: 'array' })
}

function findSheet(wb: XLSX.WorkBook, names: string[]): XLSX.WorkSheet | null {
  for (const name of names) {
    const found = wb.SheetNames.find(s => s.toLowerCase() === name.toLowerCase())
    if (found) return wb.Sheets[found]
  }
  return null
}

// ─── Import from .xlsx file ───

export async function importXLSFormFromFile(file: File): Promise<ImportResult> {
  const wb = await readXLSXFile(file)

  const surveySheet = findSheet(wb, ['survey'])
  if (!surveySheet) {
    throw new Error(`No "survey" sheet found. Found sheets: ${wb.SheetNames.join(', ')}`)
  }

  const choicesSheet = findSheet(wb, ['choices', 'external_choices'])
  const settingsSheet = findSheet(wb, ['settings'])

  const surveyTSV = sheetToTSV(surveySheet)
  const choicesTSV = choicesSheet ? sheetToTSV(choicesSheet) : ''

  const result = importXLSForm(surveyTSV, choicesTSV)

  // Extract form name from settings sheet if available
  if (settingsSheet) {
    const settingsTSV = sheetToTSV(settingsSheet)
    const { rows } = parseSheet(settingsTSV)
    if (rows.length > 0) {
      const title = rows[0]['form_title'] || rows[0]['title'] || ''
      const formId = rows[0]['form_id'] || rows[0]['id_string'] || ''
      if (title) result.form.name = title
      else if (formId) result.form.name = formId
    }
  }

  // Use filename as fallback
  if (result.form.name === 'Imported Form') {
    result.form.name = file.name.replace(/\.(xlsx|xls)$/i, '')
  }

  return result
}

// ─── Preview from .xlsx file ───

export async function previewXLSFormFromFile(file: File): Promise<{
  fieldCount: number
  groupCount: number
  repeatGroupCount: number
  warnings: string[]
  languages: string[]
  fieldTypes: Record<string, number>
}> {
  try {
    const result = await importXLSFormFromFile(file)
    const fieldTypes: Record<string, number> = {}
    for (const f of result.form.fields) {
      fieldTypes[f.type] = (fieldTypes[f.type] || 0) + 1
    }
    return {
      fieldCount: result.form.fields.length,
      groupCount: result.form.groups?.length || 0,
      repeatGroupCount: result.form.repeatGroups?.length || 0,
      warnings: result.warnings,
      languages: result.form.languages || [],
      fieldTypes,
    }
  } catch (e: any) {
    return {
      fieldCount: 0,
      groupCount: 0,
      repeatGroupCount: 0,
      warnings: [e.message || 'Failed to parse file'],
      languages: [],
      fieldTypes: {},
    }
  }
}
