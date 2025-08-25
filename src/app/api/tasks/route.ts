import { createClient } from '@/utils/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { CreateTaskRequest } from '@/types/tasks'

// GET /api/tasks - List all tasks or tasks for a specific object
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const objectId = searchParams.get('object_id')

    let query = supabase
      .from('tasks')
      .select('*')
      .order('created_at', { ascending: false })

    // Filter by object_id if provided
    if (objectId) {
      query = query.eq('object_id', objectId)
    }

    const { data: tasks, error } = await query

    if (error) {
      console.error('Error fetching tasks:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data: tasks })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/tasks - Create new task
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body: CreateTaskRequest = await request.json()
    const { object_id, title, description, thumbnail_url, detailed_img_url } = body

    // Validate required fields
    if (!title || title.trim() === '') {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 })
    }

    if (!object_id) {
      return NextResponse.json({ error: 'Object ID is required' }, { status: 400 })
    }

    // Verify that the object exists
    const { data: objectExists, error: objectError } = await supabase
      .from('objects')
      .select('id')
      .eq('id', object_id)
      .single()

    if (objectError || !objectExists) {
      return NextResponse.json({ error: 'Object not found' }, { status: 404 })
    }

    const { data: task, error } = await supabase
      .from('tasks')
      .insert({
        object_id,
        title: title.trim(),
        description: description?.trim() || null,
        thumbnail_url: thumbnail_url || null,
        detailed_img_url: detailed_img_url || null,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating task:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data: task }, { status: 201 })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 