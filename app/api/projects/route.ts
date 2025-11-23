import { NextRequest, NextResponse } from 'next/server'
import { ProjectService } from '@/lib/sample-services'

export async function GET() {
  try {
    const projects = await ProjectService.getAllProjects()
    
    return NextResponse.json({ 
      success: true, 
      data: projects,
      count: projects.length
    })
  } catch (error) {
    console.error('Error fetching projects:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch projects' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      projectCode,
      projectName,
      description,
      regionIds,
      districtIds,
      expectedSampleTypes,
      targetSamplesCount,
      startDate,
      endDate,
      createdBy
    } = body

    // Validate required fields
    if (!projectCode || !projectName || !regionIds || !districtIds || !expectedSampleTypes || !createdBy) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Validate arrays
    if (!Array.isArray(regionIds) || !Array.isArray(districtIds) || !Array.isArray(expectedSampleTypes)) {
      return NextResponse.json(
        { success: false, error: 'regionIds, districtIds, and expectedSampleTypes must be arrays' },
        { status: 400 }
      )
    }

    // Validate project code format
    if (!/^[A-Z0-9_-]+$/.test(projectCode)) {
      return NextResponse.json(
        { success: false, error: 'Project code must contain only uppercase letters, numbers, underscores, and hyphens' },
        { status: 400 }
      )
    }

    const project = await ProjectService.createProject({
      projectCode,
      projectName,
      description,
      regionIds,
      districtIds,
      expectedSampleTypes,
      targetSamplesCount: targetSamplesCount || 0,
      startDate,
      endDate,
      createdBy
    })

    return NextResponse.json({ 
      success: true, 
      data: project,
      message: 'Project created successfully'
    })
  } catch (error) {
    console.error('Error creating project:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create project' },
      { status: 500 }
    )
  }
}
