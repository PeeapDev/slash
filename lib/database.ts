"use client"

import { createClient } from '@supabase/supabase-js'
import { Pool } from 'pg'

// Supabase client for auth and real-time features
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || ''
)

// Neon PostgreSQL connection pool for main database operations
const connectionString = process.env.DATABASE_URL

let pgPool: Pool | null = null

export const getPool = () => {
  if (!pgPool && connectionString) {
    pgPool = new Pool({
      connectionString,
      ssl: {
        rejectUnauthorized: false
      },
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    })
  }
  return pgPool
}

// Database query helper
export const query = async (text: string, params?: any[]) => {
  const pool = getPool()
  if (!pool) {
    throw new Error('Database connection not available')
  }
  
  const start = Date.now()
  try {
    const res = await pool.query(text, params)
    const duration = Date.now() - start
    console.log('Executed query', { text, duration, rows: res.rowCount })
    return res
  } catch (error) {
    console.error('Database query error:', error)
    throw error
  }
}

// Health check for database connections
export const checkDatabaseHealth = async () => {
  const results = {
    neon: false,
    supabase: false,
    timestamp: new Date().toISOString()
  }

  // Test Neon connection
  try {
    const pool = getPool()
    if (pool) {
      await pool.query('SELECT 1')
      results.neon = true
    }
  } catch (error) {
    console.error('Neon database health check failed:', error)
  }

  // Test Supabase connection
  try {
    const { data, error } = await supabase.from('_health_check').select('*').limit(1)
    if (!error) {
      results.supabase = true
    }
  } catch (error) {
    console.error('Supabase health check failed:', error)
  }

  return results
}

// Initialize database tables
export const initializeDatabase = async () => {
  const pool = getPool()
  if (!pool) {
    console.error('No database connection available for initialization')
    return false
  }

  try {
    // Create tables if they don't exist
    await createTables()
    console.log('Database initialized successfully')
    return true
  } catch (error) {
    console.error('Database initialization failed:', error)
    return false
  }
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
