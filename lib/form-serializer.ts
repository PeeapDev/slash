import type { Form, FormField, FieldCondition, FieldConstraint } from './form-store'

// ─── XPath helpers ───

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

function fieldRef(fieldId: string): string {
  return `/data/${fieldId}`
}

function conditionToXPath(conditions: FieldCondition[]): string {
  if (!conditions || conditions.length === 0) return ''
  const parts: string[] = []
  for (let i = 0; i < conditions.length; i++) {
    const c = conditions[i]
    const ref = fieldRef(c.fieldId)
    let expr = ''
    switch (c.operator) {
      case 'eq': expr = `${ref} = '${c.value}'`; break
      case 'neq': expr = `${ref} != '${c.value}'`; break
      case 'gt': expr = `${ref} > ${c.value}`; break
      case 'gte': expr = `${ref} >= ${c.value}`; break
      case 'lt': expr = `${ref} < ${c.value}`; break
      case 'lte': expr = `${ref} <= ${c.value}`; break
      case 'contains': expr = `contains(${ref}, '${c.value}')`; break
      case 'not_contains': expr = `not(contains(${ref}, '${c.value}'))`; break
      case 'is_empty': expr = `${ref} = ''`; break
      case 'is_not_empty': expr = `${ref} != ''`; break
      case 'in': {
        const vals = String(c.value).split(',').map(v => `${ref} = '${v.trim()}'`)
        expr = `(${vals.join(' or ')})`
        break
      }
      case 'not_in': {
        const vals = String(c.value).split(',').map(v => `${ref} != '${v.trim()}'`)
        expr = `(${vals.join(' and ')})`
        break
      }
      default: expr = `${ref} = '${c.value}'`
    }
    if (i > 0) {
      const conj = conditions[i - 1].conjunction || 'and'
      parts.push(conj)
    }
    parts.push(expr)
  }
  return parts.join(' ')
}

function constraintToXPath(constraints: FieldConstraint[], fieldId: string): string {
  if (!constraints || constraints.length === 0) return ''
  const ref = '.'
  const parts: string[] = []
  for (const c of constraints) {
    switch (c.type) {
      case 'range': {
        const exprs: string[] = []
        if (c.min !== undefined) exprs.push(`${ref} >= ${c.min}`)
        if (c.max !== undefined) exprs.push(`${ref} <= ${c.max}`)
        if (exprs.length) parts.push(exprs.join(' and '))
        break
      }
      case 'length': {
        const exprs: string[] = []
        if (c.min !== undefined) exprs.push(`string-length(${ref}) >= ${c.min}`)
        if (c.max !== undefined) exprs.push(`string-length(${ref}) <= ${c.max}`)
        if (exprs.length) parts.push(exprs.join(' and '))
        break
      }
      case 'regex':
        parts.push(`regex(${ref}, '${c.value}')`)
        break
      case 'email':
        parts.push(`regex(${ref}, '[^@]+@[^@]+\\.[^@]+')`)
        break
      case 'phone':
        parts.push(`regex(${ref}, '^\\+?[0-9\\s\\-]{7,15}$')`)
        break
      case 'url':
        parts.push(`regex(${ref}, '^https?://')`)
        break
      case 'custom_expression':
        if (c.value) parts.push(String(c.value))
        break
      default:
        break
    }
  }
  return parts.join(' and ')
}

function constraintMessage(constraints: FieldConstraint[]): string {
  if (!constraints || constraints.length === 0) return ''
  return constraints.map(c => c.message).filter(Boolean).join('; ')
}

// ─── XForm type mapping ───

function xformBindType(fieldType: FormField['type']): string {
  const map: Record<string, string> = {
    text: 'string', email: 'string', phone: 'string',
    number: 'int', integer: 'int', decimal: 'decimal',
    date: 'date', time: 'time', dateTime: 'dateTime',
    select: 'string', radio: 'string', checkbox: 'string',
    gps: 'geopoint', image: 'binary', file: 'binary',
    barcode: 'barcode', calculate: 'string',
    note: 'string', rating: 'int', range: 'int', likert: 'int',
    ranking: 'string',
  }
  return map[fieldType] || 'string'
}

