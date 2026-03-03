# SLASH Platform - Implementation Status & Comparison with ODK

## What is SLASH?

SLASH is an offline-first health data collection and laboratory management platform built as a Progressive Web App (PWA). It combines ODK-style form building and data collection with specialized lab/sample workflows and AI-driven data quality analytics.

---

## Similarities with ODK / KoboToolbox / SurveyCTO

SLASH shares the same core philosophy and many of the same capabilities as the ODK ecosystem:

| Feature | ODK / KoboToolbox / SurveyCTO | SLASH |
|---|---|---|
| **XForms standard** | Native XForm XML + XLSForm | Full XForm XML & XLSForm export with groups/repeats |
| **Offline data collection** | ODK Collect app / KoboCollect | PWA with IndexedDB — works fully offline, installable |
| **Form builder** | KoboToolbox drag-drop builder | Visual drag-drop builder with live preview |
| **Field types** | text, integer, decimal, select_one, select_multiple, date, time, geopoint, barcode, image, audio, note, calculate, range, rank | text, integer, decimal, select, radio, checkbox, date, time, dateTime, gps, barcode, image/file, note, calculate, likert, rating, range, ranking |
| **Skip logic / relevance** | `relevant` column in XLSForm | Full relevance engine: 10 operators (eq, neq, gt, lt, contains, etc.) with AND/OR |
| **Constraints / validation** | `constraint` column + XPath expressions | Regex, min/max range, length, email, phone, URL, custom expressions |
| **Calculated fields** | `calculate` column with XPath | Expression evaluator with `${field}` references + 16 functions |
| **Repeat groups** | `begin_repeat` / `end_repeat` | Repeat groups with add/remove instances at runtime |
| **Cascading selects** | `choice_filter` column | `choiceFilterExpression` with parent-child filtering |
| **Groups** | `begin_group` / `end_group` | Groups with `field-list` appearance (all fields on one page) |
| **Appearances** | `quick`, `minimal`, `horizontal`, `signature`, etc. | `quick` (auto-advance), `horizontal`, `multiline`, `signature` (canvas draw) |
| **or_other** | `or_other` keyword on select types | `orOther` toggle — auto-appends "Other" with free-text input |
| **Guidance hints** | `guidance_hint` column | `guidanceHint` — collapsible "More info" below hint |
| **Randomize choices** | `randomize` parameter | `randomizeChoices` — Fisher-Yates shuffle seeded by field ID |
| **Multi-language** | `label::language` columns | `translations` record per field + language selector in form runtime |
| **Barcode / QR scanning** | Via device camera | BarcodeDetector API with camera overlay |
| **GPS capture** | `geopoint` type | `gps` field type with lat/lng capture |
| **Metadata** | `start`, `end`, `today`, `deviceid` | Auto-captured: deviceId, startedAt, completedAt, today |
| **Audit logging** | `audit` meta type | Event log: form_open, field_change, constraint_violation, save_draft, submit |
| **Submission editing** | Edit saved submissions | `?responseId=xxx` URL param pre-fills from saved submission |
| **Draft saving** | Save as draft in Collect | Save draft functionality in form runtime |
| **Submission review** | OData review states | Review states: received, hasIssues, approved, rejected |
| **Project management** | ODK Central projects | Projects with forms, submissions, app users, web users |
| **User management** | App users + web users in Central | App users (field) + web users (portal) with role-based access |
| **Data export** | CSV, JSON, OData feed | XForm XML, XLSForm CSV, JSON, CSV export |
| **Expression functions** | XPath function library | `round()`, `int()`, `string-length()`, `substr()`, `not()`, `selected()`, `count-selected()`, `coalesce()`, `min()`, `max()`, `sum()`, `count()`, `if()`, `today()`, `now()`, `concat()` |

---

## Key Differences from ODK

### What SLASH adds beyond ODK

