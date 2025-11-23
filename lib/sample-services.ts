"use client"

import { query } from './database'
import { LogService } from './database-services'
import { SampleDatabaseService } from './sample-database'

// Sample Management Services
export class SampleTypeService {
  
  static async getAllSampleTypes() {
    const result = await query(
      'SELECT * FROM sample_types WHERE is_active = true ORDER BY display_name'
    )
    return result.rows
  }

  static async createSampleType(sampleTypeData: {
    typeCode: string
    displayName: string
    description?: string
    formSchema: any
    createdBy: string
  }) {
    const { typeCode, displayName, description, formSchema, createdBy } = sampleTypeData

    const result = await query(
      `INSERT INTO sample_types (type_code, display_name, description, form_schema, created_by)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [typeCode, displayName, description, JSON.stringify(formSchema), createdBy]
    )

    await LogService.logAction({
      userId: createdBy,
      action: 'CREATE_SAMPLE_TYPE',
      entityType: 'sample_type',
      entityId: result.rows[0].id,
      details: { typeCode, displayName }
    })

    return result.rows[0]
  }
}

export class ProjectService {
  
  static async getAllProjects() {
    const result = await query(
      'SELECT * FROM projects ORDER BY created_at DESC'
    )
    return result.rows
  }

  static async createProject(projectData: {
    projectCode: string
    projectName: string
    description?: string
    regionIds: string[]
    districtIds: string[]
    expectedSampleTypes: string[]
    targetSamplesCount: number
    startDate: string
    endDate: string
    createdBy: string
  }) {
    const {
      projectCode, projectName, description, regionIds, districtIds,
      expectedSampleTypes, targetSamplesCount, startDate, endDate, createdBy
    } = projectData

    const result = await query(
      `INSERT INTO projects (project_code, project_name, description, region_ids, district_ids,
                           expected_sample_types, target_samples_count, start_date, end_date, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [projectCode, projectName, description, JSON.stringify(regionIds), JSON.stringify(districtIds),
       JSON.stringify(expectedSampleTypes), targetSamplesCount, startDate, endDate, createdBy]
    )

    await LogService.logAction({
      userId: createdBy,
      action: 'CREATE_PROJECT',
      entityType: 'project',
      entityId: result.rows[0].id,
      details: { projectCode, projectName, targetSamplesCount }
    })

    return result.rows[0]
  }

  static async getProjectById(projectId: string) {
    const result = await query(
      `SELECT p.*, u.full_name as created_by_name
       FROM projects p
       LEFT JOIN users u ON p.created_by = u.id
       WHERE p.id = $1`,
      [projectId]
    )
    return result.rows[0]
  }
}

export class SampleCollectionService {
  
  static async createSample(sampleData: {
    sampleTypeCode: string
    projectId: string
    participantId: string
    collectedBy: string
    collectionDate?: string
    collectionMetadata?: any
    volumeCollected?: number
    containerCorrect?: boolean
    temperatureAtCollection?: number
    transportNotes?: string
  }) {
    const {
      sampleTypeCode, projectId, participantId, collectedBy, collectionDate,
      collectionMetadata, volumeCollected, containerCorrect, temperatureAtCollection, transportNotes
    } = sampleData

    // Generate unique sample ID
    const sampleId = await SampleDatabaseService.generateSampleId(participantId, sampleTypeCode)

    // Get household ID from participant
    const participantResult = await query(
      'SELECT household_id FROM participants WHERE id = $1',
      [participantId]
    )

    if (participantResult.rows.length === 0) {
      throw new Error('Participant not found')
    }

    const householdId = participantResult.rows[0].household_id

    const result = await query(
      `INSERT INTO samples (
        sample_id, sample_type_code, project_id, household_id, participant_id,
        collected_by, collection_date, collection_metadata, volume_collected,
        container_correct, temperature_at_collection, transport_notes, status
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
       RETURNING *`,
      [sampleId, sampleTypeCode, projectId, householdId, participantId, collectedBy,
       collectionDate || new Date().toISOString(), JSON.stringify(collectionMetadata),
       volumeCollected, containerCorrect !== false, temperatureAtCollection, transportNotes, 'collected']
    )

    // Log audit trail
    await this.logSampleAudit(result.rows[0].id, 'SAMPLE_COLLECTED', null, 'collected', collectedBy, {
      sampleId, sampleTypeCode, volumeCollected, collectionMetadata
    })

    // Log system action
    await LogService.logAction({
      userId: collectedBy,
      action: 'COLLECT_SAMPLE',
      entityType: 'sample',
      entityId: result.rows[0].id,
      details: { sampleId, sampleTypeCode, participantId, volumeCollected }
    })

    return result.rows[0]
  }

