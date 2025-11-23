import { query } from './database'

// User Management Service
export class UserService {
  static async createUser(userData: {
    email: string
    passwordHash: string
    fullName: string
    role: string
    regionId?: string
    districtId?: string
  }) {
    const { email, passwordHash, fullName, role, regionId, districtId } = userData
    
    const result = await query(
      `INSERT INTO users (email, password_hash, full_name, role, region_id, district_id)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, email, full_name, role, region_id, district_id, created_at`,
      [email, passwordHash, fullName, role, regionId, districtId]
    )
    
    return result.rows[0]
  }

  static async getUserByEmail(email: string) {
    const result = await query(
      'SELECT * FROM users WHERE email = $1 AND is_active = true',
      [email]
    )
    return result.rows[0]
  }

  static async getUserById(id: string) {
    const result = await query(
      'SELECT id, email, full_name, role, region_id, district_id, is_active, created_at FROM users WHERE id = $1',
      [id]
    )
    return result.rows[0]
  }

  static async getAllUsers() {
    const result = await query(
      'SELECT id, email, full_name, role, region_id, district_id, is_active, created_at FROM users ORDER BY created_at DESC'
    )
    return result.rows
  }

  static async updateUser(id: string, updates: Partial<{
    email: string
    fullName: string
    role: string
    regionId: string
    districtId: string
    isActive: boolean
  }>) {
    const setClause = Object.keys(updates).map((key, index) => 
      `${key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`)} = $${index + 2}`
    ).join(', ')
    
    const values = [id, ...Object.values(updates)]
    
    const result = await query(
      `UPDATE users SET ${setClause}, updated_at = NOW() WHERE id = $1 RETURNING *`,
      values
    )
    
    return result.rows[0]
  }
}

// Household Management Service
export class HouseholdService {
  static async createHousehold(householdData: {
    householdId: string
    headOfHousehold: string
    address: string
    region: string
    district: string
    chiefdom?: string
    section?: string
    gpsCoordinates?: string
    phoneNumber?: string
    totalMembers?: number
    createdBy: string
  }) {
    const {
      householdId, headOfHousehold, address, region, district,
      chiefdom, section, gpsCoordinates, phoneNumber, totalMembers, createdBy
    } = householdData

    const result = await query(
      `INSERT INTO households (household_id, head_of_household, address, region, district, 
                             chiefdom, section, gps_coordinates, phone_number, total_members, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING *`,
      [householdId, headOfHousehold, address, region, district, chiefdom, section, 
       gpsCoordinates, phoneNumber, totalMembers || 0, createdBy]
    )

    return result.rows[0]
  }

  static async getAllHouseholds() {
    const result = await query(
      `SELECT h.*, u.full_name as created_by_name 
       FROM households h 
       LEFT JOIN users u ON h.created_by = u.id 
       ORDER BY h.created_at DESC`
    )
    return result.rows
  }

  static async getHouseholdById(id: string) {
    const result = await query(
      `SELECT h.*, u.full_name as created_by_name,
       (SELECT COUNT(*) FROM participants WHERE household_id = h.id) as participant_count
       FROM households h 
       LEFT JOIN users u ON h.created_by = u.id 
       WHERE h.id = $1`,
      [id]
    )
    return result.rows[0]
  }

  static async getHouseholdsByRegion(region: string) {
    const result = await query(
      'SELECT * FROM households WHERE region = $1 ORDER BY created_at DESC',
      [region]
    )
    return result.rows
  }

  static async updateHousehold(id: string, updates: any) {
    const setClause = Object.keys(updates).map((key, index) => 
      `${key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`)} = $${index + 2}`
    ).join(', ')
    
    const values = [id, ...Object.values(updates)]
    
    const result = await query(
      `UPDATE households SET ${setClause}, updated_at = NOW() WHERE id = $1 RETURNING *`,
      values
    )
    
    return result.rows[0]
  }
}