function xformBodyElement(field: FormField): string {
  const ref = fieldRef(field.id)
  const label = `<label>${escapeXml(field.label)}</label>`
  const hint = field.hint ? `<hint>${escapeXml(field.hint)}</hint>` : ''
  const appearance = field.appearance ? ` appearance="${field.appearance}"` : ''

  switch (field.type) {
    case 'select':
    case 'radio':
    case 'likert': {
      const options = (field.options || [])
        .map(o => `<item><label>${escapeXml(o)}</label><value>${escapeXml(o)}</value></item>`)
        .join('\n            ')
      return `<select1 ref="${ref}"${appearance}>\n            ${label}\n            ${hint}\n            ${options}\n          </select1>`
    }
    case 'checkbox': {
      const options = (field.options || [])
        .map(o => `<item><label>${escapeXml(o)}</label><value>${escapeXml(o)}</value></item>`)
        .join('\n            ')
      return `<select ref="${ref}"${appearance}>\n            ${label}\n            ${hint}\n            ${options}\n          </select>`
    }
    case 'image':
      return `<upload ref="${ref}" mediatype="image/*"${appearance}>\n            ${label}\n            ${hint}\n          </upload>`
    case 'file':
      return `<upload ref="${ref}" mediatype="*/*"${appearance}>\n            ${label}\n            ${hint}\n          </upload>`
    case 'barcode':
      return `<input ref="${ref}" appearance="barcode">\n            ${label}\n            ${hint}\n          </input>`
    case 'gps':
      return `<input ref="${ref}" appearance="maps">\n            ${label}\n            ${hint}\n          </input>`
    case 'note':
      return `<input ref="${ref}" appearance="label">\n            ${label}\n            ${hint}\n          </input>`
    case 'range': {
      const rApp = field.appearance || 'default'
      const rangeAttrs = ` start="${field.rangeMin ?? 0}" end="${field.rangeMax ?? 100}" step="${field.rangeStep ?? 1}"`
      return `<range ref="${ref}" appearance="${rApp}"${rangeAttrs}>\n            ${label}\n            ${hint}\n          </range>`
    }
    default:
      return `<input ref="${ref}"${appearance}>\n            ${label}\n            ${hint}\n          </input>`
  }
}

// ─── formToXForm ───

