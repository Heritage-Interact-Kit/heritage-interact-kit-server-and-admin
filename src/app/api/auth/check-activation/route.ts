import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

// GET /api/auth/check-activation - Check if current user is active
export async function GET() {
  try {
    const supabase = await createClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const isActive = user.user_metadata?.is_active !== false

    return NextResponse.json({
      user_id: user.id,
      email: user.email,
      is_active: isActive,
      deactivated_at: user.user_metadata?.deactivated_at || null
    })

  } catch (error) {
    console.error('Error checking user activation:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