// Participant Management Service
export class ParticipantService {
  static async createParticipant(participantData: {
    participantId: string
    householdId: string
    fullName: string
    dateOfBirth?: string
    gender?: string
    relationshipToHead?: string
    phoneNumber?: string
    educationLevel?: string
    occupation?: string
    healthStatus?: string
    riskLevel?: string
    createdBy: string
  }) {
    const {
      participantId, householdId, fullName, dateOfBirth, gender,
      relationshipToHead, phoneNumber, educationLevel, occupation,
      healthStatus, riskLevel, createdBy
    } = participantData

    const result = await query(
      `INSERT INTO participants (participant_id, household_id, full_name, date_of_birth, 
                               gender, relationship_to_head, phone_number, education_level, 
                               occupation, health_status, risk_level, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       RETURNING *`,
      [participantId, householdId, fullName, dateOfBirth, gender, relationshipToHead,
       phoneNumber, educationLevel, occupation, healthStatus || 'unknown', 
       riskLevel || 'low', createdBy]
    )

    return result.rows[0]
  }

  static async getAllParticipants() {
    const result = await query(
      `SELECT p.*, h.household_id, h.head_of_household, u.full_name as created_by_name
       FROM participants p 
       LEFT JOIN households h ON p.household_id = h.id
       LEFT JOIN users u ON p.created_by = u.id 
       ORDER BY p.created_at DESC`
    )
    return result.rows
  }

  static async getParticipantsByHousehold(householdId: string) {
    const result = await query(
      'SELECT * FROM participants WHERE household_id = $1 ORDER BY created_at ASC',
      [householdId]
    )
    return result.rows
  }

  static async getParticipantById(id: string) {
    const result = await query(
      `SELECT p.*, h.household_id, h.head_of_household, h.address
       FROM participants p 
       LEFT JOIN households h ON p.household_id = h.id
       WHERE p.id = $1`,
      [id]
    )
    return result.rows[0]
  }

  static async updateParticipantRiskLevel(id: string, riskLevel: string, healthStatus?: string) {
    const result = await query(
      `UPDATE participants 
       SET risk_level = $1, health_status = COALESCE($2, health_status), updated_at = NOW() 
       WHERE id = $3 RETURNING *`,
      [riskLevel, healthStatus, id]
    )
    return result.rows[0]
  }
}

// Sample Collection Service
export class SampleService {
  static async createSample(sampleData: {
    sampleId: string
    participantId: string
    collectorId: string
    sampleType: string
    collectionDate: string
    collectionSite?: string
    storageConditions?: string
    transportMethod?: string
    notes?: string
  }) {
    const {
      sampleId, participantId, collectorId, sampleType, collectionDate,
      collectionSite, storageConditions, transportMethod, notes
    } = sampleData

    const result = await query(
      `INSERT INTO sample_collections (sample_id, participant_id, collector_id, sample_type,
                                     collection_date, collection_site, storage_conditions,
                                     transport_method, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [sampleId, participantId, collectorId, sampleType, collectionDate,
       collectionSite, storageConditions, transportMethod, notes]
    )

    return result.rows[0]
  }

  static async getAllSamples() {
    const result = await query(
      `SELECT s.*, p.full_name as participant_name, p.participant_id,
              u.full_name as collector_name
       FROM sample_collections s
       LEFT JOIN participants p ON s.participant_id = p.id
       LEFT JOIN users u ON s.collector_id = u.id
       ORDER BY s.collection_date DESC`
    )
    return result.rows
  }

  static async getSamplesByStatus(status: string) {
    const result = await query(
      `SELECT s.*, p.full_name as participant_name, p.participant_id,
              u.full_name as collector_name
       FROM sample_collections s
       LEFT JOIN participants p ON s.participant_id = p.id
       LEFT JOIN users u ON s.collector_id = u.id
       WHERE s.status = $1
       ORDER BY s.collection_date DESC`,
      [status]
    )
    return result.rows
  }

  static async updateSampleStatus(id: string, status: string, labDeliveryDate?: string) {
    const result = await query(
      `UPDATE sample_collections 
       SET status = $1, lab_delivery_date = $2, updated_at = NOW() 
       WHERE id = $3 RETURNING *`,
      [status, labDeliveryDate, id]
    )
    return result.rows[0]
  }
}

// Survey/Form Service
export class SurveyService {
  static async createSurvey(surveyInput: {
    formId: string
    participantId: string
    collectorId: string
    surveyData: any
    completionStatus?: string
  }) {
    const { formId, participantId, collectorId, surveyData, completionStatus } = surveyInput

    const result = await query(
      `INSERT INTO surveys (form_id, participant_id, collector_id, survey_data, completion_status)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [formId, participantId, collectorId, JSON.stringify(surveyData), completionStatus || 'draft']
    )

    return result.rows[0]
  }

