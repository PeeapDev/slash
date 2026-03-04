import { NextRequest, NextResponse } from 'next/server'
import { isSupabaseConfigured, getSupabaseClient } from '@/lib/database'

// GET /api/forms?id=FORM-003 — fetch a published form by ID
export async function GET(request: NextRequest) {
  const formId = request.nextUrl.searchParams.get('id')
  if (!formId) {
    return NextResponse.json({ success: false, error: 'Missing form ID' }, { status: 400 })
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ success: false, error: 'Server not configured' }, { status: 503 })
  }

  try {
    const sb = getSupabaseClient()
    const { data, error } = await sb
      .from('forms')
      .select('*')
      .eq('form_id', formId)
      .single()

    if (error || !data) {
      return NextResponse.json({ success: false, error: 'Form not found' }, { status: 404 })
    }

    // form_schema contains the full form object
    return NextResponse.json({ success: true, form: data.form_schema })
  } catch {
    return NextResponse.json({ success: false, error: 'Failed to fetch form' }, { status: 500 })
  }
}

// POST /api/forms — publish a form to server
export async function POST(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ success: false, error: 'Server not configured' }, { status: 503 })
  }

  try {
    const body = await request.json()
    const { form } = body

    if (!form?.id) {
      return NextResponse.json({ success: false, error: 'Missing form data' }, { status: 400 })
    }

    const sb = getSupabaseClient()
    const { error } = await sb
      .from('forms')
      .upsert({
        form_id: form.id,
        title: form.name || form.id,
        description: form.description || '',
        form_schema: form,
        version: form.versions?.length || 1,
        is_active: form.status !== 'archived',
        updated_at: new Date().toISOString(),
      }, { onConflict: 'form_id' })

    if (error) {
      console.error('Form publish error:', error.message)
      return NextResponse.json({
        success: false,
        error: `Could not publish: ${error.message}`
      }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Form publish failed:', error)
    return NextResponse.json({ success: false, error: 'Publish failed' }, { status: 500 })
  }
}
