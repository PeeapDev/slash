import { NextRequest, NextResponse } from 'next/server'
import { SampleCollectionService } from '@/lib/sample-services'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const role = searchParams.get('role')
    const regionId = searchParams.get('regionId')
    const districtId = searchParams.get('districtId')
    const status = searchParams.get('status')
    const sampleType = searchParams.get('sampleType')
    const projectId = searchParams.get('projectId')
    const search = searchParams.get('search')

    let samples

    if (search) {
      samples = await SampleCollectionService.searchSamples(search)
    } else {
      samples = await SampleCollectionService.getAllSamples({
        userId: userId || undefined,
        role: role || undefined,
        regionId: regionId || undefined,
        districtId: districtId || undefined,
        status: status || undefined,
        sampleType: sampleType || undefined,
        projectId: projectId || undefined
      })
    }

    return NextResponse.json({ 
      success: true, 
      data: samples,
      count: samples.length
    })
  } catch (error) {
    console.error('Error fetching samples:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch samples' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      sampleTypeCode,
      projectId,
      participantId,
      collectedBy,
      collectionDate,
      collectionMetadata,
      volumeCollected,
      containerCorrect,
      temperatureAtCollection,
      transportNotes
    } = body

    // Validate required fields
    if (!sampleTypeCode || !projectId || !participantId || !collectedBy) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const sample = await SampleCollectionService.createSample({
      sampleTypeCode,
      projectId,
      participantId,
      collectedBy,
      collectionDate,
      collectionMetadata,
      volumeCollected,
      containerCorrect,
      temperatureAtCollection,
      transportNotes
    })

    return NextResponse.json({ 
      success: true, 
      data: sample,
      message: 'Sample created successfully'
    })
  } catch (error) {
    console.error('Error creating sample:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create sample' },
      { status: 500 }
    )
  }
}
