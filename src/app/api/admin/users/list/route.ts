import { createAdminClient } from '@/utils/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'

// POST /api/admin/users/list - List all admin users
export async function POST(request: NextRequest) {
  try {
    const { auth_secret } = await request.json()

    // Validate auth secret
    if (!auth_secret || auth_secret !== process.env.ADMIN_AUTH_SECRET) {
      return NextResponse.json({ error: 'Invalid authentication secret' }, { status: 401 })
    }

    const adminClient = createAdminClient()

    // Get all users from auth
    const { data: usersList, error: usersError } = await adminClient.auth.admin.listUsers()

    if (usersError) {
      console.error('Error fetching users:', usersError)
      return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 })
    }

    // Format user data for display
    const users = usersList.users.map(user => ({
      id: user.id,
      email: user.email,
      created_at: user.created_at,
      updated_at: user.updated_at,
      email_confirmed_at: user.email_confirmed_at,
      user_metadata: user.user_metadata
    }))

    return NextResponse.json({
      success: true,
      users,
      total: users.length
    })

  } catch (error) {
    console.error('Unexpected error during user listing:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
