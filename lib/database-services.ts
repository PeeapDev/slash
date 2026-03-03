import { getSupabaseClient } from './database'

// User Management Service — reads/writes users_profile via PostgREST
export class UserService {
  static async getUserByEmail(email: string) {
    const sb = getSupabaseClient()
    const { data, error } = await sb
      .from('users_profile')
      .select('*')
      .eq('email', email)
      .eq('is_active', true)
      .single()
    if (error && error.code !== 'PGRST116') throw error // PGRST116 = no rows
    return data
  }

  static async getUserById(id: string) {
    const sb = getSupabaseClient()
    const { data, error } = await sb
      .from('users_profile')
      .select('id, email, full_name, role, region_id, district_id, is_active, employment_status, created_at')
      .eq('id', id)
      .single()
    if (error && error.code !== 'PGRST116') throw error
    return data
  }

  static async getAllUsers() {
    const sb = getSupabaseClient()
    const { data, error } = await sb
      .from('users_profile')
      .select('id, email, full_name, role, region_id, district_id, is_active, employment_status, created_at')
      .order('created_at', { ascending: false })
    if (error) throw error
    return data || []
  }

  static async updateUser(id: string, updates: Partial<{
    email: string
    fullName: string
    role: string
    regionId: string
    districtId: string
    isActive: boolean
    employmentStatus: string
  }>) {
    const sb = getSupabaseClient()
    // Map camelCase to snake_case
    const mapped: Record<string, any> = { updated_at: new Date().toISOString() }
    if (updates.email !== undefined) mapped.email = updates.email
    if (updates.fullName !== undefined) mapped.full_name = updates.fullName
    if (updates.role !== undefined) mapped.role = updates.role
    if (updates.regionId !== undefined) mapped.region_id = updates.regionId
    if (updates.districtId !== undefined) mapped.district_id = updates.districtId
    if (updates.isActive !== undefined) mapped.is_active = updates.isActive
    if (updates.employmentStatus !== undefined) mapped.employment_status = updates.employmentStatus

    const { data, error } = await sb
      .from('users_profile')
      .update(mapped)
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return data
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
    const sb = getSupabaseClient()
    const { data, error } = await sb
      .from('households')
      .insert({
        household_id: householdData.householdId,
        head_of_household: householdData.headOfHousehold,
        address: householdData.address,
        region: householdData.region,
        district: householdData.district,
        chiefdom: householdData.chiefdom,
        section: householdData.section,
        gps_coordinates: householdData.gpsCoordinates,
        phone_number: householdData.phoneNumber,
        total_members: householdData.totalMembers || 0,
        created_by: householdData.createdBy,
      })
      .select()
      .single()
    if (error) throw error
    return data
  }

  static async getAllHouseholds() {
    const sb = getSupabaseClient()
    const { data, error } = await sb
      .from('households')
      .select('*, users_profile!created_by(full_name)')
      .order('created_at', { ascending: false })
    if (error) throw error
    return (data || []).map((h: any) => ({
      ...h,
      created_by_name: h.users_profile?.full_name ?? null,
    }))
  }

  static async getHouseholdById(id: string) {
    const sb = getSupabaseClient()
    const { data, error } = await sb
      .from('households')
      .select('*, users_profile!created_by(full_name), participants(count)')
      .eq('id', id)
      .single()
    if (error) throw error
    return data ? {
      ...data,
      created_by_name: data.users_profile?.full_name ?? null,
      participant_count: data.participants?.[0]?.count ?? 0,
    } : null
  }

  static async getHouseholdsByRegion(region: string) {
    const sb = getSupabaseClient()
    const { data, error } = await sb
      .from('households')
      .select('*')
      .eq('region', region)
      .order('created_at', { ascending: false })
    if (error) throw error
    return data || []
  }

