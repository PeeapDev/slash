import { getSupabaseClient } from './database'
import { LogService } from './database-services'
import { SampleDatabaseService } from './sample-database'

// Sample Management Services — PostgREST
export class SampleTypeService {

  static async getAllSampleTypes() {
    const sb = getSupabaseClient()
    const { data, error } = await sb
      .from('sample_types')
      .select('*')
      .eq('is_active', true)
      .order('display_name')
    if (error) throw error
    return data || []
  }

  static async createSampleType(sampleTypeData: {
    typeCode: string
    displayName: string
    description?: string
    formSchema: any
    createdBy: string
  }) {
    const sb = getSupabaseClient()
    const { data, error } = await sb
      .from('sample_types')
      .insert({
        type_code: sampleTypeData.typeCode,
        display_name: sampleTypeData.displayName,
        description: sampleTypeData.description,
        form_schema: sampleTypeData.formSchema,
        created_by: sampleTypeData.createdBy,
      })
      .select()
      .single()
    if (error) throw error

    await LogService.logAction({
      userId: sampleTypeData.createdBy,
      action: 'CREATE_SAMPLE_TYPE',
      entityType: 'sample_type',
      entityId: data.id,
      details: { typeCode: sampleTypeData.typeCode, displayName: sampleTypeData.displayName },
    })

    return data
  }
}

export class ProjectService {

  static async getAllProjects() {
    const sb = getSupabaseClient()
    const { data, error } = await sb
      .from('projects')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) throw error
    return data || []
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
    const sb = getSupabaseClient()
    const { data, error } = await sb
      .from('projects')
      .insert({
        project_code: projectData.projectCode,
        project_name: projectData.projectName,
        description: projectData.description,
        region_ids: projectData.regionIds,
        district_ids: projectData.districtIds,
        expected_sample_types: projectData.expectedSampleTypes,
        target_samples_count: projectData.targetSamplesCount,
        start_date: projectData.startDate,
        end_date: projectData.endDate,
        created_by: projectData.createdBy,
      })
      .select()
      .single()
    if (error) throw error

    await LogService.logAction({
      userId: projectData.createdBy,
      action: 'CREATE_PROJECT',
      entityType: 'project',
      entityId: data.id,
      details: { projectCode: projectData.projectCode, projectName: projectData.projectName, targetSamplesCount: projectData.targetSamplesCount },
    })

