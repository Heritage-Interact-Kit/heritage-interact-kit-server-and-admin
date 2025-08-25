import { createClient } from '@/utils/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// GET /api/admin/end-users - List all end users with pagination and filtering
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
    const isActive = searchParams.get('is_active')
    const sortBy = searchParams.get('sort_by') || 'created_at'
    const sortOrder = searchParams.get('sort_order') || 'desc'

    const offset = (page - 1) * limit

    // Build query
    let query = supabase
      .from('end_users')
      .select('*', { count: 'exact' })

    // Apply search filter
    if (search) {
      query = query.or(`email.ilike.%${search}%,username.ilike.%${search}%,first_name.ilike.%${search}%,last_name.ilike.%${search}%,display_name.ilike.%${search}%`)
    }

    // Apply active filter
    if (isActive !== null && isActive !== '') {
      query = query.eq('is_active', isActive === 'true')
    }

    // Apply sorting
    query = query.order(sortBy, { ascending: sortOrder === 'asc' })

    // Apply pagination
    query = query.range(offset, offset + limit - 1)

    const { data: endUsers, error, count } = await query

    if (error) {
      console.error('Error fetching end users:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ 
      data: endUsers,
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