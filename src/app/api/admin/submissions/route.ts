import { createClient } from '@/utils/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// GET /api/admin/submissions - List all submissions with pagination and filtering
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Check authentication (admin only)
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const search = searchParams.get('search') || ''
    const taskId = searchParams.get('task_id')
    const objectId = searchParams.get('object_id')
    const endUserId = searchParams.get('end_user_id')
    const sortBy = searchParams.get('sort_by') || 'created_at'
    const sortOrder = searchParams.get('sort_order') || 'desc'

    const offset = (page - 1) * limit

    // Build query with simplified joins using direct object relationship
    let query = supabase
      .from('submissions')
      .select(`
        *,
        task:tasks(id, title),
        end_user:end_users(id, email, username, display_name, first_name, last_name),
        object:objects(id, title)
      `, { count: 'exact' })

    // Apply search filter (search in remarks and user details)
    if (search) {
      query = query.or(`remarks.ilike.%${search}%`)
    }

    // Apply task filter
    if (taskId) {
      query = query.eq('task_id', taskId)
    }

    // Apply object filter (NEW - direct filtering by object_id)
    if (objectId) {
      query = query.eq('object_id', objectId)
    }

    // Apply end user filter
    if (endUserId) {
      query = query.eq('end_user_id', endUserId)
    }

    // Apply sorting
    query = query.order(sortBy, { ascending: sortOrder === 'asc' })

    // Apply pagination
    query = query.range(offset, offset + limit - 1)

    const { data: submissions, error, count } = await query

    if (error) {
      console.error('Error fetching submissions:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ 
      data: submissions || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 