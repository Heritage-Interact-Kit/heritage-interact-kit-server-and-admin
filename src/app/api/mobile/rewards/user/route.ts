import { createClient } from '@/utils/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { getSiteSettings } from '@/utils/settings'

// GET /api/mobile/rewards/user - Get current user's claimed rewards
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

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') // claimed, redeemed, expired
    const rewardType = searchParams.get('reward_type') // badge, points, item, digital_content
    const obtainedVia = searchParams.get('obtained_via') // task_completion, direct_claim

    // Build query for user's rewards
    let query = supabase
      .from('user_rewards')
      .select(`
        *,
        reward:rewards(
          id,
          title,
          description,
          thumbnail_url,
          reward_type,
          reward_value,
          task_id,
          object_id,
          task:tasks(id, title, description),
          object:objects(id, title, description)
        ),
        submission:submissions(
          id,
          created_at,
          remarks
        )
      `)
      .eq('end_user_id', endUser.id)
      .order('claimed_at', { ascending: false })

    // Apply filters
    if (status) {
      query = query.eq('status', status)
    }
    if (obtainedVia) {
      query = query.eq('obtained_via', obtainedVia)
    }
    if (rewardType) {
      query = query.eq('reward.reward_type', rewardType)
    }

    const { data: userRewards, error } = await query

    if (error) {
      console.error('Error fetching user rewards:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Get site settings
    const settings = await getSiteSettings()

    // Calculate reward statistics
    const stats = {
      total: userRewards?.length || 0,
      by_type: {
        badge: userRewards?.filter(ur => ur.reward?.reward_type === 'badge').length || 0,
        points: userRewards?.filter(ur => ur.reward?.reward_type === 'points').length || 0,
        item: userRewards?.filter(ur => ur.reward?.reward_type === 'item').length || 0,
        digital_content: userRewards?.filter(ur => ur.reward?.reward_type === 'digital_content').length || 0
      },
      by_status: {
        claimed: userRewards?.filter(ur => ur.status === 'claimed').length || 0,
        redeemed: userRewards?.filter(ur => ur.status === 'redeemed').length || 0,
        expired: userRewards?.filter(ur => ur.status === 'expired').length || 0
      },
      by_obtained_via: {
        task_completion: userRewards?.filter(ur => ur.obtained_via === 'task_completion').length || 0,
        direct_claim: userRewards?.filter(ur => ur.obtained_via === 'direct_claim').length || 0
      }
    }

    return NextResponse.json({ 
      data: userRewards || [],
      stats,
      settings
    })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 