import { createClient } from '@/utils/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { getSiteSettings } from '@/utils/settings'

// GET /api/mobile/submissions/user - Get current user's submissions
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get current user's end_user record
    const { data: endUser, error: endUserError } = await supabase
      .from('end_users')
      .select('id')
      .eq('auth_user_id', user.id)
      .single()

    if (endUserError) {
      console.error('Error fetching end user:', endUserError)
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 })
    }

    // Get all submissions by this user with related task and object details
    const { data: submissions, error } = await supabase
      .from('submissions')
      .select(`
        *,
        task:tasks(
          id,
          title,
          description,
          thumbnail_url,
          detailed_img_url
        ),
        object:objects(
          id,
          title,
          description,
          thumbnail_url
        )
      `)
      .eq('end_user_id', endUser.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching user submissions:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Get site settings
    const settings = await getSiteSettings()

    return NextResponse.json({ 
      data: submissions || [],
      settings
    })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 