  static async getAllSamples(filters?: {
    userId?: string
    role?: string
    regionId?: string
    districtId?: string
    status?: string
    sampleType?: string
    projectId?: string
  }) {
    let whereClause = '1=1'
    const params: any[] = []

    // Apply role-based filtering
    if (filters?.role === 'field_collector' && filters.userId) {
      whereClause += ' AND s.collected_by = $' + (params.length + 1)
      params.push(filters.userId)
    } else if (filters?.role === 'lab_technician') {
      whereClause += " AND s.status IN ('collected', 'in_transit', 'lab_pending', 'lab_completed')"
    } else if (filters?.role === 'regional_head' && filters.regionId) {
      whereClause += ' AND h.region = $' + (params.length + 1)
      params.push(filters.regionId)
    } else if (filters?.role === 'supervisor' && filters.districtId) {
      whereClause += ' AND h.district = $' + (params.length + 1)
      params.push(filters.districtId)
    }

    // Apply additional filters
    if (filters?.status) {
      whereClause += ' AND s.status = $' + (params.length + 1)
      params.push(filters.status)
    }

    if (filters?.sampleType) {
      whereClause += ' AND s.sample_type_code = $' + (params.length + 1)
      params.push(filters.sampleType)
    }

    if (filters?.projectId) {
      whereClause += ' AND s.project_id = $' + (params.length + 1)
      params.push(filters.projectId)
    }

    const result = await query(
      `SELECT s.*, 
              h.household_id, h.head_of_household, h.region, h.district,
              p.participant_id, p.full_name as participant_name,
              uc.full_name as collected_by_name,
              ur.full_name as received_by_name,
              st.display_name as sample_type_name,
              pr.project_name
       FROM samples s
       JOIN households h ON s.household_id = h.id
       JOIN participants p ON s.participant_id = p.id
       LEFT JOIN users uc ON s.collected_by = uc.id
       LEFT JOIN users ur ON s.received_by = ur.id
       LEFT JOIN sample_types st ON s.sample_type_code = st.type_code
       LEFT JOIN projects pr ON s.project_id = pr.id
       WHERE ${whereClause}
       ORDER BY s.collection_date DESC`,
      params
    )

    return result.rows
  }

  static async getSampleById(sampleId: string) {
    const result = await query(
      `SELECT s.*, 
              h.household_id, h.head_of_household, h.region, h.district,
              p.participant_id, p.full_name as participant_name,
              uc.full_name as collected_by_name,
              ur.full_name as received_by_name,
              st.display_name as sample_type_name, st.form_schema,
              pr.project_name
       FROM samples s
       JOIN households h ON s.household_id = h.id
       JOIN participants p ON s.participant_id = p.id
       LEFT JOIN users uc ON s.collected_by = uc.id
       LEFT JOIN users ur ON s.received_by = ur.id
       LEFT JOIN sample_types st ON s.sample_type_code = st.type_code
       LEFT JOIN projects pr ON s.project_id = pr.id
       WHERE s.id = $1`,
      [sampleId]
    )

    return result.rows[0]
  }

  static async updateSampleStatus(sampleId: string, newStatus: string, userId: string, data?: {
    receivedBy?: string
    labResults?: any
    labComments?: string
    normalRangeValidation?: boolean
    rejectionReason?: string
    rejectionNotes?: string
  }) {
    const { receivedBy, labResults, labComments, normalRangeValidation, rejectionReason, rejectionNotes } = data || {}

    // Get current sample status
    const currentSample = await query('SELECT status FROM samples WHERE id = $1', [sampleId])
    const oldStatus = currentSample.rows[0]?.status

    let updateFields = ['status = $2', 'updated_at = NOW()']
    let updateValues: any[] = [sampleId, newStatus]
    let paramIndex = 3

    if (receivedBy) {
      updateFields.push(`received_by = $${paramIndex}`)
      updateValues.push(receivedBy)
      paramIndex++
    }

    if (newStatus === 'lab_pending' || newStatus === 'lab_completed') {
      updateFields.push(`received_date = $${paramIndex}`)
      updateValues.push(new Date().toISOString())
      paramIndex++
    }

    if (labResults) {
      updateFields.push(`lab_results = $${paramIndex}`)
      updateValues.push(JSON.stringify(labResults))
      paramIndex++
    }

    if (labComments) {
      updateFields.push(`lab_comments = $${paramIndex}`)
      updateValues.push(labComments)
      paramIndex++
    }

    if (normalRangeValidation !== undefined) {
      updateFields.push(`normal_range_validation = $${paramIndex}`)
      updateValues.push(normalRangeValidation)
      paramIndex++
    }

    if (rejectionReason) {
      updateFields.push(`rejection_reason = $${paramIndex}`)
      updateValues.push(rejectionReason)
      paramIndex++
    }

    if (rejectionNotes) {
      updateFields.push(`rejection_notes = $${paramIndex}`)
      updateValues.push(rejectionNotes)
      paramIndex++
    }

    const result = await query(
      `UPDATE samples SET ${updateFields.join(', ')} WHERE id = $1 RETURNING *`,
      updateValues
    )

    // Log audit trail
    await this.logSampleAudit(sampleId, 'STATUS_CHANGED', oldStatus || null, newStatus, userId, data)

    // Log system action
    await LogService.logAction({
      userId,
      action: `SAMPLE_STATUS_${newStatus.toUpperCase()}`,
      entityType: 'sample',
      entityId: sampleId,
      details: { oldStatus, newStatus, ...data }
    })

    return result.rows[0]
  }

