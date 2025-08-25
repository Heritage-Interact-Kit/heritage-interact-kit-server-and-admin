import { createAdminClient } from '@/utils/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'

// POST /api/admin/users/update-password - Update user password
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

    // Find user by email
    const { data: usersList } = await adminClient.auth.admin.listUsers()
    const user = usersList?.users?.find(u => u.email === email)

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Update user password
    const { data: updatedUser, error: updateError } = await adminClient.auth.admin.updateUserById(
      user.id,
      { password }
    )

    if (updateError) {
      console.error('Error updating user password:', updateError)
      return NextResponse.json({ error: updateError.message || 'Failed to update password' }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      user: {
        id: updatedUser.user.id,
        email: updatedUser.user.email,
        updated_at: updatedUser.user.updated_at
      }
    })

  } catch (error) {
    console.error('Unexpected error during password update:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