export function formToXForm(form: Form): string {
  const formId = form.id.toLowerCase().replace(/[^a-z0-9_-]/g, '_')
  const version = form.versions?.length
    ? String(form.versions[form.versions.length - 1].version)
    : '1'

  const groups = form.groups || []
  const repeatGroups = form.repeatGroups || []
  const groupMap = new Map(groups.map(g => [g.id, g]))
  const repeatMap = new Map(repeatGroups.map(r => [r.id, r]))

  // Build grouped instance children
  const buildInstanceFields = (): string => {
    const lines: string[] = []
    const processedGroups = new Set<string>()
    const processedRepeats = new Set<string>()

    for (const f of form.fields) {
      if (f.groupId && !processedGroups.has(f.groupId)) {
        processedGroups.add(f.groupId)
        const groupFields = form.fields.filter(gf => gf.groupId === f.groupId)
        lines.push(`          <${f.groupId}>`)
        groupFields.forEach(gf => lines.push(`            <${gf.id}/>`))
        lines.push(`          </${f.groupId}>`)
      } else if (f.repeatGroupId && !processedRepeats.has(f.repeatGroupId)) {
        processedRepeats.add(f.repeatGroupId)
        const repeatFields = form.fields.filter(rf => rf.repeatGroupId === f.repeatGroupId)
        lines.push(`          <${f.repeatGroupId}>`)
        repeatFields.forEach(rf => lines.push(`            <${rf.id}/>`))
        lines.push(`          </${f.repeatGroupId}>`)
      } else if (!f.groupId && !f.repeatGroupId) {
        lines.push(`          <${f.id}/>`)
      }
    }
    return lines.join('\n')
  }

  const instanceFields = buildInstanceFields()

  // Binds (with group/repeat path prefixes)
  const getFieldPath = (f: FormField): string => {
    if (f.groupId) return `/data/${f.groupId}/${f.id}`
    if (f.repeatGroupId) return `/data/${f.repeatGroupId}/${f.id}`
    return fieldRef(f.id)
  }

  const binds = form.fields.map(f => {
    const nodeset = getFieldPath(f)
    const attrs: string[] = [`nodeset="${nodeset}"`, `type="${xformBindType(f.type)}"`]
    if (f.required) attrs.push('required="true()"')
    if (f.readOnly) attrs.push('readonly="true()"')
    if (f.relevance && f.relevance.length > 0) {
      attrs.push(`relevant="${escapeXml(conditionToXPath(f.relevance))}"`)
    }
    if (f.constraints && f.constraints.length > 0) {
      const cxpath = constraintToXPath(f.constraints, f.id)
      if (cxpath) attrs.push(`constraint="${escapeXml(cxpath)}"`)
      const cmsg = constraintMessage(f.constraints)
      if (cmsg) attrs.push(`jr:constraintMsg="${escapeXml(cmsg)}"`)
    }
    if (f.calculation) {
      const calcXPath = f.calculation.replace(/\$\{([^}]+)\}/g, (_, id) => fieldRef(id))
      attrs.push(`calculate="${escapeXml(calcXPath)}"`)
    }
    return `        <bind ${attrs.join(' ')}/>`
  }).join('\n')

  // Body elements with group/repeat wrappers
  const buildBodyElements = (): string => {
    const lines: string[] = []
    const processedGroups = new Set<string>()
    const processedRepeats = new Set<string>()

    for (const f of form.fields) {
      if (f.groupId && !processedGroups.has(f.groupId)) {
        processedGroups.add(f.groupId)
        const group = groupMap.get(f.groupId)
        const groupFields = form.fields.filter(gf => gf.groupId === f.groupId)
        const appearance = group?.appearance ? ` appearance="${group.appearance}"` : ''
        lines.push(`          <group ref="/data/${f.groupId}"${appearance}>`)
        if (group?.label) lines.push(`            <label>${escapeXml(group.label)}</label>`)
        groupFields.forEach(gf => lines.push(`            ${xformBodyElement(gf)}`))
        lines.push(`          </group>`)
      } else if (f.repeatGroupId && !processedRepeats.has(f.repeatGroupId)) {
        processedRepeats.add(f.repeatGroupId)
        const rg = repeatMap.get(f.repeatGroupId)
        const repeatFields = form.fields.filter(rf => rf.repeatGroupId === f.repeatGroupId)
        lines.push(`          <group ref="/data/${f.repeatGroupId}">`)
        if (rg?.label) lines.push(`            <label>${escapeXml(rg.label)}</label>`)
        lines.push(`            <repeat nodeset="/data/${f.repeatGroupId}">`)
        repeatFields.forEach(rf => lines.push(`              ${xformBodyElement(rf)}`))
        lines.push(`            </repeat>`)
        lines.push(`          </group>`)
      } else if (!f.groupId && !f.repeatGroupId) {
        lines.push(`          ${xformBodyElement(f)}`)
      }
    }
    return lines.join('\n')
  }

  const bodyElements = buildBodyElements()

  return `<?xml version="1.0" encoding="UTF-8"?>
<h:html xmlns="http://www.w3.org/2002/xforms"
        xmlns:h="http://www.w3.org/1999/xhtml"
        xmlns:ev="http://www.w3.org/2001/xml-events"
        xmlns:xsd="http://www.w3.org/2001/XMLSchema"
        xmlns:jr="http://openrosa.org/javarosa"
        xmlns:orx="http://openrosa.org/xforms"
        xmlns:odk="http://www.opendatakit.org/xforms">
  <h:head>
    <h:title>${escapeXml(form.name)}</h:title>
    <model odk:xforms-version="1.0.0">
      <instance>
        <data id="${formId}" version="${version}">
${instanceFields}
        </data>
      </instance>
${binds}
    </model>
  </h:head>
  <h:body>
${bodyElements}
  </h:body>
</h:html>`
}

// ─── XLSForm type mapping ───

function xlsFormType(field: FormField): string {
  const map: Record<string, string> = {
    text: 'text', email: 'text', phone: 'text',
    number: 'integer', integer: 'integer', decimal: 'decimal',
    date: 'date', time: 'time', dateTime: 'dateTime',
    gps: 'geopoint', image: 'image', file: 'file',
    barcode: 'barcode', calculate: 'calculate', note: 'note',
    rating: 'integer', range: 'range', likert: 'integer',
    ranking: 'rank',
  }
  if (field.type === 'select' || field.type === 'radio' || field.type === 'likert') {
    return `select_one ${field.id}_list`
  }
  if (field.type === 'checkbox') {
    return `select_multiple ${field.id}_list`
  }
  if (field.type === 'ranking') {
    return `rank ${field.id}_list`
  }
  return map[field.type] || 'text'
}

// ─── formToXLSForm ───