    return data
  }

  static async getProjectById(projectId: string) {
    const sb = getSupabaseClient()
    const { data, error } = await sb
      .from('projects')
      .select('*, users_profile!created_by(full_name)')
      .eq('id', projectId)
      .single()
    if (error) throw error
    return data ? { ...data, created_by_name: (data as any).users_profile?.full_name ?? null } : null
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
    const sb = getSupabaseClient()

    // Generate unique sample ID
    const sampleId = await SampleDatabaseService.generateSampleId(sampleData.participantId, sampleData.sampleTypeCode)

    // Get household ID from participant
    const { data: participant, error: pErr } = await sb
      .from('participants')
      .select('household_id')
      .eq('id', sampleData.participantId)
      .single()

    if (pErr || !participant) throw new Error('Participant not found')

    const { data, error } = await sb
      .from('samples')
      .insert({
        sample_id: sampleId,
        sample_type_code: sampleData.sampleTypeCode,
        project_id: sampleData.projectId,
        household_id: participant.household_id,
        participant_id: sampleData.participantId,
        collected_by: sampleData.collectedBy,
        collection_date: sampleData.collectionDate || new Date().toISOString(),
        collection_metadata: sampleData.collectionMetadata,
        volume_collected: sampleData.volumeCollected,
        container_correct: sampleData.containerCorrect !== false,
        temperature_at_collection: sampleData.temperatureAtCollection,
        transport_notes: sampleData.transportNotes,
        status: 'collected',
      })
      .select()
      .single()
    if (error) throw error

    // Log audit trail
    await this.logSampleAudit(data.id, 'SAMPLE_COLLECTED', null, 'collected', sampleData.collectedBy, {
      sampleId, sampleTypeCode: sampleData.sampleTypeCode, volumeCollected: sampleData.volumeCollected, collectionMetadata: sampleData.collectionMetadata,
    })

    await LogService.logAction({
      userId: sampleData.collectedBy,
      action: 'COLLECT_SAMPLE',
      entityType: 'sample',
      entityId: data.id,
      details: { sampleId, sampleTypeCode: sampleData.sampleTypeCode, participantId: sampleData.participantId, volumeCollected: sampleData.volumeCollected },
    })

    return data
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
    const sb = getSupabaseClient()
    let query = sb
      .from('samples')
      .select(`
        *,
        households!household_id(household_id, head_of_household, region, district),
        participants!participant_id(participant_id, full_name),
        collector:users_profile!collected_by(full_name),
        receiver:users_profile!received_by(full_name),
        sample_types!sample_type_code(display_name),
        projects!project_id(project_name)
      `)
      .order('collection_date', { ascending: false })

    if (filters?.status) query = query.eq('status', filters.status)
    if (filters?.sampleType) query = query.eq('sample_type_code', filters.sampleType)
    if (filters?.projectId) query = query.eq('project_id', filters.projectId)
    if (filters?.role === 'field_collector' && filters.userId) query = query.eq('collected_by', filters.userId)

    const { data, error } = await query
    if (error) throw error

    let results = (data || []).map((s: any) => ({
      ...s,
      household_id_code: s.households?.household_id ?? null,
      head_of_household: s.households?.head_of_household ?? null,
      region: s.households?.region ?? null,
      district: s.households?.district ?? null,
      participant_id_code: s.participants?.participant_id ?? null,
      participant_name: s.participants?.full_name ?? null,
      collected_by_name: s.collector?.full_name ?? null,
      received_by_name: s.receiver?.full_name ?? null,
      sample_type_name: s.sample_types?.display_name ?? null,
      project_name: s.projects?.project_name ?? null,
    }))

    // Client-side region/district filtering for roles that need it
    if (filters?.role === 'regional_head' && filters.regionId) {
      results = results.filter((s: any) => s.region === filters.regionId)
    } else if (filters?.role === 'supervisor' && filters.districtId) {
      results = results.filter((s: any) => s.district === filters.districtId)
    } else if (filters?.role === 'lab_technician') {
      results = results.filter((s: any) => ['collected', 'in_transit', 'lab_pending', 'lab_completed'].includes(s.status))
    }

    return results
  }

  static async getSampleById(sampleId: string) {
    const sb = getSupabaseClient()
    const { data, error } = await sb
      .from('samples')
      .select(`
        *,
        households!household_id(household_id, head_of_household, region, district),
        participants!participant_id(participant_id, full_name),
        collector:users_profile!collected_by(full_name),
        receiver:users_profile!received_by(full_name),
        sample_types!sample_type_code(display_name, form_schema),
        projects!project_id(project_name)
      `)
      .eq('id', sampleId)
      .single()
    if (error) throw error
    if (!data) return null

    return {
      ...data,
      household_id_code: (data as any).households?.household_id ?? null,
      head_of_household: (data as any).households?.head_of_household ?? null,
      region: (data as any).households?.region ?? null,
      district: (data as any).households?.district ?? null,
      participant_id_code: (data as any).participants?.participant_id ?? null,
      participant_name: (data as any).participants?.full_name ?? null,
      collected_by_name: (data as any).collector?.full_name ?? null,
      received_by_name: (data as any).receiver?.full_name ?? null,
      sample_type_name: (data as any).sample_types?.display_name ?? null,
      form_schema: (data as any).sample_types?.form_schema ?? null,
      project_name: (data as any).projects?.project_name ?? null,
    }
  }

  static async updateSampleStatus(sampleId: string, newStatus: string, userId: string, extraData?: {
    receivedBy?: string
    labResults?: any
    labComments?: string
    normalRangeValidation?: boolean
    rejectionReason?: string
    rejectionNotes?: string
  }) {
    const sb = getSupabaseClient()

    // Get current status
    const { data: current } = await sb.from('samples').select('status').eq('id', sampleId).single()
    const oldStatus = current?.status

    const updates: Record<string, any> = { status: newStatus, updated_at: new Date().toISOString() }
    if (extraData?.receivedBy) updates.received_by = extraData.receivedBy
    if (newStatus === 'lab_pending' || newStatus === 'lab_completed') updates.received_date = new Date().toISOString()
    if (extraData?.labResults) updates.lab_results = extraData.labResults
    if (extraData?.labComments) updates.lab_comments = extraData.labComments
    if (extraData?.normalRangeValidation !== undefined) updates.normal_range_validation = extraData.normalRangeValidation
    if (extraData?.rejectionReason) updates.rejection_reason = extraData.rejectionReason
    if (extraData?.rejectionNotes) updates.rejection_notes = extraData.rejectionNotes

    const { data, error } = await sb
      .from('samples')
      .update(updates)
      .eq('id', sampleId)
      .select()
      .single()
    if (error) throw error

    await this.logSampleAudit(sampleId, 'STATUS_CHANGED', oldStatus || null, newStatus, userId, extraData)

    await LogService.logAction({
      userId,
      action: `SAMPLE_STATUS_${newStatus.toUpperCase()}`,
      entityType: 'sample',
      entityId: sampleId,
      details: { oldStatus, newStatus, ...extraData },
    })

    return data
  }

  static async searchSamples(searchTerm: string) {
    const sb = getSupabaseClient()
    const term = `%${searchTerm}%`

    const { data, error } = await sb
      .from('samples')
      .select(`
        *,
        households!household_id(household_id, head_of_household),
        participants!participant_id(participant_id, full_name),
        sample_types!sample_type_code(display_name)
      `)
      .or(`sample_id.ilike.${term}`)
      .order('collection_date', { ascending: false })
      .limit(50)

    if (error) throw error

    return (data || []).map((s: any) => ({
      ...s,
      household_id_code: s.households?.household_id ?? null,
      head_of_household: s.households?.head_of_household ?? null,
      participant_id_code: s.participants?.participant_id ?? null,
      participant_name: s.participants?.full_name ?? null,
      sample_type_name: s.sample_types?.display_name ?? null,
    }))
  }

  static async getSampleAuditLog(sampleId: string) {
    const sb = getSupabaseClient()
    const { data, error } = await sb
      .from('sample_audit_log')
      .select('*, users_profile!performed_by(full_name)')
      .eq('sample_id', sampleId)
      .order('timestamp', { ascending: false })
    if (error) throw error
    return (data || []).map((a: any) => ({
      ...a,
      performed_by_name: a.users_profile?.full_name ?? null,
    }))
  }

  private static async logSampleAudit(
    sampleId: string,
    action: string,
    oldStatus: string | null,
    newStatus: string,
    performedBy: string,
    metadata?: any
  ) {
    const sb = getSupabaseClient()
    await sb.from('sample_audit_log').insert({
      sample_id: sampleId,
      action,
      old_status: oldStatus,
      new_status: newStatus,
      performed_by: performedBy,
      metadata,
    })
  }
}

