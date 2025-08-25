import { createClient } from '@/utils/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { CreateEndUserRequest, UpdateEndUserRequest } from '@/types/end-users'

// GET /api/mobile/profile - Get current user's profile
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: endUser, error } = await supabase
      .from('end_users')
      .select('*')
      .eq('auth_user_id', user.id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
      }
      console.error('Error fetching user profile:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Update last_login_at
    await supabase
      .from('end_users')
      .update({ last_login_at: new Date().toISOString() })
      .eq('id', endUser.id)

    return NextResponse.json({ data: endUser })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/mobile/profile - Create user profile
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body: CreateEndUserRequest = await request.json()

    // Check if profile already exists
    const { data: existingUser } = await supabase
      .from('end_users')
      .select('id')
      .eq('auth_user_id', user.id)
      .single()

    if (existingUser) {
      return NextResponse.json({ error: 'Profile already exists' }, { status: 400 })
    }

    // Validate email matches auth user email
    if (body.email && body.email !== user.email) {
      return NextResponse.json({ error: 'Email must match authenticated user email' }, { status: 400 })
    }

    // Check username uniqueness if provided
    if (body.username) {
      const { data: usernameExists } = await supabase
        .from('end_users')
        .select('id')
        .eq('username', body.username)
        .single()

      if (usernameExists) {
        return NextResponse.json({ error: 'Username already exists' }, { status: 400 })
      }
    }

    const profileData = {
      auth_user_id: user.id,
      email: user.email || body.email,
      username: body.username || null,
      first_name: body.first_name || null,
      last_name: body.last_name || null,
      display_name: body.display_name || null,
      avatar_url: body.avatar_url || null,
      preferences: body.preferences || {},
      last_login_at: new Date().toISOString()
    }

    const { data: endUser, error } = await supabase
      .from('end_users')
      .insert(profileData)
      .select()
      .single()

    if (error) {
      console.error('Error creating user profile:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data: endUser }, { status: 201 })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT /api/mobile/profile - Update current user's profile
export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body: UpdateEndUserRequest = await request.json()

    // Check username uniqueness if provided
    if (body.username) {
      const { data: existingUser } = await supabase
        .from('end_users')
        .select('id')
        .eq('username', body.username)
        .neq('auth_user_id', user.id)
        .single()

      if (existingUser) {
        return NextResponse.json({ error: 'Username already exists' }, { status: 400 })
      }
    }

    const { data: endUser, error } = await supabase
      .from('end_users')
      .update(body)
      .eq('auth_user_id', user.id)
      .select()
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
      }
      console.error('Error updating user profile:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data: endUser })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 