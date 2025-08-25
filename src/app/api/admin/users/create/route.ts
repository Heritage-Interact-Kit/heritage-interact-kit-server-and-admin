import { createAdminClient } from '@/utils/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'

// POST /api/admin/users/create - Create a new admin user
export async function POST(request: NextRequest) {
  try {
    const { email, password, auth_secret } = await request.json()

    // Validate auth secret
    if (!auth_secret || auth_secret !== process.env.ADMIN_AUTH_SECRET) {
      return NextResponse.json({ error: 'Invalid authentication secret' }, { status: 401 })
    }

    // Validate required fields
    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 })
    }

    // Validate password strength
    if (password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters long' }, { status: 400 })
    }

    const adminClient = createAdminClient()

    // Check if user already exists
    const { data: existingUsers } = await adminClient.auth.admin.listUsers()
    const existingUser = existingUsers?.users?.find(user => user.email === email)

    if (existingUser) {
      return NextResponse.json({ error: 'User with this email already exists' }, { status: 400 })
    }

    // Create new admin user
    const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Skip email confirmation for admin users
      user_metadata: {
        is_active: true,
        created_by_admin: true
      }
    })

    if (authError || !authData.user) {
      console.error('Error creating admin user:', authError)
      return NextResponse.json({ error: authError?.message || 'Failed to create user' }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      user: {
        id: authData.user.id,
        email: authData.user.email,
        created_at: authData.user.created_at
      }
    })

  } catch (error) {
    console.error('Unexpected error during user creation:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
