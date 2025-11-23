"use client"

import { query } from './database'

// Sample management database schema and operations
export class SampleDatabaseService {
  
  // Create all sample-related tables
  static async createSampleTables() {
    const tableDefinitions = [
      // Sample types configuration
      `
      CREATE TABLE IF NOT EXISTS sample_types (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        type_code VARCHAR(50) UNIQUE NOT NULL, -- 'URINE', 'BLOOD', 'SERUM', etc.
        display_name VARCHAR(100) NOT NULL,
        description TEXT,
        form_schema JSONB, -- Dynamic form fields for this sample type
        is_active BOOLEAN DEFAULT true,
        created_by UUID REFERENCES users(id),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
      `,

      // Projects/Collection cycles
      `
      CREATE TABLE IF NOT EXISTS projects (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        project_code VARCHAR(50) UNIQUE NOT NULL,
        project_name VARCHAR(255) NOT NULL,
        description TEXT,
        region_ids JSONB, -- Array of region codes
        district_ids JSONB, -- Array of district codes
        expected_sample_types JSONB, -- Array of sample type codes
        target_samples_count INTEGER DEFAULT 0,
        start_date DATE,
        end_date DATE,
        status VARCHAR(50) DEFAULT 'active', -- active, paused, completed
        created_by UUID REFERENCES users(id),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
      `,

      // Main samples table
      `
      CREATE TABLE IF NOT EXISTS samples (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        sample_id VARCHAR(100) UNIQUE NOT NULL, -- EAST-KENEMA-HH0021-P04-SMP01
        sample_type_code VARCHAR(50) NOT NULL REFERENCES sample_types(type_code),
        project_id UUID REFERENCES projects(id),
        household_id UUID REFERENCES households(id),
        participant_id UUID REFERENCES participants(id),
        
        -- Collection fields
        collected_by UUID REFERENCES users(id),
        collection_date TIMESTAMP WITH TIME ZONE,
        collection_metadata JSONB, -- Custom fields from form builder
        
        -- Sample condition
        volume_collected DECIMAL(5,2), -- in mL
        container_correct BOOLEAN DEFAULT true,
        temperature_at_collection DECIMAL(4,1), -- in Celsius
        transport_notes TEXT,
        
        -- Lab processing
        received_by UUID REFERENCES users(id),
        received_date TIMESTAMP WITH TIME ZONE,
        lab_results JSONB, -- Test results data
        lab_comments TEXT,
        normal_range_validation BOOLEAN,
        
        -- Status and workflow
        status VARCHAR(50) DEFAULT 'not_collected', 
        -- not_collected, collected, in_transit, lab_pending, lab_completed, rejected
        rejection_reason VARCHAR(255),
        rejection_notes TEXT,
        
        -- Audit and AI
        ai_flags JSONB, -- AI-detected anomalies
        last_ai_check TIMESTAMP WITH TIME ZONE,
        
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
      `,

      // Sample audit trail
      `
      CREATE TABLE IF NOT EXISTS sample_audit_log (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        sample_id UUID REFERENCES samples(id),
        action VARCHAR(100) NOT NULL, -- created, collected, received, tested, rejected, etc.
        old_status VARCHAR(50),
        new_status VARCHAR(50),
        performed_by UUID REFERENCES users(id),
        metadata JSONB, -- Additional action data
        timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
      `,

      // Sample batches for lab processing
      `
      CREATE TABLE IF NOT EXISTS sample_batches (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        batch_code VARCHAR(100) UNIQUE NOT NULL,
        batch_type VARCHAR(50) NOT NULL, -- collection, transport, processing
        sample_ids JSONB NOT NULL, -- Array of sample IDs in this batch
        created_by UUID REFERENCES users(id),
        processed_by UUID REFERENCES users(id),
        batch_status VARCHAR(50) DEFAULT 'pending', -- pending, in_progress, completed
        processing_date TIMESTAMP WITH TIME ZONE,
        completion_date TIMESTAMP WITH TIME ZONE,
        notes TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
      `
    ]

    // Execute table creation
    for (const tableSQL of tableDefinitions) {
      await query(tableSQL)
    }

    // Create indexes for performance
    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_samples_sample_id ON samples(sample_id)',
      'CREATE INDEX IF NOT EXISTS idx_samples_participant ON samples(participant_id)',
      'CREATE INDEX IF NOT EXISTS idx_samples_household ON samples(household_id)',
      'CREATE INDEX IF NOT EXISTS idx_samples_project ON samples(project_id)',
      'CREATE INDEX IF NOT EXISTS idx_samples_status ON samples(status)',
      'CREATE INDEX IF NOT EXISTS idx_samples_collected_by ON samples(collected_by)',
      'CREATE INDEX IF NOT EXISTS idx_samples_collection_date ON samples(collection_date)',
      'CREATE INDEX IF NOT EXISTS idx_sample_audit_sample_id ON sample_audit_log(sample_id)',
      'CREATE INDEX IF NOT EXISTS idx_sample_audit_action ON sample_audit_log(action, timestamp)'
    ]

    for (const indexSQL of indexes) {
      try {
        await query(indexSQL)
      } catch (error) {
        console.log('Index creation skipped (may already exist):', error)
      }
    }

