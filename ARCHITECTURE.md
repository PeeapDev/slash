# SLASH PWA Architecture

## 📱 Current Status

### ✅ Deployed & Live
- **URL:** https://slash-taupe.vercel.app/
- **Status:** PWA Install Landing Page Active
- **Build:** Successful on Vercel

---

## 🏗️ Hybrid Architecture (IndexedDB-First + Supabase Sync)

### Current Implementation (Phase 1)
```
┌─────────────────────────────────┐
│   Frontend (Next.js/React)      │
│   ↓                              │
│   IndexedDB (Local Storage)     │ ← Currently Active
│   ↓                              │
│   Sync Queue (Pending)           │
│   ↓ (when online)                │
│   Supabase PostgreSQL (Disabled)│ ← To Enable Next
└─────────────────────────────────┘
```

### Target Architecture (Phase 2)
```
┌─────────────────────────────────┐
│   Mobile/Tablet PWA              │
├─────────────────────────────────┤
│   Data Layer                     │
│   - IndexedDB (Offline-First)   │
│   - Sync Queue Manager          │
├─────────────────────────────────┤
│   API Layer                      │
│   - Supabase Client             │
│   - Edge Functions              │
├─────────────────────────────────┤
│   Backend (Supabase)             │
│   - PostgreSQL Database         │
│   - Row Level Security (RLS)    │
│   - Authentication & Roles      │
│   - AI Analytics (Edge Funcs)   │
└─────────────────────────────────┘
```

---

## 🎯 Why Both IndexedDB AND PostgreSQL?

### IndexedDB (Client-Side)
**Purpose:** Offline-first field data collection
- ✅ Works without internet
- ✅ Instant data capture
- ✅ Auto-generated IDs
- ✅ Local search & filtering
- ✅ No network latency

### PostgreSQL/Supabase (Server-Side)
**Purpose:** Online sync, analytics, and collaboration
- ✅ Central data repository
- ✅ AI analytics via Edge Functions
- ✅ Multi-user collaboration
- ✅ Data validation & quality checks
- ✅ Authentication & RLS
- ✅ Automated weekly audits
- ✅ Cross-region supervisor access
- ✅ Lab-to-field data linking

---

## 📊 Data Flow

### Field Data Collection (Offline)
```
1. Collector opens app → IndexedDB loads
2. Register household → Auto ID generated locally
3. Add participants → Stored in IndexedDB
4. Complete survey → Saved locally
5. Record samples → Queue for sync
6. NO INTERNET NEEDED ✅
```

### Sync Process (When Online)
```
1. App detects internet connection
2. Sync Queue Manager activates
3. Upload: IndexedDB → Supabase PostgreSQL
4. Download: New data from cloud → IndexedDB
5. Conflict resolution (last-write-wins or custom)
6. Mark records as synced
7. Continue offline work
```

### AI Analytics (Server-Side)
```
1. Weekly cron job triggers Edge Function
2. Query PostgreSQL for all records
3. AI analyzes:
   - Missing fields
   - Data inconsistencies
   - Sample-to-lab matching
   - Out-of-range values
4. Generate report
5. Flag issues for supervisors
6. Update quality metrics
```

---

## 🔐 Authentication Flow

### Current (Temporary)
- Simple localStorage-based login
- No password verification
- For development only

### Target (Supabase Auth)
```
1. User enters email/password
2. Supabase Auth validates
3. JWT token issued
4. Token stored securely
5. Row Level Security enforces:
   - Collectors: Own data only
   - Lab Techs: Lab results only
   - Supervisors: Region-specific data
   - AI Manager: All data (read-only)
```

---

## 🚀 Next Steps (Priority Order)

### Phase 2A: Re-enable Supabase (This Week)
1. **Setup Supabase Project**
   - Create project on Supabase
   - Get URL and anon key
   - Update `.env.local` with real credentials

2. **Database Schema**
   - Run PostgreSQL migrations
   - Create tables: households, participants, samples, lab_results, surveys
   - Setup indexes for performance

3. **Row Level Security (RLS)**
   - Enable RLS on all tables
   - Create policies per role
   - Test access control

4. **Authentication**
   - Enable Supabase Auth
   - Create user roles
   - Update login component

### Phase 2B: Sync Engine (Next Week)
1. **Sync Queue Manager**
   - Monitor network status
   - Track pending uploads
   - Handle conflicts
   - Retry failed syncs

