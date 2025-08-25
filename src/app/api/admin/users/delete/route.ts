import { createAdminClient } from '@/utils/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'

// POST /api/admin/users/delete - Delete a user
export async function POST(request: NextRequest) {
  try {
    const { email, auth_secret } = await request.json()

    // Validate auth secret
    if (!auth_secret || auth_secret !== process.env.ADMIN_AUTH_SECRET) {
      return NextResponse.json({ error: 'Invalid authentication secret' }, { status: 401 })
    }

    // Validate required fields
    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    const adminClient = createAdminClient()

    // Find user by email
    const { data: usersList } = await adminClient.auth.admin.listUsers()
    const user = usersList?.users?.find(u => u.email === email)

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Delete user from auth
    const { error: deleteError } = await adminClient.auth.admin.deleteUser(user.id)

    if (deleteError) {
      console.error('Error deleting user:', deleteError)
      return NextResponse.json({ error: deleteError.message || 'Failed to delete user' }, { status: 400 })
    }

    // Also clean up any related end_users records if they exist
    try {
      await adminClient
        .from('end_users')
        .delete()
        .eq('auth_user_id', user.id)
    } catch (endUserError) {
      // This is not critical, log but don't fail the whole operation
      console.log('Note: No end_user record found for deleted admin user, which is expected')
    }

    return NextResponse.json({
      success: true,
      message: 'User deleted successfully',
      deleted_user: {
        id: user.id,
        email: user.email
      }
    })

  } catch (error) {
    console.error('Unexpected error during user deletion:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
