import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'
import { getSiteSettings } from '@/utils/settings'
import type { AuthResponse } from '@supabase/supabase-js'

// POST /api/mobile/auth/signup - Signup for mobile app users  
export async function POST(request: NextRequest) {
  try {
    const { email, password, display_name, username } = await request.json()

    // Validate required fields
    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 })
    }

    const adminClient = createAdminClient()

    // Check if username is unique (if provided)
    if (username) {
      const { data: existingUser } = await adminClient
        .from('end_users')
        .select('id')
        .eq('username', username)
        .single()

      if (existingUser) {
        return NextResponse.json({ error: 'Username already exists' }, { status: 400 })
      }
    }

    // Check if email already exists as end-user (allow if only admin exists)
    const { data: existingEndUser } = await adminClient
      .from('end_users')
      .select('id')
      .eq('email', email)
      .single()
    
    if (existingEndUser) {
      return NextResponse.json({ error: 'Email already exists as end-user' }, { status: 400 })
    }

    // Check if auth user exists
    const { data: existingAuthUser } = await adminClient.auth.admin.listUsers()
    const existingUser = existingAuthUser.users?.find(user => user.email === email)
    
    let authUserId: string
    let sessionData: AuthResponse['data'] | null = null

    if (existingUser) {
      // User exists in auth table (likely an admin), use existing auth user
      authUserId = existingUser.id
      console.log('Using existing auth user (admin) for end-user profile:', authUserId)
      
      // Try to create a session with provided password
      const supabase = await createClient()
      const { data: testSession, error: sessionError } = await supabase.auth.signInWithPassword({
        email,
        password
      })
      
      if (!sessionError && testSession?.session) {
        sessionData = testSession
      }
    } else {
      // Create new auth user
      const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
        email,
        password,
        user_metadata: {
          display_name: display_name || null
        },
        email_confirm: true // Skip email confirmation for mobile app
      })

      if (authError || !authData.user) {
        console.error('Error creating auth user:', authError)
        return NextResponse.json({ error: authError?.message || 'Failed to create user' }, { status: 400 })
      }

      authUserId = authData.user.id
      console.log('Created new auth user for end-user:', authUserId)

      // Create a session for the new user
      const supabase = await createClient()
      const { data: newSessionData, error: sessionError } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (!sessionError) {
        sessionData = newSessionData
      }
    }

    // Create user profile 
    const { data: endUser, error: profileError } = await adminClient
      .from('end_users')
      .insert({
        auth_user_id: authUserId,
        email: email,
        username: username || null,
        display_name: display_name || null,
        last_login_at: new Date().toISOString()
      })
      .select()
      .single()

    if (profileError) {
      console.error('Error creating user profile:', profileError)
      
      // Only clean up auth user if we created it (not if it was existing admin)
      if (!existingUser) {
        try {
          await adminClient.auth.admin.deleteUser(authUserId)
        } catch (cleanupError) {
          console.error('Failed to cleanup auth user:', cleanupError)
        }
      }
      
      return NextResponse.json({ error: 'Failed to create user profile' }, { status: 500 })
    }

    console.log('Profile created successfully')

    // Get site settings
    const settings = await getSiteSettings()

    return NextResponse.json({
      data: {
        user: endUser,
        session: sessionData?.session || null
      },
      settings
    }, { status: 201 })
  } catch (error) {
    console.error('Unexpected error during signup:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 