export class SampleAnalyticsService {

  static async getDashboardStats(userId?: string, role?: string, regionId?: string, districtId?: string) {
    return await SampleDatabaseService.getSampleStatistics(userId, role, regionId, districtId)
  }

  static async getCollectionProgress(projectId?: string) {
    const sb = getSupabaseClient()
    let query = sb
      .from('samples')
      .select('status, households!household_id(region, district)')

    if (projectId) query = query.eq('project_id', projectId)

    const { data, error } = await query
    if (error) throw error

    // Aggregate client-side
    const groups: Record<string, { region: string; district: string; collected: number; total: number }> = {}
    for (const s of (data || [])) {
      const region = (s as any).households?.region || 'unknown'
      const district = (s as any).households?.district || 'unknown'
      const key = `${region}|${district}`
      if (!groups[key]) groups[key] = { region, district, collected: 0, total: 0 }
      groups[key].total++
      if (s.status !== 'not_collected') groups[key].collected++
    }

    return Object.values(groups).map(g => ({
      region: g.region,
      district: g.district,
      collected_count: g.collected,
      total_samples: g.total,
      completion_percentage: g.total > 0 ? Math.round(g.collected * 10000 / g.total) / 100 : 0,
    })).sort((a, b) => b.completion_percentage - a.completion_percentage)
  }

