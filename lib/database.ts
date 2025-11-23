import { createClient } from '@supabase/supabase-js'

// Supabase client for auth and real-time features (DISABLED for IndexedDB-first)
// Using placeholder values to prevent build errors
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || 'https://placeholder.supabase.co',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBsYWNlaG9sZGVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE2NDUxOTIwMDAsImV4cCI6MTk2MDc2ODAwMH0.placeholder'
)

// PostgreSQL disabled for Vercel deployment - using IndexedDB-first architecture
// Neon PostgreSQL connection pool for main database operations (DISABLED)
const connectionString = process.env.DATABASE_URL

let pgPool: any = null

export const getPool = () => {
  // PostgreSQL disabled - app uses IndexedDB-first architecture
  console.warn('PostgreSQL pool requested but disabled. Using IndexedDB-first architecture.')
  return null
}

// Database query helper (DISABLED - IndexedDB-first architecture)
export const query = async (text: string, params?: any[]) => {
  console.warn('PostgreSQL query attempted but disabled. Using IndexedDB-first architecture.')
  throw new Error('PostgreSQL disabled. App uses IndexedDB-first architecture.')
}

// Health check for database connections (DISABLED)
export const checkDatabaseHealth = async () => {
  return {
    neon: false,
    supabase: false,
    indexedDB: true,
    architecture: 'offline-first',
    message: 'App uses IndexedDB-first architecture',
    timestamp: new Date().toISOString()
  }
}

// Initialize database tables (DISABLED - IndexedDB-first architecture)
export const initializeDatabase = async () => {
  console.log('PostgreSQL initialization skipped. App uses IndexedDB-first architecture.')
  return true
}

