import { NextRequest, NextResponse } from 'next/server'
import { SampleAnalyticsService } from '@/lib/sample-services'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')
    const userId = searchParams.get('userId')
    const role = searchParams.get('role')
    const regionId = searchParams.get('regionId')
    const districtId = searchParams.get('districtId')
    const projectId = searchParams.get('projectId')

    let data

    switch (type) {
      case 'dashboard':
        data = await SampleAnalyticsService.getDashboardStats(
          userId || undefined,
          role || undefined,
          regionId || undefined,
          districtId || undefined
        )
        break

      case 'collection_progress':
        data = await SampleAnalyticsService.getCollectionProgress(
          projectId || undefined
        )
        break

      case 'lab_turnaround':
        data = await SampleAnalyticsService.getLabTurnaroundStats()
        break

      case 'top_collectors':
        const limit = parseInt(searchParams.get('limit') || '10')
        data = await SampleAnalyticsService.getTopCollectors(limit)
        break

      case 'anomalies':
        data = await SampleAnalyticsService.getAnomalies()
        break

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid analytics type' },
          { status: 400 }
        )
    }

    return NextResponse.json({ 
      success: true, 
      data,
      type
    })
  } catch (error) {
    console.error('Error fetching sample analytics:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch analytics' },
      { status: 500 }
    )
  }
}
