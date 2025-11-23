import { NextRequest, NextResponse } from 'next/server'
import { SampleTypeService } from '@/lib/sample-services'

export async function GET() {
  try {
    const sampleTypes = await SampleTypeService.getAllSampleTypes()
    
    return NextResponse.json({ 
      success: true, 
      data: sampleTypes,
      count: sampleTypes.length
    })
  } catch (error) {
    console.error('Error fetching sample types:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch sample types' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      typeCode,
      displayName,
      description,
      formSchema,
      createdBy
    } = body

    // Validate required fields
    if (!typeCode || !displayName || !formSchema || !createdBy) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Validate type code format (should be uppercase, letters only)
    if (!/^[A-Z_]+$/.test(typeCode)) {
      return NextResponse.json(
        { success: false, error: 'Type code must contain only uppercase letters and underscores' },
        { status: 400 }
      )
    }

    const sampleType = await SampleTypeService.createSampleType({
      typeCode,
      displayName,
      description,
      formSchema,
      createdBy
    })

    return NextResponse.json({ 
      success: true, 
      data: sampleType,
      message: 'Sample type created successfully'
    })
  } catch (error) {
    console.error('Error creating sample type:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create sample type' },
      { status: 500 }
    )
  }
}