// Create database tables
const createTables = async () => {
  const pool = getPool()
  if (!pool) return

  const tableDefinitions = [
    // Users table
    `
    CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      email VARCHAR(255) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      full_name VARCHAR(255) NOT NULL,
      role VARCHAR(50) NOT NULL DEFAULT 'field_collector',
      region_id VARCHAR(100),
      district_id VARCHAR(100),
      is_active BOOLEAN DEFAULT true,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )
    `,
    
    // Households table
    `
    CREATE TABLE IF NOT EXISTS households (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      household_id VARCHAR(100) UNIQUE NOT NULL,
      head_of_household VARCHAR(255) NOT NULL,
      address TEXT NOT NULL,
      region VARCHAR(100) NOT NULL,
      district VARCHAR(100) NOT NULL,
      chiefdom VARCHAR(100),
      section VARCHAR(100),
      gps_coordinates VARCHAR(100),
      phone_number VARCHAR(20),
      total_members INTEGER DEFAULT 0,
      created_by UUID REFERENCES users(id),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )
    `,
    
    // Participants table
    `
    CREATE TABLE IF NOT EXISTS participants (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      participant_id VARCHAR(100) UNIQUE NOT NULL,
      household_id UUID REFERENCES households(id),
      full_name VARCHAR(255) NOT NULL,
      date_of_birth DATE,
      gender VARCHAR(20),
      relationship_to_head VARCHAR(100),
      phone_number VARCHAR(20),
      education_level VARCHAR(100),
      occupation VARCHAR(100),
      health_status VARCHAR(50) DEFAULT 'unknown',
      risk_level VARCHAR(20) DEFAULT 'low',
      created_by UUID REFERENCES users(id),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )
    `,
    
    // Sample collections table
    `
    CREATE TABLE IF NOT EXISTS sample_collections (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      sample_id VARCHAR(100) UNIQUE NOT NULL,
      participant_id UUID REFERENCES participants(id),
      collector_id UUID REFERENCES users(id),
      sample_type VARCHAR(100) NOT NULL,
      collection_date TIMESTAMP WITH TIME ZONE NOT NULL,
      collection_site VARCHAR(255),
      storage_conditions VARCHAR(255),
      transport_method VARCHAR(255),
      lab_delivery_date TIMESTAMP WITH TIME ZONE,
      status VARCHAR(50) DEFAULT 'collected',
      notes TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )
    `,
    
    // Lab results table
    `
    CREATE TABLE IF NOT EXISTS lab_results (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      sample_id UUID REFERENCES sample_collections(id),
      test_type VARCHAR(100) NOT NULL,
      result_value VARCHAR(255),
      result_unit VARCHAR(50),
      reference_range VARCHAR(100),
      status VARCHAR(50) DEFAULT 'pending',
      technician_id UUID REFERENCES users(id),
      analysis_date TIMESTAMP WITH TIME ZONE,
      equipment_used VARCHAR(255),
      quality_control_passed BOOLEAN DEFAULT false,
      notes TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )
    `,
    
    // Surveys table
    `
    CREATE TABLE IF NOT EXISTS surveys (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      form_id VARCHAR(100) NOT NULL,
      participant_id UUID REFERENCES participants(id),
      collector_id UUID REFERENCES users(id),
      survey_data JSONB NOT NULL,
      completion_status VARCHAR(50) DEFAULT 'draft',
      submitted_at TIMESTAMP WITH TIME ZONE,
      reviewed_by UUID REFERENCES users(id),
      review_status VARCHAR(50) DEFAULT 'pending',
      ai_validation_status VARCHAR(50) DEFAULT 'pending',
      ai_flags JSONB,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )
    `,
    
    // Forms/questionnaires table
    `
    CREATE TABLE IF NOT EXISTS forms (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      form_id VARCHAR(100) UNIQUE NOT NULL,
      title VARCHAR(255) NOT NULL,
      description TEXT,
      form_schema JSONB NOT NULL,
      version INTEGER DEFAULT 1,
      is_active BOOLEAN DEFAULT true,
      created_by UUID REFERENCES users(id),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )
    `,
    
    // AI analysis results table
    `
    CREATE TABLE IF NOT EXISTS ai_analysis (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      entity_type VARCHAR(50) NOT NULL, -- 'survey', 'sample', 'participant'
      entity_id UUID NOT NULL,
      analysis_type VARCHAR(100) NOT NULL, -- 'data_quality', 'anomaly_detection', 'risk_assessment'
      provider VARCHAR(50) NOT NULL, -- 'openai', 'claude', 'deepseek'
      input_data JSONB,
      analysis_result JSONB NOT NULL,
      confidence_score DECIMAL(3,2),
      flags JSONB,
      recommendations TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )
    `,
    
    // System logs table
    `
    CREATE TABLE IF NOT EXISTS system_logs (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID REFERENCES users(id),
      action VARCHAR(255) NOT NULL,
      entity_type VARCHAR(100),
      entity_id UUID,
      details JSONB,
      ip_address INET,
      user_agent TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )
    `
  ]

  // Execute table creation
  for (const tableSQL of tableDefinitions) {
    await pool.query(tableSQL)
  }

  // Create indexes for better performance
  const indexes = [
    'CREATE INDEX IF NOT EXISTS idx_households_region_district ON households(region, district)',
    'CREATE INDEX IF NOT EXISTS idx_participants_household ON participants(household_id)',
    'CREATE INDEX IF NOT EXISTS idx_samples_participant ON sample_collections(participant_id)',
    'CREATE INDEX IF NOT EXISTS idx_surveys_participant ON surveys(participant_id)',
    'CREATE INDEX IF NOT EXISTS idx_surveys_form ON surveys(form_id)',
    'CREATE INDEX IF NOT EXISTS idx_ai_analysis_entity ON ai_analysis(entity_type, entity_id)',
    'CREATE INDEX IF NOT EXISTS idx_system_logs_user_action ON system_logs(user_id, action, created_at)'
  ]

  for (const indexSQL of indexes) {
    try {
      await pool.query(indexSQL)
    } catch (error) {
      console.log('Index creation skipped (may already exist):', error)
    }
  }
}

export default { supabase, query, checkDatabaseHealth, initializeDatabase }