export function formToXLSForm(form: Form): { survey: string[][]; choices: string[][]; settings: string[][] } {
  const surveyHeaders = ['type', 'name', 'label', 'hint', 'required', 'relevant', 'constraint', 'constraint_message', 'calculation', 'appearance', 'default', 'read_only', 'repeat_count']
  const survey: string[][] = [surveyHeaders]

  const choicesHeaders = ['list_name', 'name', 'label']
  const choices: string[][] = [choicesHeaders]

  const groups = form.groups || []
  const repeatGroups = form.repeatGroups || []
  const groupMap = new Map(groups.map(g => [g.id, g]))
  const repeatMap = new Map(repeatGroups.map(r => [r.id, r]))
  const openedGroups = new Set<string>()
  const openedRepeats = new Set<string>()

  for (const field of form.fields) {
    // Open group if needed
    if (field.groupId && !openedGroups.has(field.groupId)) {
      openedGroups.add(field.groupId)
      const group = groupMap.get(field.groupId)
      const appearance = group?.appearance || ''
      survey.push(['begin_group', field.groupId, group?.label || field.groupId, group?.description || '', '', '', '', '', '', appearance, '', '', ''])
    }

    // Open repeat if needed
    if (field.repeatGroupId && !openedRepeats.has(field.repeatGroupId)) {
      openedRepeats.add(field.repeatGroupId)
      const rg = repeatMap.get(field.repeatGroupId)
      survey.push(['begin_repeat', field.repeatGroupId, rg?.label || field.repeatGroupId, '', '', '', '', '', '', '', '', '', ''])
    }

    const relevant = field.relevance ? conditionToXPath(field.relevance) : ''
    const constraint = field.constraints ? constraintToXPath(field.constraints, field.id) : ''
    const cMsg = field.constraints ? constraintMessage(field.constraints) : ''
    const calc = field.calculation
      ? field.calculation.replace(/\$\{([^}]+)\}/g, (_, id) => fieldRef(id))
      : ''

    survey.push([
      xlsFormType(field),
      field.id,
      field.label,
      field.hint || '',
      field.required ? 'yes' : '',
      relevant,
      constraint,
      cMsg,
      calc,
      field.appearance || '',
      field.defaultValue !== undefined ? String(field.defaultValue) : '',
      field.readOnly ? 'yes' : '',
      '',
    ])

    // Choices
    if (['select', 'radio', 'checkbox', 'likert', 'ranking'].includes(field.type) && field.options) {
      const listName = `${field.id}_list`
      for (const opt of field.options) {
        const optValue = opt.toLowerCase().replace(/[^a-z0-9]/g, '_')
        choices.push([listName, optValue, opt])
      }
    }

    // Close repeat if this is the last field in the repeat
    if (field.repeatGroupId) {
      const repeatFields = form.fields.filter(f => f.repeatGroupId === field.repeatGroupId)
      if (repeatFields[repeatFields.length - 1]?.id === field.id) {
        survey.push(['end_repeat', '', '', '', '', '', '', '', '', '', '', '', ''])
      }
    }

    // Close group if this is the last field in the group
    if (field.groupId) {
      const groupFields = form.fields.filter(f => f.groupId === field.groupId)
      if (groupFields[groupFields.length - 1]?.id === field.id) {
        survey.push(['end_group', '', '', '', '', '', '', '', '', '', '', '', ''])
      }
    }
  }

  const version = form.versions?.length
    ? String(form.versions[form.versions.length - 1].version)
    : '1'

  const settings: string[][] = [
    ['form_title', 'form_id', 'version'],
    [form.name, form.id, version],
  ]

  return { survey, choices, settings }
}

// ─── Export helpers ───

export function exportXLSFormAsCSV(sheets: { survey: string[][]; choices: string[][]; settings: string[][] }): string {
  const sheetToCSV = (rows: string[][]): string =>
    rows.map(row => row.map(cell => {
      const val = String(cell)
      if (val.includes('\t') || val.includes('"') || val.includes('\n')) {
        return `"${val.replace(/"/g, '""')}"`
      }
      return val
    }).join('\t')).join('\n')

  return [
    '## survey',
    sheetToCSV(sheets.survey),
    '',
    '## choices',
    sheetToCSV(sheets.choices),
    '',
    '## settings',
    sheetToCSV(sheets.settings),
  ].join('\n')
}

export function downloadAsFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
