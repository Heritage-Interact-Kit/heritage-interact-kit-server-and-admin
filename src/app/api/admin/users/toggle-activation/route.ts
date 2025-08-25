import { createAdminClient } from '@/utils/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'

// POST /api/admin/users/toggle-activation - Toggle user activation status
export async function POST(request: NextRequest) {
  try {
    const { email, auth_secret, is_active } = await request.json()

    // Validate auth secret
    if (!auth_secret || auth_secret !== process.env.ADMIN_AUTH_SECRET) {
      return NextResponse.json({ error: 'Invalid authentication secret' }, { status: 401 })
    }

    // Validate required fields
    if (!email || typeof is_active !== 'boolean') {
      return NextResponse.json({ error: 'Email and is_active (boolean) are required' }, { status: 400 })
    }

    const adminClient = createAdminClient()

    // Find user by email
    const { data: usersList } = await adminClient.auth.admin.listUsers()
    const user = usersList?.users?.find(u => u.email === email)

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Toggle user activation status using user_metadata
    // We'll store the activation status in user metadata and handle access control in middleware
    console.log('Updating user:', user.email, 'to is_active:', is_active)
    console.log('Current user_metadata:', user.user_metadata)
    
    const newMetadata = {
      ...user.user_metadata,
      is_active: is_active,
      deactivated_at: is_active ? null : new Date().toISOString()
    }
    
    console.log('New metadata:', newMetadata)
    
    const { data: updatedUser, error: updateError } = await adminClient.auth.admin.updateUserById(
      user.id,
      { 
        user_metadata: newMetadata
      }
    )

    if (updateError) {
      console.error('Error toggling user activation:', updateError)
      return NextResponse.json({ error: updateError.message || 'Failed to toggle user activation' }, { status: 400 })
    }
    
    console.log('Updated user successfully:', updatedUser.user.user_metadata)

    return NextResponse.json({
      success: true,
      message: `User ${is_active ? 'activated' : 'deactivated'} successfully`,
      user: {
        id: updatedUser.user.id,
        email: updatedUser.user.email,
        is_active: is_active,
        user_metadata: updatedUser.user.user_metadata,
        updated_at: updatedUser.user.updated_at
      }
    })

  } catch (error) {
    console.error('Unexpected error during user activation toggle:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
