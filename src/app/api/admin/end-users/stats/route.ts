import { createClient } from '@/utils/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// GET /api/admin/end-users/stats - Get end user statistics
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Check authentication (admin only)
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get total users count
    const { count: totalUsers, error: totalError } = await supabase
      .from('end_users')
      .select('id', { count: 'exact', head: true })

    if (totalError) {
      console.error('Error fetching total users:', totalError)
      return NextResponse.json({ error: totalError.message }, { status: 500 })
    }

    // Get active users count
    const { count: activeUsers, error: activeError } = await supabase
      .from('end_users')
      .select('id', { count: 'exact', head: true })
      .eq('is_active', true)

    if (activeError) {
      console.error('Error fetching active users:', activeError)
      return NextResponse.json({ error: activeError.message }, { status: 500 })
    }

    // Get new users this month
    const startOfMonth = new Date()
    startOfMonth.setDate(1)
    startOfMonth.setHours(0, 0, 0, 0)

    const { count: newUsersThisMonth, error: newUsersError } = await supabase
      .from('end_users')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', startOfMonth.toISOString())

    if (newUsersError) {
      console.error('Error fetching new users:', newUsersError)
      return NextResponse.json({ error: newUsersError.message }, { status: 500 })
    }

    const stats = {
      total_users: totalUsers || 0,
      active_users: activeUsers || 0,
      new_users_this_month: newUsersThisMonth || 0
    }

    return NextResponse.json({ data: stats })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 