  static async updateHousehold(id: string, updates: any) {
    const sb = getSupabaseClient()
    const mapped: Record<string, any> = { updated_at: new Date().toISOString() }
    for (const [key, value] of Object.entries(updates)) {
      mapped[key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`)] = value
    }
    const { data, error } = await sb
      .from('households')
      .update(mapped)
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return data
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
    const sb = getSupabaseClient()
    const { data, error } = await sb
      .from('participants')
      .insert({
        participant_id: participantData.participantId,
        household_id: participantData.householdId,
        full_name: participantData.fullName,
        date_of_birth: participantData.dateOfBirth,
        gender: participantData.gender,
        relationship_to_head: participantData.relationshipToHead,
        phone_number: participantData.phoneNumber,
        education_level: participantData.educationLevel,
        occupation: participantData.occupation,
        health_status: participantData.healthStatus || 'unknown',
        risk_level: participantData.riskLevel || 'low',
        created_by: participantData.createdBy,
      })
      .select()
      .single()
    if (error) throw error
    return data
  }

  static async getAllParticipants() {
    const sb = getSupabaseClient()
    const { data, error } = await sb
      .from('participants')
      .select('*, households!household_id(household_id, head_of_household), users_profile!created_by(full_name)')
      .order('created_at', { ascending: false })
    if (error) throw error
    return (data || []).map((p: any) => ({
      ...p,
      household_id_code: p.households?.household_id ?? null,
      head_of_household: p.households?.head_of_household ?? null,
      created_by_name: p.users_profile?.full_name ?? null,
    }))
  }

  static async getParticipantsByHousehold(householdId: string) {
    const sb = getSupabaseClient()
    const { data, error } = await sb
      .from('participants')
      .select('*')
      .eq('household_id', householdId)
      .order('created_at', { ascending: true })
    if (error) throw error
    return data || []
  }

  static async getParticipantById(id: string) {
    const sb = getSupabaseClient()
    const { data, error } = await sb
      .from('participants')
      .select('*, households!household_id(household_id, head_of_household, address)')
      .eq('id', id)
      .single()
    if (error) throw error
    return data ? {
      ...data,
      household_id_code: data.households?.household_id ?? null,
      head_of_household: data.households?.head_of_household ?? null,
      address: data.households?.address ?? null,
    } : null
  }

  static async updateParticipantRiskLevel(id: string, riskLevel: string, healthStatus?: string) {
    const sb = getSupabaseClient()
    const updates: Record<string, any> = { risk_level: riskLevel, updated_at: new Date().toISOString() }
    if (healthStatus) updates.health_status = healthStatus
    const { data, error } = await sb
      .from('participants')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return data
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
    const sb = getSupabaseClient()
    const { data, error } = await sb
      .from('sample_collections')
      .insert({
        sample_id: sampleData.sampleId,
        participant_id: sampleData.participantId,
        collector_id: sampleData.collectorId,
        sample_type: sampleData.sampleType,
        collection_date: sampleData.collectionDate,
        collection_site: sampleData.collectionSite,
        storage_conditions: sampleData.storageConditions,
        transport_method: sampleData.transportMethod,
        notes: sampleData.notes,
      })
      .select()
      .single()
    if (error) throw error
    return data
  }

  static async getAllSamples() {
    const sb = getSupabaseClient()
    const { data, error } = await sb
      .from('sample_collections')
      .select('*, participants!participant_id(full_name, participant_id), users_profile!collector_id(full_name)')
      .order('collection_date', { ascending: false })
    if (error) throw error
    return (data || []).map((s: any) => ({
      ...s,
      participant_name: s.participants?.full_name ?? null,
      participant_id_code: s.participants?.participant_id ?? null,
      collector_name: s.users_profile?.full_name ?? null,
    }))
  }

  static async getSamplesByStatus(status: string) {
    const sb = getSupabaseClient()
    const { data, error } = await sb
      .from('sample_collections')
      .select('*, participants!participant_id(full_name, participant_id), users_profile!collector_id(full_name)')
      .eq('status', status)
      .order('collection_date', { ascending: false })
    if (error) throw error
    return (data || []).map((s: any) => ({
      ...s,
      participant_name: s.participants?.full_name ?? null,
      participant_id_code: s.participants?.participant_id ?? null,
      collector_name: s.users_profile?.full_name ?? null,
    }))
  }

  static async updateSampleStatus(id: string, status: string, labDeliveryDate?: string) {
    const sb = getSupabaseClient()
    const updates: Record<string, any> = { status, updated_at: new Date().toISOString() }
    if (labDeliveryDate) updates.lab_delivery_date = labDeliveryDate
    const { data, error } = await sb
      .from('sample_collections')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return data
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
    const sb = getSupabaseClient()
    const { data, error } = await sb
      .from('surveys')
      .insert({
        form_id: surveyInput.formId,
        participant_id: surveyInput.participantId,
        collector_id: surveyInput.collectorId,
        survey_data: surveyInput.surveyData,
        completion_status: surveyInput.completionStatus || 'draft',
      })
      .select()
      .single()
    if (error) throw error
    return data
  }

  static async getAllSurveys() {
    const sb = getSupabaseClient()
    const { data, error } = await sb
      .from('surveys')
      .select('*, participants!participant_id(full_name, participant_id), users_profile!collector_id(full_name), forms!form_id(title)')
      .order('created_at', { ascending: false })
    if (error) throw error
    return (data || []).map((s: any) => ({
      ...s,
      participant_name: s.participants?.full_name ?? null,
      participant_id_code: s.participants?.participant_id ?? null,
      collector_name: s.users_profile?.full_name ?? null,
      form_title: s.forms?.title ?? null,
    }))
  }

  static async submitSurvey(id: string) {
    const sb = getSupabaseClient()
    const { data, error } = await sb
      .from('surveys')
      .update({
        completion_status: 'submitted',
        submitted_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return data
  }

  static async updateAIValidation(id: string, validationStatus: string, flags?: any) {
    const sb = getSupabaseClient()
    const { data, error } = await sb
      .from('surveys')
      .update({
        ai_validation_status: validationStatus,
        ai_flags: flags,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return data
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
    const sb = getSupabaseClient()
    const { data, error } = await sb
      .from('ai_analysis')
      .insert({
        entity_type: analysisData.entityType,
        entity_id: analysisData.entityId,
        analysis_type: analysisData.analysisType,
        provider: analysisData.provider,
        input_data: analysisData.inputData,
        analysis_result: analysisData.analysisResult,
        confidence_score: analysisData.confidenceScore,
        flags: analysisData.flags,
        recommendations: analysisData.recommendations,
      })
      .select()
      .single()
    if (error) throw error
    return data
  }

  static async getAnalysisByEntity(entityType: string, entityId: string) {
    const sb = getSupabaseClient()
    const { data, error } = await sb
      .from('ai_analysis')
      .select('*')
      .eq('entity_type', entityType)
      .eq('entity_id', entityId)
      .order('created_at', { ascending: false })
    if (error) throw error
    return data || []
  }

  static async getLatestAnalysis(analysisType: string, limit: number = 50) {
    const sb = getSupabaseClient()
    const { data, error } = await sb
      .from('ai_analysis')
      .select('*')
      .eq('analysis_type', analysisType)
      .order('created_at', { ascending: false })
      .limit(limit)
    if (error) throw error
    return data || []
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
    try {
      const sb = getSupabaseClient()
      const { data, error } = await sb
        .from('system_logs')
        .insert({
          user_id: logData.userId,
          action: logData.action,
          entity_type: logData.entityType,
          entity_id: logData.entityId,
          details: logData.details,
          ip_address: logData.ipAddress,
          user_agent: logData.userAgent,
        })
        .select()
        .single()
      if (error) throw error
      return data
    } catch (e) {
      // Logging should never break the caller
      console.warn('LogService.logAction failed:', e)
      return null
    }
  }

  static async getSystemLogs(limit: number = 100) {
    const sb = getSupabaseClient()
    const { data, error } = await sb
      .from('system_logs')
      .select('*, users_profile!user_id(full_name, email)')
      .order('created_at', { ascending: false })
      .limit(limit)
    if (error) throw error
    return (data || []).map((l: any) => ({
      ...l,
      user_name: l.users_profile?.full_name ?? null,
      user_email: l.users_profile?.email ?? null,
    }))
  }

  static async getLogsByUser(userId: string, limit: number = 50) {
    const sb = getSupabaseClient()
    const { data, error } = await sb
      .from('system_logs')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit)
    if (error) throw error
    return data || []
  }
}
