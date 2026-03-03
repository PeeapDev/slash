# SLASH Platform - Implementation Status & Roadmap

## Implemented (Current)

### Platform & Architecture
- Offline-first PWA (installable, works without internet)
- IndexedDB as primary local datastore
- Sync queue store present (sync engine not fully enabled)
- Deployed on Vercel

## Modules (Core Workflows)
- Household management
- Participant management
- Survey management (questionnaire flows)
- Sample Management Module
  - Sample types
  - Sample ID generation
  - Sample lifecycle tracking
  - Lab batch workflow
  - Lab results entry
  - Audit logging
- Project management (campaign/cycle level grouping)

### Form Builder
- Dynamic form builder UI
- Inline field configuration (gear icons)
- Field reorder / delete
- Working preview (mobile simulation)
- Dynamic form renderer for field collectors

### Roles & UI Surfaces
- Role-based dashboards (admin, supervisor, field collector, lab technician)
- RBAC management UI (role/team/region modules)

### AI (Current)
- AI dashboard UI and settings UI
- Multi-provider settings stored in browser localStorage
- Client-side provider calls for:
  - Data validation
  - Missing data detection
  - Anomaly detection
  - Summary insights

## Planned (To Reach SurveyCTO / KoboToolbox Parity)

### Highest Priority
- Supabase auth (real authentication)
- Row Level Security (RLS) and server-enforced permissions
- Production sync engine (bi-directional sync, retries, conflict resolution)
- Enterprise-grade security (encryption at rest/in transit, key management)
- Automated data quality checks (scheduled audits + monitoring dashboards)

### Form Logic & Data Quality
- Skip logic / relevance conditions
- Constraints and custom validations
- Calculations within forms
- Repeat groups and roster-style data capture
- Preloaded datasets for lookups (cascading selects)

### Integrations & Data Ops
- Export tooling (CSV/XLSX, Stata/SPSS-friendly)
- Webhooks and external integrations
- API documentation + token-based API access

### Mobile Collection Enhancements
- GPS capture
- Photo/audio capture
- Barcode/QR scanning
- Offline dataset publishing / advanced offline transfer

### Reporting & Analytics
- Built-in statistical summaries
- Custom report builder
- Scheduled reports

## AI Implementation (Rebuilt) - Provider Layer + Groq

### What Changed
- AI calls are now routed through server API routes instead of calling vendor APIs directly from the browser.
- New API routes:
  - `POST /api/ai/analyze`
  - `POST /api/ai/test`
- Providers supported:
  - OpenAI
  - Claude (Anthropic)
  - DeepSeek
  - Groq

### How API Keys Are Resolved
- **Preferred**: Set server-side environment variables (recommended for production).
- **Fallback**: Use the API key stored locally in the browser (current UI behavior).

### Environment Variables
- `OPENAI_API_KEY`
- `ANTHROPIC_API_KEY`
- `DEEPSEEK_API_KEY`
- `GROQ_API_KEY`

## Feature Comparison Table (SurveyCTO vs KoboToolbox vs SLASH)

| Capability Area | SurveyCTO | KoboToolbox | SLASH (Current) |
|---|---|---|---|
| Offline data collection | Yes (advanced offline workflows) | Yes | Yes (PWA + IndexedDB) |
| Mobile app | Yes (SurveyCTO Collect) | Yes (KoboCollect) | PWA (installable) |
| Form builder | Yes | Yes | Yes |
| Skip logic / relevance | Yes | Yes | Partial (basic dynamic forms; needs full logic engine) |
| Constraints / validations | Yes | Yes | Partial (needs configurable constraints) |
| Calculations in-survey | Yes | Yes | Not yet |
| Repeat groups / rosters | Yes | Yes | Not yet |
| Preloaded datasets / lookups | Yes | Yes | Not yet |
| Audit trails | Yes | Partial | Yes (audit store + sample audit logs) |
| Data quality monitoring dashboards | Yes | Yes | Partial (AI dashboard exists; needs automated QC pipeline) |
| Scheduled automated QC reports | Yes (nightly audits) | Partial | Not yet |
| Exports (CSV/XLSX/etc.) | Yes | Yes | Partial (needs export module) |
| API / integrations | Yes (Power BI/Salesforce, etc.) | Yes (API stack) | Partial (REST endpoints exist for sample module; needs auth + broader API strategy) |
| End-to-end encryption | Yes | Partial | Not yet |
| Granular server-enforced permissions | Yes | Yes | Partial (UI roles exist; server enforcement pending) |
| Multi-language forms | Yes | Yes | Not yet |
| Media capture (photo/audio) | Yes | Yes | Not yet |
| GPS capture | Yes | Yes | Not yet |
| Barcode/QR | Yes (via devices) | Yes | Planned |
| Specialized lab/sample workflow | Limited | Limited | Yes (core differentiator) |
| AI analytics | Emerging | Limited | Yes (core differentiator, evolving) |

## Notes
- SLASH’s differentiator is the **health research + sample/lab workflow** and a pathway to **AI-driven QC**.
- To match SurveyCTO/KoboToolbox, the biggest gaps are **form logic**, **server-side security**, and **production-grade sync + QC automation**.
