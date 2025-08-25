import { createClient } from '@/utils/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// GET /api/admin/submissions/stats - Get submission statistics
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Check authentication (admin only)
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get total submissions count
    const { count: totalSubmissions, error: totalError } = await supabase
      .from('submissions')
      .select('id', { count: 'exact', head: true })

    if (totalError) {
      console.error('Error fetching total submissions:', totalError)
      return NextResponse.json({ error: totalError.message }, { status: 500 })
    }

    // Get submissions this month
    const startOfMonth = new Date()
    startOfMonth.setDate(1)
    startOfMonth.setHours(0, 0, 0, 0)

    const { count: submissionsThisMonth, error: monthlyError } = await supabase
      .from('submissions')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', startOfMonth.toISOString())

    if (monthlyError) {
      console.error('Error fetching monthly submissions:', monthlyError)
      return NextResponse.json({ error: monthlyError.message }, { status: 500 })
    }

    // Get unique submitters count
    const { data: uniqueSubmitters, error: submittersError } = await supabase
      .from('submissions')
      .select('end_user_id')

    if (submittersError) {
      console.error('Error fetching unique submitters:', submittersError)
      return NextResponse.json({ error: submittersError.message }, { status: 500 })
    }

    // Count unique submitters
    const uniqueSubmittersCount = new Set(uniqueSubmitters?.map(s => s.end_user_id)).size

    const stats = {
      total_submissions: totalSubmissions || 0,
      submissions_this_month: submissionsThisMonth || 0,
      unique_submitters: uniqueSubmittersCount || 0
    }

    return NextResponse.json({ data: stats })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 