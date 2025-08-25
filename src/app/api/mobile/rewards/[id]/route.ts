import { createClient } from '@/utils/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// GET /api/mobile/rewards/[id] - Get a specific reward by ID with user claim status
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { id } = await params
    const rewardId = id

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

    // Fetch the reward with its relations
    const { data: reward, error } = await supabase
      .from('rewards')
      .select(`
        *,
        task:tasks(id, title, description),
        object:objects(id, title, description)
      `)
      .eq('id', rewardId)
      .single()

    if (error || !reward) {
      if (error?.code === 'PGRST116' || !reward) {
        return NextResponse.json({ error: 'Reward not found' }, { status: 404 })
      }
      console.error('Error fetching reward:', error)
      return NextResponse.json({ error: error?.message || 'Unknown error' }, { status: 500 })
    }

    // Check if the current user has claimed this reward
    const { data: userReward, error: userRewardError } = await supabase
      .from('user_rewards')
      .select('*')
      .eq('reward_id', reward.id)
      .eq('end_user_id', endUser.id)
      .single()

    if (userRewardError && userRewardError.code !== 'PGRST116') { // Ignore 'not found' error
      console.error('Error fetching user reward status:', userRewardError)
      // Non-critical error, can proceed without user status
    }

    // Add user claim status to the reward object
    const rewardWithUserStatus = {
      ...reward,
      user_claim_status: userReward || null
    }

    return NextResponse.json({ data: rewardWithUserStatus })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 