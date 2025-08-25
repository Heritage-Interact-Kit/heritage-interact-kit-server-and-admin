import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'
import { getSiteSettings } from '@/utils/settings'

// POST /api/mobile/auth/login - Login for mobile app users
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { email, password } = await request.json()

    // Validate required fields
    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 })
    }

    // Authenticate with Supabase
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 401 })
    }

    // Get or create user profile - use admin client for profile operations
    const adminClient = createAdminClient()
    const { data: endUser, error: userError } = await adminClient
      .from('end_users')
      .select('*')
      .eq('auth_user_id', authData.user.id)
      .single()

    let finalUser = endUser

    // If profile doesn't exist, create it using admin client
    if (userError && userError.code === 'PGRST116') {
      // Verify auth user exists before creating profile
      const { data: authUser, error: authUserError } = await adminClient.auth.admin.getUserById(authData.user.id)
      
      if (authUserError || !authUser.user) {
        console.error('Auth user not found during login:', authUserError)
        return NextResponse.json({ error: 'User verification failed' }, { status: 500 })
      }

      const { data: newUser, error: createError } = await adminClient
        .from('end_users')
        .insert({
          auth_user_id: authData.user.id,
          email: authData.user.email,
          display_name: authData.user.user_metadata?.display_name || null,
          avatar_url: authData.user.user_metadata?.avatar_url || null,
          last_login_at: new Date().toISOString()
        })
        .select()
        .single()

      if (createError) {
        console.error('Error creating user profile:', createError)
        return NextResponse.json({ error: 'Failed to create user profile' }, { status: 500 })
      }
      finalUser = newUser
    } else if (userError) {
      console.error('Error fetching user profile:', userError)
      return NextResponse.json({ error: userError.message }, { status: 500 })
    } else {
      // Update last login using admin client
      await adminClient
        .from('end_users')
        .update({ last_login_at: new Date().toISOString() })
        .eq('id', endUser.id)
    }

    // Get site settings
    const settings = await getSiteSettings()

    return NextResponse.json({
      data: {
        user: finalUser,
        session: authData.session
      },
      settings
    })
  } catch (error) {
    console.error('Unexpected error during login:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 