| Capability | ODK Ecosystem | SLASH |
|---|---|---|
| **AI-driven data quality** | Not available | Multi-provider AI (OpenAI, Claude, DeepSeek, Groq) for validation, anomaly detection, missing data analysis, summary insights |
| **Lab / sample workflow** | Not available (generic data only) | Full sample lifecycle: sample types, ID generation, batch processing, lab results entry, audit trail |
| **Health research focus** | General-purpose survey tool | Purpose-built for health research with household → participant → sample → lab result data chain |
| **PWA architecture** | Native Android app (ODK Collect) | Runs in any browser — no app store install needed, auto-updates |
| **Real-time preview** | XLSForm preview tools (separate) | Live mobile-frame preview inside the form builder |
| **Branding / white-label** | Self-hosted Central (limited) | Full branding settings: company name, logos, favicon, color theme — all persisted to IndexedDB |
| **IndexedDB storage** | SQLite in native app | Write-behind cache pattern: in-memory + async IndexedDB with Supabase sync |
| **Signature capture** | Via external apps | Built-in canvas-based signature drawing |
| **Rating / Likert widgets** | Custom appearances needed | Native `rating` (star) and `likert` (scale) field types |
| **dateTime combo** | Separate date + time fields | Single `dateTime` field type |
| **Ranking widget** | `rank` type in newer ODK | Native drag-to-reorder ranking with `@dnd-kit` |

### What ODK has that SLASH is still building

| Capability | Status in SLASH |
|---|---|
| **End-to-end encryption** | Not yet — planned |
| **Production sync engine** | Supabase sync layer exists but not fully enabled for bi-directional conflict resolution |
| **Server-enforced permissions** | UI roles exist; server-side RLS pending |
| **Scheduled QC reports** | AI analysis is manual; automation pipeline planned |
| **Photo / audio capture** | File upload exists; native media capture planned |
| **External datasets (pulldata)** | Architecture designed; Supabase Storage upload planned |
| **Unique constraint (server)** | Async validation via Supabase designed; not yet wired |
| **OData feed** | Not yet — CSV/JSON export available |
| **Webhooks** | Not yet |
| **Stata / SPSS export** | Not yet |

---

## Architecture Comparison

| Aspect | ODK Central | SLASH |
|---|---|---|
| **Server** | Node.js + PostgreSQL (self-hosted) | Supabase (hosted) + Vercel (frontend) |
| **Client** | ODK Collect (Android) + web UI | PWA (any device/browser) |
| **Offline storage** | SQLite on device | IndexedDB with write-behind cache |
| **Sync protocol** | OpenRosa / OData push | Custom queue-based sync to Supabase |
| **Form standard** | XForms (XLSForm → XML) | Internal JSON model + XForm/XLSForm export |
| **Authentication** | Session-based in Central | Supabase Auth (planned: full RLS) |
| **File storage** | Central server filesystem | Supabase Storage (planned) |
| **AI integration** | None | Server-side API routes → OpenAI/Claude/DeepSeek/Groq |

---

## AI Implementation

### Providers Supported
- OpenAI (GPT-4, GPT-3.5)
- Anthropic Claude
- DeepSeek
- Groq

### How It Works
- AI calls routed through server API routes (`POST /api/ai/analyze`, `POST /api/ai/test`)
- API keys resolved: server environment variables (preferred) → browser-stored keys (fallback)
- Analysis capabilities: data validation, missing data detection, anomaly detection, summary insights

### Environment Variables
```
OPENAI_API_KEY=
ANTHROPIC_API_KEY=
DEEPSEEK_API_KEY=
GROQ_API_KEY=
```

---

## Current Module Summary

### Data Collection
- Form builder with 18+ field types
- Full form logic engine (skip logic, constraints, calculations, cascading selects)
- Repeat groups, multi-language, appearances, or_other
- XForm XML & XLSForm CSV export
- Barcode scanning, GPS capture, signature capture

### Health Research Workflow
- Household management
- Participant management
- Sample management (types, ID generation, lifecycle tracking)
- Lab batch workflow & results entry
- Audit logging throughout

### Platform
- Offline-first PWA (installable, works without internet)
- IndexedDB primary storage with Supabase sync
- Role-based access control (admin, supervisor, field collector, lab technician)
- Project management (ODK Central-style)
- Submission review workflow
- AI-powered data quality analytics
- Branding & white-label settings
- System logs & monitoring