  static async getLabTurnaroundStats() {
    const sb = getSupabaseClient()
    const { data, error } = await sb
      .from('samples')
      .select('status, collection_date, received_date, updated_at')
      .in('status', ['lab_pending', 'lab_completed'])
      .not('received_date', 'is', null)

    if (error) throw error

    const items = data || []
    let collectionToLabSum = 0, labProcessingSum = 0, count = 0

    for (const s of items) {
      if (s.collection_date && s.received_date) {
        const collToLab = (new Date(s.received_date).getTime() - new Date(s.collection_date).getTime()) / 86400000
        collectionToLabSum += collToLab
        count++
        if (s.updated_at && s.received_date) {
          labProcessingSum += (new Date(s.updated_at).getTime() - new Date(s.received_date).getTime()) / 86400000
        }
      }
    }

    return {
      avg_collection_to_lab_days: count > 0 ? Math.round(collectionToLabSum / count * 100) / 100 : null,
      avg_lab_processing_days: count > 0 ? Math.round(labProcessingSum / count * 100) / 100 : null,
      pending_count: items.filter(s => s.status === 'lab_pending').length,
      completed_count: items.filter(s => s.status === 'lab_completed').length,
    }
  }

  static async getTopCollectors(limit: number = 10) {
    const sb = getSupabaseClient()
    const { data, error } = await sb
      .from('users_profile')
      .select('full_name, email, id')
      .eq('role', 'field_collector')

    if (error) throw error

    const collectors = data || []
    const results = []

    for (const c of collectors) {
      const { count } = await sb
        .from('samples')
        .select('*', { count: 'exact', head: true })
        .eq('collected_by', c.id)

      results.push({
        full_name: c.full_name,
        email: c.email,
        total_samples: count || 0,
      })
    }

    return results.sort((a, b) => b.total_samples - a.total_samples).slice(0, limit)
  }

  static async getAnomalies() {
    const sb = getSupabaseClient()

    // Stale lab-pending samples
    const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString()
    const { data: stale } = await sb
      .from('samples')
      .select('sample_id, sample_type_code, status, ai_flags, participants!participant_id(full_name), households!household_id(household_id)')
      .eq('status', 'lab_pending')
      .lt('received_date', sevenDaysAgo)

    // Volume anomalies
    const { data: volAnomaly } = await sb
      .from('samples')
      .select('sample_id, sample_type_code, status, ai_flags, volume_collected, participants!participant_id(full_name), households!household_id(household_id)')
      .not('volume_collected', 'is', null)
      .or('volume_collected.lt.0.5,volume_collected.gt.500')

    const results: any[] = []

    for (const s of (stale || [])) {
      results.push({
        sample_id: s.sample_id,
        sample_type_code: s.sample_type_code,
        status: s.status,
        participant_name: (s as any).participants?.full_name ?? null,
        household_id: (s as any).households?.household_id ?? null,
        ai_flags: s.ai_flags,
        anomaly_type: 'Missing lab results',
      })
    }

    for (const s of (volAnomaly || [])) {
      results.push({
        sample_id: s.sample_id,
        sample_type_code: s.sample_type_code,
        status: s.status,
        participant_name: (s as any).participants?.full_name ?? null,
        household_id: (s as any).households?.household_id ?? null,
        ai_flags: s.ai_flags,
        anomaly_type: 'Volume anomaly',
      })
    }

    return results.sort((a, b) => a.sample_id.localeCompare(b.sample_id))
  }
}
