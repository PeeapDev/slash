import { getSupabaseClient } from './database'

// Sample management database operations — PostgREST
export class SampleDatabaseService {

  // Generate unique sample ID
  static async generateSampleId(participantId: string, sampleTypeCode: string): Promise<string> {
    const sb = getSupabaseClient()

    // Get participant + household info
    const { data: participant, error: pErr } = await sb
      .from('participants')
      .select('participant_id, households!household_id(household_id, region, district)')
      .eq('id', participantId)
      .single()

    if (pErr || !participant) throw new Error('Participant not found')

    const hh = (participant as any).households
    const { participant_id, } = participant as any
    const { household_id, region, district } = hh

    // Count existing samples for this participant + type
    const { count, error: cErr } = await sb
      .from('samples')
      .select('*', { count: 'exact', head: true })
      .eq('participant_id', participantId)
      .eq('sample_type_code', sampleTypeCode)

    if (cErr) throw cErr

    const sampleNumber = ((count || 0) + 1).toString().padStart(2, '0')

    const regionCode = region.substring(0, 4).toUpperCase()
    const districtCode = district.substring(0, 6).toUpperCase()
    const householdCode = household_id.substring(0, 6).toUpperCase()
    const participantCode = participant_id.substring(0, 3).toUpperCase()
    const sampleTypeShort = sampleTypeCode.substring(0, 3)

    let sampleId = `${regionCode}-${districtCode}-${householdCode}-${participantCode}-${sampleTypeShort}${sampleNumber}`

    // Ensure uniqueness
    const { count: existing } = await sb
      .from('samples')
      .select('*', { count: 'exact', head: true })
      .eq('sample_id', sampleId)

    if (existing && existing > 0) {
      const timestamp = Date.now().toString().slice(-4)
      sampleId = `${sampleId}-${timestamp}`
    }

    return sampleId
  }

  // Get sample statistics for dashboard
  static async getSampleStatistics(userId?: string, role?: string, regionId?: string, districtId?: string) {
    const sb = getSupabaseClient()

    // For complex aggregation, fetch all samples and compute client-side
    let query = sb
      .from('samples')
      .select('status, sample_type_code, collected_by, households!household_id(region, district)')

    const { data, error } = await query
    if (error) throw error

    let filtered = data || []

    // Apply role-based filtering client-side
    if (role === 'field_collector' && userId) {
      filtered = filtered.filter((s: any) => s.collected_by === userId)
    } else if (role === 'regional_head' && regionId) {
      filtered = filtered.filter((s: any) => s.households?.region === regionId)
    } else if (role === 'supervisor' && districtId) {
      filtered = filtered.filter((s: any) => s.households?.district === districtId)
    }

    return {
      total_samples: filtered.length,
      not_collected: filtered.filter((s: any) => s.status === 'not_collected').length,
      collected: filtered.filter((s: any) => s.status === 'collected').length,
      in_transit: filtered.filter((s: any) => s.status === 'in_transit').length,
      lab_pending: filtered.filter((s: any) => s.status === 'lab_pending').length,
      lab_completed: filtered.filter((s: any) => s.status === 'lab_completed').length,
      rejected: filtered.filter((s: any) => s.status === 'rejected').length,
      urine_samples: filtered.filter((s: any) => s.sample_type_code === 'URINE').length,
      blood_samples: filtered.filter((s: any) => s.sample_type_code === 'BLOOD').length,
    }
  }
}
