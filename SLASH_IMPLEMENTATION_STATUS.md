# SLASH Platform vs ODK Ecosystem — Full Comparison & Flow Documentation

## Table of Contents

1. [What is SLASH?](#what-is-slash)
2. [What is ODK?](#what-is-odk)
3. [Similarities — What They Share](#similarities)
4. [Differences — What Sets SLASH Apart](#differences)
5. [Feature-by-Feature Comparison](#feature-comparison)
6. [Architecture Comparison](#architecture-comparison)
7. [How SLASH Works — Complete Flow](#how-slash-works)
8. [How ODK Works — Complete Flow](#how-odk-works)
9. [Form Builder Comparison](#form-builder-comparison)
10. [Data Collection Flow Comparison](#data-collection-flow)
11. [Submission Review Comparison](#submission-review)
12. [Export & Interoperability](#export-interoperability)
13. [What ODK Has That SLASH Is Building](#gaps)
14. [What SLASH Has Beyond ODK](#beyond-odk)

---

## 1. What is SLASH? <a name="what-is-slash"></a>

SLASH is an offline-first health data collection and laboratory management platform built as a Progressive Web App (PWA). It combines ODK-style form building and data collection with specialized lab/sample workflows and AI-driven data quality analytics.

**Tech Stack:** Next.js 16 + React 19, IndexedDB (write-behind cache), Supabase (cloud sync), Vercel (hosting)

**Primary Use Case:** Field health research — collecting household, participant, and sample data in low-connectivity environments, then processing samples through a lab workflow with AI-powered quality checks.

---

## 2. What is ODK? <a name="what-is-odk"></a>

Open Data Kit (ODK) is an open-source ecosystem for mobile data collection. The core components are:

- **ODK Central** — Server for project management, user auth, submission storage, and review
- **ODK Collect** — Android app for offline form filling
- **XLSForm** — Spreadsheet-based form authoring standard
- **XForms** — XML standard for form definitions (OpenRosa compliant)

**Related Platforms:** KoboToolbox (hosted ODK with a drag-drop builder), SurveyCTO (commercial ODK-based platform with advanced features)

---

## 3. Similarities — What They Share <a name="similarities"></a>

SLASH was designed with ODK concepts at its core. Here are the shared foundations:

### 3.1 XForms Standard Compliance

Both systems use the XForms/XLSForm standard for defining forms:

| Concept | ODK | SLASH |
|---|---|---|
| Form definition format | XForm XML (OpenRosa) | Internal JSON model + XForm XML export |
| Authoring format | XLSForm spreadsheet | Visual builder + XLSForm CSV export |
| Namespace support | `xmlns:jr`, `xmlns:odk`, `xmlns:orx` | Same namespaces in export |
| Instance model | `<instance><data>` tree | `buildInstanceFields()` generates same tree |
| Bind definitions | `<bind nodeset="..." type="..." required="...">` | Same bind structure in export |

### 3.2 Field Types

Both platforms support the same core question types:

| Type | ODK XLSForm | SLASH |
|---|---|---|
| Free text | `text` | `text` |
| Whole number | `integer` | `integer` |
| Decimal | `decimal` | `decimal` |
| Single choice | `select_one` | `select` / `radio` |
| Multiple choice | `select_multiple` | `checkbox` |
| Date | `date` | `date` |
| Time | `time` | `time` |
| Date + Time | `dateTime` | `dateTime` |
| GPS location | `geopoint` | `gps` |
| Barcode | `barcode` | `barcode` |
| Image | `image` | `image` |
| File | `file` | `file` |
| Note | `note` | `note` |
| Calculated | `calculate` | `calculate` |
| Range slider | `range` | `range` |
| Ranking | `rank` | `ranking` |
| Likert scale | Custom appearance | `likert` (native type) |
| Rating | Custom widget | `rating` (native type) |
| Email | `text` + appearance | `email` (native type) |
| Phone | `text` + appearance | `phone` (native type) |

### 3.3 Form Logic Engine

Both implement the same logical constructs:

**Skip Logic (Relevance)**
- ODK: `relevant` column in XLSForm with XPath expressions
- SLASH: `relevance` array with conditions — same operators: `eq`, `neq`, `gt`, `gte`, `lt`, `lte`, `contains`, `not_contains`, `is_empty`, `is_not_empty`, `in`, `not_in`
- Both support AND/OR conjunction chaining

**Constraints (Validation)**
- ODK: `constraint` column with XPath expressions + `constraint_message`
- SLASH: `constraints` array with typed rules: `regex`, `range`, `length`, `email`, `phone`, `url`, `custom_expression`, `unique`
- Both validate on blur and on submit

**Calculated Fields**
- ODK: `calculate` column with XPath expressions
- SLASH: `calculation` property with `${fieldId}` variable substitution
- Shared functions: `count()`, `selected()`, `count-selected()`, `if()`, `today()`, `now()`, `concat()`, `round()`, `int()`, `string-length()`, `substr()`, `not()`, `coalesce()`, `min()`, `max()`, `sum()`

**Cascading Selects**
- ODK: `choice_filter` column referencing parent fields
- SLASH: `cascadingParentId` + `cascadingChoices[]` with `parentValue` filtering, plus `choiceFilterExpression` for expression-based filtering

### 3.4 Groups and Repeat Groups

| Concept | ODK | SLASH |
|---|---|---|
| Group | `begin_group` / `end_group` | `FormGroupMeta` with `groupId` on fields |
| Repeat | `begin_repeat` / `end_repeat` | `RepeatGroupMeta` with `repeatGroupId` on fields |
| Field-list | `appearance="field-list"` on group | `appearance: "field-list"` on group |
| Repeat count | `repeat_count` | `repeatMin` / `repeatMax` constraints |
| Repeat field keying | Indexed instance nodes | `fieldId__instanceIndex` pattern |

### 3.5 Appearances

| Appearance | ODK | SLASH |
|---|---|---|
| Quick (auto-advance) | `quick` on select_one | `appearance: "quick"` — auto-advances on selection |
| Horizontal choices | `horizontal` | `appearance: "horizontal"` |
| Multiline text | `multiline` | `appearance: "multiline"` — renders textarea |
| Signature | `draw` / `signature` | `appearance: "signature"` — canvas with touch/mouse |
| Minimal dropdown | `minimal` | `appearance: "minimal"` |
| Or Other | `or_other` keyword | `orOther: true` — appends "Other" option + free text |

### 3.6 Metadata Capture

| Metadata | ODK | SLASH |
|---|---|---|
| Device ID | `deviceid` meta | `deviceId` from IndexedDB |
| Start time | `start` meta | `startedAt` ref timestamp |
| End time | `end` meta | `completedAt` on submit |
| Today's date | `today` meta | `today` ISO date string |

### 3.7 Audit Logging

| Feature | ODK | SLASH |
|---|---|---|
| Form open | `audit` meta type | `form_open` event |
| Field changes | Location + value tracking | `field_change` with `oldValue`/`newValue` |
| Constraint violations | Logged in audit CSV | `constraint_violation` event |
| Draft saves | Event logged | `save_draft` event |
| Final submission | Event logged | `submit` event |

### 3.8 Submission Review Workflow

| State | ODK Central | SLASH |
|---|---|---|
| New submission | `received` | `received` (blue badge) |
| Issues flagged | `hasIssues` | `hasIssues` (amber badge) |
| Approved | `approved` | `approved` (green badge) |
| Rejected | `rejected` | `rejected` (red badge) |
| Comments | Threaded per submission | Threaded per submission with author + timestamp |

### 3.9 Project & User Model

| Concept | ODK Central | SLASH |
|---|---|---|
| Projects | Container for forms + users | `OdkProject` with name, description, archived |
| App Users | Per-project, token auth, for Collect | `OdkAppUser` with token, per-project, QR enrollment |
| Web Users | Site-wide, email + password | `OdkWebUser` with email, siteRole (admin/none) |
| Form lifecycle | Draft → Published → Closing → Closed | `draft` / `published` + `odkStatus`: open/closing/closed |

---

## 4. Differences — What Sets SLASH Apart <a name="differences"></a>

### 4.1 Platform Architecture

| Aspect | ODK | SLASH |
|---|---|---|
| Client | Native Android app (ODK Collect) | Progressive Web App — runs in any browser |
| Installation | Google Play Store download | No install needed, or "Add to Home Screen" |
| Cross-platform | Android only (Collect), web for management | Any device with a browser (Android, iOS, desktop) |
| Updates | Manual app update from Play Store | Auto-updates on page load (service worker) |
| Server | Self-hosted Node.js + PostgreSQL | Supabase (managed) + Vercel (frontend) |
| Offline storage | SQLite on device | IndexedDB with write-behind cache pattern |
| Form definition | XLSForm → XForm XML (file-based) | JSON model in IndexedDB (no file management) |

### 4.2 Form Builder

| Aspect | ODK / KoboToolbox | SLASH |
|---|---|---|
| Builder type | KoboToolbox web builder or XLSForm spreadsheet | 3-panel visual designer (tree + canvas + properties) |
| Drag-drop | KoboToolbox: yes, ODK: no (spreadsheet only) | Full drag-drop with dnd-kit |
| Live preview | Separate preview tool (Enketo) | Inline mobile-frame preview |
| Undo/redo | KoboToolbox: limited | Full 50-step undo/redo stack |
| Keyboard shortcuts | None | Ctrl+Z, Ctrl+Y, Ctrl+S, Ctrl+D, Delete |
| Inline editing | Click to expand in Kobo | Expandable cards with inline label/hint/option editing |
| Structure tree | Form outline in Kobo | Real-time hierarchical tree sidebar |
| Skip logic builder | XPath expression text input | Visual condition builder (select field → operator → value) |
| Constraint builder | XPath expression text input | Typed constraint selector (range, regex, email, phone, etc.) |
| Cascading editor | External CSV file upload | Visual parent-child option mapping |

### 4.3 Health Research Features (Not in ODK)

| Feature | Description |
|---|---|
| Lab workflow | 4-stage pipeline: Lab Queue → Results Entry → Review & QC → Sample Management |
| Sample lifecycle | Sample types, ID generation, batch processing, audit trail |
| Data chain | Household → Participant → Sample → Lab Result (linked entities) |
| AI analytics | Multi-provider AI (OpenAI, Claude, DeepSeek, Groq) for validation, anomaly detection, missing data analysis |
| Branding | Full white-label: company name, logos, favicon, color theme stored in IndexedDB |

### 4.4 Storage Architecture

**ODK:** File-based. Forms are XForm XML files on the server. Submissions are stored as XML instances in a PostgreSQL database. Collect app uses SQLite locally.

**SLASH:** Cache-first. All data lives in an in-memory cache with async IndexedDB persistence (write-behind pattern). Functions remain synchronous — zero consumer file changes when storage was migrated. Supabase provides cloud sync.

```
SLASH Storage Flow:
  Read:  In-memory cache → (miss) → IndexedDB hydration → default data
  Write: Update cache immediately → fire-and-forget IndexedDB persist → optional Supabase sync
```

---

## 5. Feature-by-Feature Comparison Table <a name="feature-comparison"></a>

| Feature | ODK/Collect | KoboToolbox | SurveyCTO | SLASH |
|---|---|---|---|---|
| Offline data collection | Yes | Yes | Yes | Yes (PWA + IndexedDB) |
| Mobile app | Android native | KoboCollect (Android) | SurveyCTO Collect | PWA (any browser) |
| iOS support | No (Android only) | No | No | Yes (PWA works on Safari) |
| Desktop support | No | Web only (management) | Web only | Yes (full app in browser) |
| Form builder (visual) | No (XLSForm only) | Yes | Yes | Yes (3-panel designer) |
| XLSForm support | Native format | Import/Export | Native format | Export format |
| XForm XML | Native format | Generated | Generated | Export format |
| Skip logic | XPath expressions | Visual + XPath | Visual + XPath | Visual condition builder |
| Constraints | XPath expressions | Visual + XPath | Visual + XPath | Typed constraint builder |
| Calculations | XPath expressions | XPath | XPath | Expression evaluator (16 functions) |
| Repeat groups | Yes | Yes | Yes | Yes |
| Cascading selects | CSV-based | CSV-based | CSV-based | Visual editor (no CSV needed) |
| Groups / sections | Yes | Yes | Yes | Yes + field-list appearance |
| or_other | Yes | Yes | Yes | Yes |
| Appearances | 15+ types | 15+ types | 15+ types | 8 types (expanding) |
| Multi-language | Yes (XLSForm columns) | Yes | Yes | Yes (translations record) |
| Barcode scanning | Yes (via Collect) | Yes | Yes | Yes (BarcodeDetector API) |
| GPS capture | Yes | Yes | Yes | Yes |
| Signature capture | External app | External app | External app | Built-in canvas |
| Photo/audio capture | Yes (native camera) | Yes | Yes | File upload (native capture planned) |
| Randomize choices | Yes | Yes | Yes | Yes (Fisher-Yates seeded) |
| Guidance hints | Yes | Yes | Yes | Yes (collapsible) |
| Auto-advance (quick) | Yes | Yes | Yes | Yes |
| Audit trail | CSV attachment | Limited | Yes | JSON event log on response |
| Submission review | 4-state workflow | Limited | Yes | 4-state workflow + comments |
| Draft saving | Yes | Yes | Yes | Yes |
| Submission editing | Yes (via Collect) | Yes | Yes | Yes (?responseId= URL param) |
| Export formats | CSV, OData, JSON | CSV, XLS, KML, JSON | CSV, Stata, SPSS | XForm XML, XLSForm CSV, JSON |
| API access | RESTful + OData | RESTful | RESTful | REST endpoints (expanding) |
| End-to-end encryption | Planned | Partial | Yes | Planned |
| Webhooks | Planned | Yes | Yes | Planned |
| Lab workflow | No | No | No | Yes (core feature) |
| AI analytics | No | No | Emerging | Yes (4 providers) |
| White-label branding | Self-host only | No | Logo only | Full branding system |
| Rating widget | Custom | Custom | Custom | Native field type |
| Likert scale | Custom | Custom | Custom | Native field type |

---

## 6. Architecture Comparison <a name="architecture-comparison"></a>

### ODK Architecture

```
┌─────────────────────────────────────────────┐
│  ODK Collect (Android)                      │
│  ├─ XForm XML parser (JavaRosa)             │
│  ├─ SQLite local storage                    │
│  ├─ Camera/GPS/barcode via Android APIs      │
│  └─ OpenRosa submission protocol             │
└───────────────────┬─────────────────────────┘
                    │ HTTP POST (multipart XML)
                    ▼
┌─────────────────────────────────────────────┐
│  ODK Central (Node.js)                      │
│  ├─ PostgreSQL database                     │
│  ├─ User authentication (sessions)          │
│  ├─ Project/form/submission management      │
│  ├─ OData feed for data access              │
│  └─ REST API for management                 │
└───────────────────┬─────────────────────────┘
                    │ OData / REST
                    ▼
┌─────────────────────────────────────────────┐
│  External Tools                             │
│  ├─ Power BI, Excel (via OData)             │
│  ├─ R, Python (via ruODK, pyODK)           │
│  └─ Custom integrations (REST API)          │
└─────────────────────────────────────────────┘
```

### SLASH Architecture

```
┌─────────────────────────────────────────────┐
│  SLASH PWA (Browser — any device)           │
│  ├─ Next.js 16 + React 19 (app router)     │
│  ├─ IndexedDB (write-behind cache)          │
│  │   ├─ SLASH_PWA_DB (forms, responses,     │
│  │   │   settings, sync)                    │
│  │   └─ SLASH_ODK_DB (projects, submissions,│
│  │       comments, users)                   │
│  ├─ Form logic engine (JS-based)            │
│  ├─ BarcodeDetector API, Geolocation API    │
│  └─ Service worker (offline caching)        │
└───────────────────┬─────────────────────────┘
                    │ REST API calls
                    ▼
┌─────────────────────────────────────────────┐
│  Vercel (Next.js API Routes)                │
│  ├─ /api/ai/analyze (AI provider routing)   │
│  ├─ /api/ai/test (provider connectivity)    │
│  ├─ /api/auth/* (login, register, session)  │
│  ├─ /api/samples/* (sample CRUD)            │
│  ├─ /api/households, /api/participants      │
│  └─ /api/database/init                      │
└───────────────────┬─────────────────────────┘
                    │ Supabase Client SDK
                    ▼
┌─────────────────────────────────────────────┐
│  Supabase (Cloud Backend)                   │
│  ├─ PostgreSQL database                     │
│  ├─ Auth (planned: full RLS)                │
│  ├─ Storage (planned: file uploads)         │
│  └─ Realtime (planned: live sync)           │
└───────────────────┬─────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────┐
│  AI Providers (External APIs)               │
│  ├─ OpenAI (GPT-4, GPT-3.5)               │
│  ├─ Anthropic Claude                        │
│  ├─ DeepSeek                                │
│  └─ Groq                                    │
└─────────────────────────────────────────────┘
```

---

## 7. How SLASH Works — Complete Flow <a name="how-slash-works"></a>

### 7.1 Form Design Flow

```
Admin logs in
    ↓
Dashboard → Data Collection → Form Builder
    ↓
┌──────────────────────────────────────────────────────┐
│  3-Panel Form Designer                                │
│                                                      │
│  ┌──────────┐  ┌──────────────┐  ┌────────────────┐ │
│  │ Structure │  │   Canvas     │  │  Properties    │ │
│  │ Tree      │  │              │  │  Panel         │ │
│  │           │  │  Question 1  │  │                │ │
│  │ ▸ Group A │  │  ┌────────┐  │  │ [General]      │ │
│  │   Q1      │  │  │ Label  │  │  │  Label: ___   │ │
│  │   Q2      │  │  │ Hint   │  │  │  Hint: ___    │ │
│  │ ▸ Group B │  │  │ Options│  │  │  Required: ☑  │ │
│  │   Q3      │  │  └────────┘  │  │                │ │
│  │   Q4      │  │              │  │ [Logic]        │ │
│  │           │  │  Question 2  │  │  Skip Logic    │ │
│  │           │  │  ┌────────┐  │  │  Constraints   │ │
│  │           │  │  │ ...    │  │  │  Cascading     │ │
│  │           │  │  └────────┘  │  │                │ │
│  │           │  │              │  │ [Display]      │ │
│  │           │  │  [+ Question]│  │  Appearance    │ │
│  └──────────┘  └──────────────┘  └────────────────┘ │
│                                                      │
│  Toolbar: [Form Name] [Type ▾] [+ Question] [Group]  │
│           [Repeat] [Undo] [Redo] [Preview] [Save]    │
│           [Publish] [Export ▾]                        │
└──────────────────────────────────────────────────────┘
```

**Step-by-step:**

1. **Create form** — Click "New Form", enter name, select type (Survey/Sample)
2. **Add questions** — Click "+ Question", pick type from categorized picker (Text, Choice, Date, Media, Location, Advanced)
3. **Configure questions** — Select a question card to open the 3-tab Properties Panel:
   - **General**: Label, hint, placeholder, required, options (for choice fields), or_other, randomize
   - **Logic**: Skip logic conditions (visual builder), constraints (typed rules), cascading selects (parent-child mapping), choice filter expressions
   - **Display**: Appearance, group assignment, repeat group assignment
4. **Organize structure** — Create groups (sections) and repeat groups; drag questions between them
5. **Preview** — Click Preview to see mobile-frame rendering with live skip logic
6. **Save/Publish** — Save as draft or publish (creates version, enables public form link)
7. **Export** — Download as XForm XML or XLSForm CSV

### 7.2 Data Collection Flow

```
Respondent opens form link: /form/[id]
    ↓
Load form definition from IndexedDB cache
    ↓
Initialize responses, audit log, metadata
    ↓
Build sections from groups (merge field-list groups)
    ↓
┌─────────────────────────────────────────────┐
│  FORM RUNTIME                               │
│                                             │
│  ┌─────────────────────────────────────┐    │
│  │ Progress: ████████░░░ 68%           │    │
│  │ Language: [English ▾]               │    │
│  └─────────────────────────────────────┘    │
│                                             │
│  Section tabs: [Demographics] [Health] ...  │
│                                             │
│  ┌─────────────────────────────────────┐    │
│  │ 1. Full Name *                      │    │
│  │    ┌──────────────────────────┐     │    │
│  │    │ John Kamau               │     │    │
│  │    └──────────────────────────┘     │    │
│  │                                     │    │
│  │ 2. Age *                            │    │
│  │    ┌──────────────────────────┐     │    │
│  │    │ 34                       │     │    │
│  │    └──────────────────────────┘     │    │
│  │                                     │    │
│  │ 3. Water Source                     │    │
│  │    ○ Well  ○ River  ● Other         │    │
│  │                                     │    │
│  │ 3a. Specify other: [Borehole     ]  │ ← Shown by skip logic
│  │                                     │    │
│  │ fx Total Members: 7                 │ ← Calculated field
│  └─────────────────────────────────────┘    │
│                                             │
│  [Save Draft]            [Next Section →]   │
│  ░░░░░░░░░░░░░░░░░░░░░ 68%                 │
└─────────────────────────────────────────────┘
```

**On every field change:**
1. Update `responses` state
2. Clear previous error for that field
3. Recompute all calculated fields via `computeCalculatedFields()`
4. Re-evaluate skip logic via `evaluateRelevance()` for all fields
5. Re-filter cascading select options via `getCascadingOptions()`
6. Log `field_change` audit event with old/new values

**On field blur:**
1. Validate field constraints via `validateFieldConstraints()`
2. Display field-level error (red border + message)

**On submit:**
1. `validateAll()` — check all visible required fields + constraints
2. If invalid: scroll to first error, highlight section tab
3. If valid: build metadata (deviceId, timestamps), finalize audit log
4. Create `FormResponse` object with all data
5. Persist to IndexedDB via `saveFormResponses()`
6. Show success confirmation screen

### 7.3 Repeat Groups at Runtime

```
Sample Collection (2 instances)

  ┌─ Instance 1 ─────────────────────────┐
  │  Sample ID: [SMP-001            ]     │
  │  Sample Type: [Blood ▾]              │
  │  Collection Date: [2024-11-20]        │
  └───────────────────────────────────────┘

  ┌─ Instance 2 ─────────────────────────┐
  │  Sample ID: [SMP-002            ]     │
  │  Sample Type: [Urine ▾]             │
  │  Collection Date: [2024-11-20]        │
  └───────────────────────────────────────┘

  [+ Add Another]    [Remove Last]
```

- Field keys: `sample_id__0`, `sample_id__1`, etc.
- Min/max constraints enforced on add/remove buttons
- Each instance validated independently

### 7.4 Submission Review Flow

```
Submission arrives (status: "received")
    ↓
Reviewer opens Submissions page
    ↓
Filter by project/form/state/submitter
    ↓
Click submission → Detail view
    ↓
┌───────────────────────────────────────────────┐
│  Two-Column Review                            │
│                                               │
│  ┌─────────────────┐  ┌────────────────────┐  │
│  │ Response Data    │  │ Review Panel       │  │
│  │                  │  │                    │  │
│  │ Name: John Kamau │  │ Status: [▾ Approved] │
│  │ Age: 34          │  │                    │  │
│  │ Water: Other     │  │ Comments:          │  │
│  │ Other: Borehole  │  │ ┌────────────────┐ │  │
│  │ Members: 7       │  │ │ Looks good,    │ │  │
│  │                  │  │ │ approved.      │ │  │
│  │ [Edit] [Cancel]  │  │ │     — Admin    │ │  │
│  │                  │  │ │     2h ago     │ │  │
│  └─────────────────┘  │ └────────────────┘ │  │
│                        │ [Add comment...]   │  │
│                        └────────────────────┘  │
└───────────────────────────────────────────────┘
```

**Review States:**
- `received` (blue) → Just submitted, awaiting review
- `hasIssues` (amber) → Reviewer flagged problems
- `approved` (green) → Data accepted
- `rejected` (red) → Data invalid, needs resubmission

### 7.5 Lab Workflow (SLASH-specific)

```
Field Collection → Lab Queue → Results Entry → QC Review → Approved
    ↓                  ↓            ↓              ↓
  Samples           Pending      Test data      Quality
  collected         processing   entered        verified
```

Four tabs in the Lab Workflow page:
1. **Lab Queue** — View pending samples/submissions
2. **Results Entry** — Input test results (batch processing)
3. **Review & QC** — Quality control verification
4. **Sample Management** — Track physical sample lifecycle

### 7.6 AI Analytics Flow

```
Collected Data (IndexedDB)
    ↓
Admin triggers analysis (AI Analytics page)
    ↓
POST /api/ai/analyze
    ↓
Server resolves API key:
  Environment variable (preferred) → Browser-stored key (fallback)
    ↓
AI Provider processes data:
  OpenAI / Claude / DeepSeek / Groq
    ↓
Returns analysis results:
  ├─ Data validation findings
  ├─ Missing data detection
  ├─ Anomaly detection
  └─ Summary insights
    ↓
Results displayed in AI Dashboard
```

---

## 8. How ODK Works — Complete Flow <a name="how-odk-works"></a>

```
1. FORM DESIGN
   Author creates XLSForm in Excel/Google Sheets
   Upload to ODK Central → Server converts to XForm XML

2. DISTRIBUTION
   Create project in Central → Add form → Create App Users
   Field worker installs ODK Collect → Scans QR code to enroll
   Collect downloads form definition (XForm XML)

3. DATA COLLECTION
   Field worker opens Collect → Selects form → Fills offline
   Collect stores submission as XML instance in SQLite
   When online → Collect POSTs submission to Central (OpenRosa protocol)

4. REVIEW
   Reviewer logs into Central web UI
   Views submissions in table → Changes review state
   Exports data via OData feed or CSV download

5. ANALYSIS
   Connect Power BI / R / Python to OData endpoint
   Or download CSV and analyze in Excel/Stata/SPSS
```

---

## 9. Form Builder Comparison <a name="form-builder-comparison"></a>

### ODK / KoboToolbox Builder

```
┌─────────────────────────────────────────┐
│  KoboToolbox Form Builder               │
│                                         │
│  ┌─────────────────────────────────┐    │
│  │ Question 1 (text)               │    │
│  │  What is your name?             │    │
│  │  [click to edit]                │    │
│  ├─────────────────────────────────┤    │
│  │ Question 2 (select_one)         │    │
│  │  Gender                         │    │
│  │  ○ Male  ○ Female               │    │
│  ├─────────────────────────────────┤    │
│  │ [+ Add Question]               │    │
│  └─────────────────────────────────┘    │
│                                         │
│  Settings panel (right side):           │
│  - Skip logic: XPath text input         │
│  - Validation: XPath text input         │
│  - Appearance: dropdown                 │
└─────────────────────────────────────────┘
```

### SLASH Builder

```
┌──────────────────────────────────────────────────────┐
│  SLASH Form Designer (3-Panel)                        │
│                                                      │
│  ┌──────────┐ ┌──────────────┐ ┌──────────────────┐  │
│  │ Structure │ │ Canvas       │ │ Properties       │  │
│  │ (18%)     │ │ (50%)        │ │ (32%)            │  │
│  │           │ │              │ │                  │  │
│  │ Hierarchy │ │ Drag-drop    │ │ [General|Logic|  │  │
│  │ tree with │ │ cards with   │ │  Display]        │  │
│  │ groups +  │ │ inline edit  │ │                  │  │
│  │ repeats   │ │ + badges     │ │ Visual builders  │  │
│  │           │ │              │ │ for logic +      │  │
│  │ Click to  │ │ Expand to    │ │ constraints      │  │
│  │ navigate  │ │ edit options │ │ (no XPath needed)│  │
│  └──────────┘ └──────────────┘ └──────────────────┘  │
└──────────────────────────────────────────────────────┘
```

**Key Difference:** ODK/KoboToolbox requires XPath expression knowledge for logic and validation. SLASH provides visual builders — select field, pick operator, enter value. No expression syntax needed.

---

## 10. Data Collection Flow Comparison <a name="data-collection-flow"></a>

| Step | ODK Collect | SLASH PWA |
|---|---|---|
| Form access | Download from Central on sync | Open URL in browser (instant) |
| Offline support | Full (SQLite) | Full (IndexedDB) |
| Section navigation | Swipe or dropdown | Tab/sidebar navigation |
| Progress tracking | Question counter | Percentage bar (required fields) |
| Skip logic | XPath evaluation (JavaRosa) | JavaScript condition evaluation |
| Constraint validation | XPath with error message | Typed validators with error message |
| Calculated fields | XPath evaluation | Expression evaluator with `${field}` refs |
| Repeat groups | Add/remove instances | Add/remove with min/max enforcement |
| Cascading selects | CSV lookup file | In-memory parent-child filtering |
| Choice filter | XPath expression | Expression-based filtering |
| Signature | External draw app | Built-in canvas |
| GPS | Android location API | Browser Geolocation API |
| Barcode | Android camera + ZXing | BarcodeDetector API |
| Photo | Android camera intent | File input (native camera planned) |
| Draft save | Save as draft in Collect | Save draft to IndexedDB |
| Submission | POST XML to Central | Save to IndexedDB (+ Supabase sync) |
| Multi-language | Switch in Collect settings | Language selector dropdown in form header |

---

## 11. Submission Review Comparison <a name="submission-review"></a>

| Feature | ODK Central | SLASH |
|---|---|---|
| Review states | received, hasIssues, approved, rejected | Same 4 states |
| Comments | Yes, threaded | Yes, threaded with author + timestamp |
| Inline editing | Yes (edit specific fields) | Yes (toggle edit mode, save/cancel) |
| Bulk actions | Set state on multiple | Per-submission |
| Filtering | By form, submission date | By project, form, state, submitter, search text |
| Data table | Spreadsheet-like view | Response card view grouped by section |
| Export | OData feed, CSV | CSV, JSON |

---

## 12. Export & Interoperability <a name="export-interoperability"></a>

### XForm XML Export (SLASH → ODK)

SLASH exports forms as OpenRosa-compliant XForm XML that can be imported into ODK Central:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<h:html xmlns="http://www.w3.org/2002/xforms"
        xmlns:h="http://www.w3.org/1999/xhtml"
        xmlns:jr="http://openrosa.org/javarosa"
        xmlns:orx="http://openrosa.org/xforms"
        xmlns:odk="http://www.opendatakit.org/xforms"
        xmlns:xsd="http://www.w3.org/2001/XMLSchema">
  <h:head>
    <h:title>Household Survey</h:title>
    <model odk:xforms-version="1.0.0">
      <instance>
        <data id="household_survey" version="1">
          <name/>
          <age/>
          <demographics>
            <water_source/>
          </demographics>
        </data>
      </instance>
      <bind nodeset="/data/name" type="string" required="true()"/>
      <bind nodeset="/data/age" type="int" required="true()"
            constraint=". > 0 and . &lt;= 120"
            jr:constraintMsg="Age must be 1-120"/>
      <bind nodeset="/data/demographics/water_source" type="string"
            relevant="/data/age > 18"/>
    </model>
  </h:head>
  <h:body>
    <input ref="/data/name"><label>Full Name</label></input>
    <input ref="/data/age"><label>Age</label></input>
    <group ref="/data/demographics">
      <label>Demographics</label>
      <select1 ref="/data/demographics/water_source">
        <label>Water Source</label>
        <item><label>Well</label><value>well</value></item>
        <item><label>River</label><value>river</value></item>
      </select1>
    </group>
  </h:body>
</h:html>
```

### XLSForm CSV Export (SLASH → KoboToolbox/SurveyCTO)

SLASH exports as tab-separated XLSForm with 3 worksheets:

**Survey sheet:**
```
type    name    label    hint    required    relevant    constraint    ...
text    name    Full Name        yes
integer age     Age              yes                     . > 0 and . <= 120
begin_group demographics Demographics
select_one water_list water_source Water Source    no    ${age} > 18
end_group
```

**Choices sheet:**
```
list_name    name    label
water_list   well    Well
water_list   river   River
```

**Settings sheet:**
```
form_title         form_id             version
Household Survey   household_survey    1
```

---

## 13. What ODK Has That SLASH Is Building <a name="gaps"></a>

| Feature | Status in SLASH | Priority |
|---|---|---|
| End-to-end encryption | Planned | High |
| Production sync engine (bi-directional, conflict resolution) | Supabase layer exists, not fully wired | High |
| Server-enforced permissions (Row Level Security) | UI roles exist, server RLS pending | High |
| OData feed | Not yet | Medium |
| Webhooks | Not yet | Medium |
| Native photo/audio capture | File upload exists, native capture planned | Medium |
| External datasets (pulldata CSV) | Architecture designed, not wired | Medium |
| Stata/SPSS export | Not yet | Low |
| Scheduled QC reports | AI analysis is manual, automation planned | Medium |
| Unique constraint (server-side) | Async validation designed, not wired | Low |

---

## 14. What SLASH Has Beyond ODK <a name="beyond-odk"></a>

| Feature | What It Does |
|---|---|
| **AI-Driven Data Quality** | 4-provider AI (OpenAI, Claude, DeepSeek, Groq) analyzes submissions for validation errors, anomalies, missing data, and generates summary insights |
| **Lab Workflow** | 4-stage sample processing pipeline: Queue → Entry → QC → Management |
| **Sample Lifecycle** | Full sample tracking from collection through lab analysis with audit trail |
| **Health Data Chain** | Linked entities: Household → Participant → Sample → Lab Result |
| **PWA Architecture** | Works in any browser on any device — no app store install, auto-updates |
| **Visual Logic Builder** | No XPath knowledge needed — point-and-click skip logic and constraint configuration |
| **Built-in Signature** | Canvas-based drawing directly in the form (no external app) |
| **Native Likert/Rating** | Dedicated field types with specialized UI (not custom appearances) |
| **Full Branding** | White-label the entire platform: name, logos, favicon, theme color |
| **Write-Behind Cache** | Synchronous API with async IndexedDB persistence — zero-latency reads |
| **3-Panel Designer** | Structure tree + drag-drop canvas + tabbed properties (beyond KoboToolbox's builder) |
| **50-Step Undo/Redo** | Full state snapshot history in the form builder |
| **Keyboard Shortcuts** | Ctrl+Z/Y/S/D, Delete — power user support in form builder |
| **dateTime Combo** | Single field type combining date and time (ODK requires two separate fields) |
| **Seeded Randomization** | Choice randomization uses Fisher-Yates with field ID seed — consistent within session |