    // Insert default sample types
    await this.insertDefaultSampleTypes()
  }

  // Insert default sample types for Phase 1
  static async insertDefaultSampleTypes() {
    const defaultSampleTypes = [
      {
        type_code: 'URINE',
        display_name: 'Urine Sample',
        description: 'Standard urine collection for urinalysis',
        form_schema: {
          fields: [
            { name: 'volume_collected', type: 'number', label: 'Volume (mL)', required: true },
            { name: 'color', type: 'select', label: 'Color', options: ['Clear', 'Yellow', 'Dark Yellow', 'Red', 'Brown'], required: false },
            { name: 'container_type', type: 'select', label: 'Container Type', options: ['Standard Cup', 'Sterile Cup', 'Tube'], required: true },
            { name: 'collection_notes', type: 'textarea', label: 'Collection Notes', required: false }
          ]
        }
      },
      {
        type_code: 'BLOOD',
        display_name: 'Blood Sample',
        description: 'Blood sample via finger prick or venous draw',
        form_schema: {
          fields: [
            { name: 'collection_method', type: 'select', label: 'Collection Method', options: ['Finger Prick', 'Venous Draw'], required: true },
            { name: 'volume_collected', type: 'number', label: 'Volume (mL)', required: true },
            { name: 'tube_type', type: 'select', label: 'Tube Type', options: ['EDTA', 'Serum', 'Heparin', 'Plain'], required: true },
            { name: 'hemolysis_observed', type: 'select', label: 'Hemolysis', options: ['None', 'Slight', 'Moderate', 'Severe'], required: false },
            { name: 'collection_notes', type: 'textarea', label: 'Collection Notes', required: false }
          ]
        }
      }
    ]

    for (const sampleType of defaultSampleTypes) {
      try {
        await query(
          `INSERT INTO sample_types (type_code, display_name, description, form_schema)
           VALUES ($1, $2, $3, $4)
           ON CONFLICT (type_code) DO NOTHING`,
          [sampleType.type_code, sampleType.display_name, sampleType.description, JSON.stringify(sampleType.form_schema)]
        )
      } catch (error) {
        console.log(`Sample type ${sampleType.type_code} may already exist:`, error)
      }
    }
  }

  // Generate unique sample ID
  static async generateSampleId(participantId: string, sampleTypeCode: string): Promise<string> {
    try {
      // Get participant and household information
      const participantResult = await query(
        `SELECT p.participant_id, h.household_id, h.region, h.district
         FROM participants p
         JOIN households h ON p.household_id = h.id
         WHERE p.id = $1`,
        [participantId]
      )

      if (participantResult.rows.length === 0) {
        throw new Error('Participant not found')
      }

      const { participant_id, household_id, region, district } = participantResult.rows[0]

      // Count existing samples for this participant and type
      const countResult = await query(
        `SELECT COUNT(*) as count
         FROM samples
         WHERE participant_id = $1 AND sample_type_code = $2`,
        [participantId, sampleTypeCode]
      )

      const sampleNumber = (parseInt(countResult.rows[0].count) + 1).toString().padStart(2, '0')

      // Generate sample ID: REGION-DISTRICT-HHID-PARTID-SMPXX
      const regionCode = region.substring(0, 4).toUpperCase()
      const districtCode = district.substring(0, 6).toUpperCase()
      const householdCode = household_id.substring(0, 6).toUpperCase()
      const participantCode = participant_id.substring(0, 3).toUpperCase()
      const sampleTypeShort = sampleTypeCode.substring(0, 3)

      const sampleId = `${regionCode}-${districtCode}-${householdCode}-${participantCode}-${sampleTypeShort}${sampleNumber}`

      // Ensure uniqueness
      const existingResult = await query(
        'SELECT id FROM samples WHERE sample_id = $1',
        [sampleId]
      )

      if (existingResult.rows.length > 0) {
        // If collision, add timestamp suffix
        const timestamp = Date.now().toString().slice(-4)
        return `${sampleId}-${timestamp}`
      }

      return sampleId

    } catch (error) {
      console.error('Error generating sample ID:', error)
      throw error
    }
  }

  // Get sample statistics for dashboard
  static async getSampleStatistics(userId?: string, role?: string, regionId?: string, districtId?: string) {
    try {
      let whereClause = '1=1'
      const params: any[] = []

      // Apply role-based filtering
      if (role === 'field_collector') {
        whereClause += ' AND s.collected_by = $' + (params.length + 1)
        params.push(userId)
      } else if (role === 'regional_head' && regionId) {
        whereClause += ' AND h.region = $' + (params.length + 1)
        params.push(regionId)
      } else if (role === 'supervisor' && districtId) {
        whereClause += ' AND h.district = $' + (params.length + 1)
        params.push(districtId)
      }

      const result = await query(
        `SELECT 
          COUNT(*) as total_samples,
          COUNT(CASE WHEN s.status = 'not_collected' THEN 1 END) as not_collected,
          COUNT(CASE WHEN s.status = 'collected' THEN 1 END) as collected,
          COUNT(CASE WHEN s.status = 'in_transit' THEN 1 END) as in_transit,
          COUNT(CASE WHEN s.status = 'lab_pending' THEN 1 END) as lab_pending,
          COUNT(CASE WHEN s.status = 'lab_completed' THEN 1 END) as lab_completed,
          COUNT(CASE WHEN s.status = 'rejected' THEN 1 END) as rejected,
          COUNT(CASE WHEN s.sample_type_code = 'URINE' THEN 1 END) as urine_samples,
          COUNT(CASE WHEN s.sample_type_code = 'BLOOD' THEN 1 END) as blood_samples
         FROM samples s
         JOIN participants p ON s.participant_id = p.id
         JOIN households h ON s.household_id = h.id
         WHERE ${whereClause}`,
        params
      )

      return result.rows[0]
    } catch (error) {
      console.error('Error getting sample statistics:', error)
      throw error
    }
  }
}
