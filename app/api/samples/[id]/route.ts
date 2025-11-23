import { NextRequest, NextResponse } from 'next/server'
import { SampleCollectionService } from '@/lib/sample-services'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const sampleId = params.id
    
    const sample = await SampleCollectionService.getSampleById(sampleId)
    
    if (!sample) {
      return NextResponse.json(
        { success: false, error: 'Sample not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ 
      success: true, 
      data: sample
    })
  } catch (error) {
    console.error('Error fetching sample:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch sample' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const sampleId = params.id
    const body = await request.json()
    const {
      status,
      userId,
      receivedBy,
      labResults,
      labComments,
      normalRangeValidation,
      rejectionReason,
      rejectionNotes
    } = body

    // Validate required fields
    if (!status || !userId) {
      return NextResponse.json(
        { success: false, error: 'Status and userId are required' },
        { status: 400 }
      )
    }

    // Validate status transitions
    const validStatuses = ['not_collected', 'collected', 'in_transit', 'lab_pending', 'lab_completed', 'rejected']
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { success: false, error: 'Invalid status' },
        { status: 400 }
      )
    }

    const updatedSample = await SampleCollectionService.updateSampleStatus(
      sampleId,
      status,
      userId,
      {
        receivedBy,
        labResults,
        labComments,
        normalRangeValidation,
        rejectionReason,
        rejectionNotes
      }
    )

    return NextResponse.json({ 
      success: true, 
      data: updatedSample,
      message: 'Sample status updated successfully'
    })
  } catch (error) {
    console.error('Error updating sample:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update sample' },
      { status: 500 }
    )
  }
}