  static async searchSamples(searchTerm: string, filters?: any) {
    const result = await query(
      `SELECT s.*, 
              h.household_id, h.head_of_household,
              p.participant_id, p.full_name as participant_name,
              st.display_name as sample_type_name
       FROM samples s
       JOIN households h ON s.household_id = h.id
       JOIN participants p ON s.participant_id = p.id
       LEFT JOIN sample_types st ON s.sample_type_code = st.type_code
       WHERE s.sample_id ILIKE $1 
          OR h.household_id ILIKE $1
          OR p.participant_id ILIKE $1
          OR p.full_name ILIKE $1
       ORDER BY s.collection_date DESC
       LIMIT 50`,
      [`%${searchTerm}%`]
    )

    return result.rows
  }

  static async getSampleAuditLog(sampleId: string) {
    const result = await query(
      `SELECT sal.*, u.full_name as performed_by_name
       FROM sample_audit_log sal
       LEFT JOIN users u ON sal.performed_by = u.id
       WHERE sal.sample_id = $1
       ORDER BY sal.timestamp DESC`,
      [sampleId]
    )

    return result.rows
  }

  private static async logSampleAudit(
    sampleId: string,
    action: string,
    oldStatus: string | null,
    newStatus: string,
    performedBy: string,
    metadata?: any
  ) {
    await query(
      `INSERT INTO sample_audit_log (sample_id, action, old_status, new_status, performed_by, metadata)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [sampleId, action, oldStatus, newStatus, performedBy, JSON.stringify(metadata)]
    )
  }
}

export class SampleAnalyticsService {
  
  static async getDashboardStats(userId?: string, role?: string, regionId?: string, districtId?: string) {
    return await SampleDatabaseService.getSampleStatistics(userId, role, regionId, districtId)
  }

  static async getCollectionProgress(projectId?: string) {
    let whereClause = '1=1'
    const params: any[] = []

    if (projectId) {
      whereClause += ' AND s.project_id = $' + (params.length + 1)
      params.push(projectId)
    }

    const result = await query(
      `SELECT 
          h.region,
          h.district,
          COUNT(CASE WHEN s.status != 'not_collected' THEN 1 END) as collected_count,
          COUNT(*) as total_samples,
          ROUND(
            COUNT(CASE WHEN s.status != 'not_collected' THEN 1 END) * 100.0 / COUNT(*), 2
          ) as completion_percentage
       FROM samples s
       JOIN households h ON s.household_id = h.id
       WHERE ${whereClause}
       GROUP BY h.region, h.district
       ORDER BY completion_percentage DESC`,
      params
    )

    return result.rows
  }

  static async getLabTurnaroundStats() {
    const result = await query(
      `SELECT 
          AVG(EXTRACT(EPOCH FROM (received_date - collection_date)) / 86400) as avg_collection_to_lab_days,
          AVG(EXTRACT(EPOCH FROM (updated_at - received_date)) / 86400) as avg_lab_processing_days,
          COUNT(CASE WHEN status = 'lab_pending' THEN 1 END) as pending_count,
          COUNT(CASE WHEN status = 'lab_completed' THEN 1 END) as completed_count
       FROM samples
       WHERE status IN ('lab_pending', 'lab_completed')
         AND received_date IS NOT NULL`
    )

    return result.rows[0]
  }

  static async getTopCollectors(limit: number = 10) {
    const result = await query(
      `SELECT 
          u.full_name,
          u.email,
          COUNT(s.id) as total_samples,
          COUNT(CASE WHEN s.status = 'collected' THEN 1 END) as collected_samples,
          AVG(s.volume_collected) as avg_volume
       FROM users u
       LEFT JOIN samples s ON u.id = s.collected_by
       WHERE u.role = 'field_collector'
       GROUP BY u.id, u.full_name, u.email
       ORDER BY total_samples DESC
       LIMIT $1`,
      [limit]
    )

    return result.rows
  }

  static async getAnomalies() {
    const result = await query(
      `SELECT 
          s.sample_id,
          s.sample_type_code,
          s.status,
          p.full_name as participant_name,
          h.household_id,
          s.ai_flags,
          'Missing lab results' as anomaly_type
       FROM samples s
       JOIN participants p ON s.participant_id = p.id
       JOIN households h ON s.household_id = h.id
       WHERE s.status = 'lab_pending' 
         AND s.received_date < NOW() - INTERVAL '7 days'
       
       UNION ALL
       
       SELECT 
          s.sample_id,
          s.sample_type_code,
          s.status,
          p.full_name as participant_name,
          h.household_id,
          s.ai_flags,
          'Volume anomaly' as anomaly_type
       FROM samples s
       JOIN participants p ON s.participant_id = p.id
       JOIN households h ON s.household_id = h.id
       WHERE s.volume_collected IS NOT NULL 
         AND (s.volume_collected < 0.5 OR s.volume_collected > 500)
       
       ORDER BY sample_id`
    )

    return result.rows
  }
}