  static async getAllSurveys() {
    const result = await query(
      `SELECT s.*, p.full_name as participant_name, p.participant_id,
              u.full_name as collector_name, f.title as form_title
       FROM surveys s
       LEFT JOIN participants p ON s.participant_id = p.id
       LEFT JOIN users u ON s.collector_id = u.id
       LEFT JOIN forms f ON s.form_id = f.form_id
       ORDER BY s.created_at DESC`
    )
    return result.rows
  }

  static async submitSurvey(id: string) {
    const result = await query(
      `UPDATE surveys 
       SET completion_status = 'submitted', submitted_at = NOW(), updated_at = NOW() 
       WHERE id = $1 RETURNING *`,
      [id]
    )
    return result.rows[0]
  }

  static async updateAIValidation(id: string, validationStatus: string, flags?: any) {
    const result = await query(
      `UPDATE surveys 
       SET ai_validation_status = $1, ai_flags = $2, updated_at = NOW() 
       WHERE id = $3 RETURNING *`,
      [validationStatus, JSON.stringify(flags), id]
    )
    return result.rows[0]
  }
}

// AI Analysis Service
export class AIAnalysisService {
  static async saveAnalysis(analysisData: {
    entityType: string
    entityId: string
    analysisType: string
    provider: string
    inputData: any
    analysisResult: any
    confidenceScore?: number
    flags?: any
    recommendations?: string
  }) {
    const {
      entityType, entityId, analysisType, provider, inputData,
      analysisResult, confidenceScore, flags, recommendations
    } = analysisData

    const result = await query(
      `INSERT INTO ai_analysis (entity_type, entity_id, analysis_type, provider, 
                              input_data, analysis_result, confidence_score, flags, recommendations)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [entityType, entityId, analysisType, provider, JSON.stringify(inputData),
       JSON.stringify(analysisResult), confidenceScore, JSON.stringify(flags), recommendations]
    )

    return result.rows[0]
  }

  static async getAnalysisByEntity(entityType: string, entityId: string) {
    const result = await query(
      `SELECT * FROM ai_analysis 
       WHERE entity_type = $1 AND entity_id = $2 
       ORDER BY created_at DESC`,
      [entityType, entityId]
    )
    return result.rows
  }

  static async getLatestAnalysis(analysisType: string, limit: number = 50) {
    const result = await query(
      `SELECT * FROM ai_analysis 
       WHERE analysis_type = $1 
       ORDER BY created_at DESC 
       LIMIT $2`,
      [analysisType, limit]
    )
    return result.rows
  }
}

// System Logging Service
export class LogService {
  static async logAction(logData: {
    userId?: string
    action: string
    entityType?: string
    entityId?: string
    details?: any
    ipAddress?: string
    userAgent?: string
  }) {
    const { userId, action, entityType, entityId, details, ipAddress, userAgent } = logData

    const result = await query(
      `INSERT INTO system_logs (user_id, action, entity_type, entity_id, details, ip_address, user_agent)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [userId, action, entityType, entityId, JSON.stringify(details), ipAddress, userAgent]
    )

    return result.rows[0]
  }

  static async getSystemLogs(limit: number = 100) {
    const result = await query(
      `SELECT l.*, u.full_name as user_name, u.email as user_email
       FROM system_logs l
       LEFT JOIN users u ON l.user_id = u.id
       ORDER BY l.created_at DESC
       LIMIT $1`,
      [limit]
    )
    return result.rows
  }

  static async getLogsByUser(userId: string, limit: number = 50) {
    const result = await query(
      `SELECT * FROM system_logs 
       WHERE user_id = $1 
       ORDER BY created_at DESC 
       LIMIT $2`,
      [userId, limit]
    )
    return result.rows
  }
}
