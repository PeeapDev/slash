# 🗄️ Database Integration Guide - SLASH Platform

## 🚀 **Database Setup Complete!**

Your SLASH Health Research Platform now supports **dual database integration** with Neon PostgreSQL and Supabase for maximum flexibility and reliability.

## 📋 **Quick Setup Steps:**

### **1. Environment Configuration ✅**
```bash
# Your .env.local file is already configured with:
- Neon PostgreSQL (Primary database)
- Supabase (Auth & real-time)
- JWT secrets
- API configurations
```

### **2. Database Packages Installed ✅**
```bash
npm install @supabase/supabase-js pg @types/pg prisma @prisma/client drizzle-orm
# All packages are now installed and ready
```

### **3. Initialize Database Tables**
1. **Go to Configuration** → **Database** tab in your admin panel
2. **Click "Initialize Database Tables"**
3. **Wait for completion** (creates all required tables)

## 🏗️ **Database Architecture:**

### **Neon PostgreSQL (Primary Database)**
```
🏠 households          - Household registrations
👥 participants        - Individual participants  
🧪 sample_collections  - Sample tracking
🔬 lab_results         - Laboratory analysis
📋 surveys             - Survey responses
📝 forms               - Dynamic form schemas
🤖 ai_analysis         - AI analysis results
👤 users               - User accounts & roles
📊 system_logs         - Activity logging
```

### **Supabase Integration**
- **Authentication** - User login/logout
- **Real-time updates** - Live data synchronization
- **File storage** - Document uploads
- **Edge functions** - Serverless functions

## 🔧 **API Endpoints Ready:**

### **Database Management:**
- `GET /api/database/init` - Health check
- `POST /api/database/init` - Initialize tables

### **Data Operations:**
- `GET/POST /api/households` - Household management
- `GET/POST /api/participants` - Participant management
- `GET/POST /api/samples` - Sample tracking
- `GET/POST /api/surveys` - Survey data

## 🎯 **How to Use:**

### **1. Initialize Database (First Time)**
```typescript
// Go to Admin → Configuration → Database
// Click "Initialize Database Tables"
// ✅ Creates all required tables and indexes
```

### **2. Start Using Database Services**
```typescript
import { HouseholdService, ParticipantService } from '@/lib/database-services'

// Create new household
const household = await HouseholdService.createHousehold({
  householdId: "HH001",
  headOfHousehold: "John Doe",
  address: "123 Main St",
  region: "Western",
  district: "Freetown",
  createdBy: userId
})

// Add participants
const participant = await ParticipantService.createParticipant({
  participantId: "P001", 
  householdId: household.id,
  fullName: "Jane Doe",
  createdBy: userId
})
```

### **3. AI Analysis Integration**
```typescript
import { AIAnalysisService } from '@/lib/database-services'

// Save AI analysis results to database
await AIAnalysisService.saveAnalysis({
  entityType: 'survey',
  entityId: surveyId,
  analysisType: 'data_quality',
  provider: 'openai',
  analysisResult: aiResponse,
  confidenceScore: 0.95
})
```

## 📊 **Database Features:**

### **✅ Automatic Logging**
- All user actions automatically logged
- Track data changes and system events
- Audit trail for compliance

### **✅ AI Analysis Storage**
- Store AI analysis results
- Track confidence scores
- Link analysis to source data

### **✅ Scalable Architecture**
- Connection pooling for performance
- Indexed queries for speed
- Transaction safety

### **✅ Data Relationships**
```
Households → Participants → Samples → Lab Results
     ↓            ↓           ↓
   Surveys    AI Analysis  System Logs
```

## 🔐 **Security Features:**

### **Connection Security:**
- SSL/TLS encryption
- Connection pooling
- Environment variable protection

### **Data Protection:**
- Password hashing
- JWT token authentication
- Role-based access control

### **Audit Trail:**
- Complete action logging
- User activity tracking
- Data change history

## 🛠️ **Development Tools:**

### **Database Services:**
```typescript
// User Management
UserService.createUser()
UserService.getUserByEmail()

// Household Management  
HouseholdService.createHousehold()
HouseholdService.getAllHouseholds()

// Participant Management
ParticipantService.createParticipant()
ParticipantService.getParticipantsByHousehold()

// Sample Management
SampleService.createSample() 
SampleService.getSamplesByStatus()

// AI Analysis
AIAnalysisService.saveAnalysis()
AIAnalysisService.getAnalysisByEntity()

// System Logging
LogService.logAction()
LogService.getSystemLogs()
```

### **Health Monitoring:**
- Real-time connection status
- Database performance metrics
- Error tracking and alerts

## 🚀 **Production Deployment:**

### **Environment Variables:**
```bash
# Production .env
DATABASE_URL=your-neon-production-url
SUPABASE_URL=your-supabase-production-url
SUPABASE_ANON_KEY=your-production-anon-key
JWT_SECRET=your-strong-production-secret
```

### **Scaling Considerations:**
- Connection pool optimization
- Read replicas for reporting
- Backup and recovery procedures
- Performance monitoring

## 🎉 **Ready for Production!**

Your SLASH platform now has:
- ✅ **Dual database integration** (Neon + Supabase)
- ✅ **Complete data services** for all entities
- ✅ **AI analysis storage** and retrieval
- ✅ **Automatic logging** and audit trails
- ✅ **Health monitoring** and diagnostics
- ✅ **Production-ready** architecture

### **Next Steps:**
1. **Initialize your database** via the admin panel
2. **Start collecting data** through the forms
3. **Monitor database health** in Configuration
4. **Scale as needed** for your research project

**Your health research platform is now powered by enterprise-grade databases!** 🚀