2. **Bi-directional Sync**
   - Upload local changes
   - Download remote updates
   - Merge strategies
   - Sync status UI

### Phase 2C: AI Analytics (Following Week)
1. **Edge Functions**
   - Data quality checker
   - Weekly audit function
   - Report generator
   - Anomaly detector

2. **AI Integration**
   - OpenAI/Claude API for analysis
   - Custom prompts for health data
   - Structured output parsing
   - Quality scoring

---

## 📱 PWA Testing Guide

### Test on Phone (Now Available!)

#### Android (Chrome)
1. Visit: https://slash-taupe.vercel.app/
2. See landing page
3. Tap "Install Now"
4. Confirm install
5. App appears on home screen
6. Test offline:
   - Turn on Airplane Mode
   - Open app from home screen
   - Collect sample data
   - Verify data persists

#### iOS (Safari)
1. Visit: https://slash-taupe.vercel.app/
2. See landing page
3. Tap Share button (↑)
4. Tap "Add to Home Screen"
5. Confirm
6. App appears on home screen
7. Test offline (same as Android)

### What to Test
- ✅ Install process
- ✅ App opens offline
- ✅ Create household
- ✅ Add participants
- ✅ Collect samples
- ✅ Data persists after closing app
- ✅ Works without internet
- ❌ Sync (not yet enabled)
- ❌ Authentication (not yet enabled)

---

## 🗂️ Current Database Structure (IndexedDB Only)

```typescript
stores: {
  households: Household[]
  participants: Participant[]
  surveys: Survey[]
  samples: Sample[]
  sample_types: SampleType[]
  lab_results: LabResult[]
  team_members: TeamMemberDB[]
  teams: Team[]
  forms: Form[]
  form_responses: FormResponse[]
  project_metadata: ProjectMetadata[]
  sync_queue: SyncQueueItem[]
  audit_trails: AuditTrail[]
  settings: Settings[]
}
```

---

## 🔄 Migration Path (IndexedDB → PostgreSQL)

### Option 1: Gradual Migration
1. Keep IndexedDB for offline
2. Add Supabase for sync
3. Run parallel for testing
4. Verify data consistency
5. Rely on PostgreSQL as source of truth

### Option 2: Dual Storage (Recommended)
1. IndexedDB = Local cache + offline work
2. PostgreSQL = Central repository
3. Sync queue handles synchronization
4. Best of both worlds

---

## 📝 Environment Variables Needed

```bash
# Supabase (Currently placeholders)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# PostgreSQL (Via Supabase)
DATABASE_URL=postgresql://postgres:[password]@db.your-project.supabase.co:5432/postgres

# AI Analytics (Optional for Phase 2C)
OPENAI_API_KEY=sk-...
# or
ANTHROPIC_API_KEY=sk-ant-...
```

---

## 🎯 Success Criteria

### Phase 1 (Current) ✅
- [x] PWA installable
- [x] Works offline
- [x] IndexedDB storage
- [x] Sample data entry
- [x] Deployed to Vercel

### Phase 2A (This Week)
- [ ] Supabase connected
- [ ] PostgreSQL schema created
- [ ] Authentication working
- [ ] RLS policies active

### Phase 2B (Next Week)
- [ ] Sync queue functional
- [ ] Upload to cloud works
- [ ] Download from cloud works
- [ ] Conflict resolution

### Phase 2C (Following Week)
- [ ] Edge functions deployed
- [ ] AI analytics running
- [ ] Weekly audits automated
- [ ] Quality reports generated

---

## 📞 Support & Documentation

- **Vercel URL:** https://slash-taupe.vercel.app/
- **GitHub:** https://github.com/PeeapDev/slash
- **Architecture:** IndexedDB-First + Supabase Sync
- **Framework:** Next.js 16 + React + TypeScript
- **Database:** IndexedDB (local) + PostgreSQL (cloud)
- **Auth:** Supabase Auth (to enable)
- **Deployment:** Vercel (auto-deploy on push)

---

## 🚨 Important Notes

1. **PostgreSQL is NOT removed** - It's temporarily disabled for Vercel deployment
2. **Supabase will be re-enabled** - As soon as we have credentials
3. **IndexedDB stays** - It's the foundation of offline-first
4. **Both databases work together** - Not either/or
5. **Test PWA on phone FIRST** - Before enabling sync

---

**Last Updated:** November 23, 2025
**Status:** Phase 1 Complete ✅ | Phase 2 Pending 🔄
