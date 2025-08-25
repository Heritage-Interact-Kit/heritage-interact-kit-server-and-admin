import { createClient } from '@/utils/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { ClaimRewardRequest } from '@/types/rewards'

// POST /api/mobile/rewards/claim - Claim object-based reward directly
export async function POST(request: NextRequest) {
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

    const body: ClaimRewardRequest = await request.json()
    const { reward_id } = body

    if (!reward_id) {
      return NextResponse.json({ error: 'Reward ID is required' }, { status: 400 })
    }

    // Verify that the reward exists and is object-based (not task-based)
    const { data: reward, error: rewardError } = await supabase
      .from('rewards')
      .select('*')
      .eq('id', reward_id)
      .eq('is_active', true)
      .single()

    if (rewardError || !reward) {
      return NextResponse.json({ error: 'Reward not found or inactive' }, { status: 404 })
    }

    // Ensure this is an object-based reward (not task-based)
    if (reward.task_id) {
      return NextResponse.json({ 
        error: 'This reward is linked to a task and can only be claimed by completing the task' 
      }, { status: 400 })
    }

    if (!reward.object_id) {
      return NextResponse.json({ error: 'This reward is not properly linked to an object' }, { status: 400 })
    }

    // Check if user has already claimed this reward
    const { data: existingUserReward, error: existingError } = await supabase
      .from('user_rewards')
      .select('id')
      .eq('reward_id', reward_id)
      .eq('end_user_id', endUser.id)
      .single()

    if (existingUserReward) {
      return NextResponse.json({ error: 'You have already claimed this reward' }, { status: 400 })
    }

    if (existingError && existingError.code !== 'PGRST116') {
      console.error('Error checking existing reward:', existingError)
      return NextResponse.json({ error: 'Error checking reward status' }, { status: 500 })
    }

    // Create user reward record
    const { data: userReward, error } = await supabase
      .from('user_rewards')
      .insert({
        reward_id: reward_id,
        end_user_id: endUser.id,
        obtained_via: 'direct_claim',
        status: 'claimed'
      })
      .select(`
        *,
        reward:rewards(
          id,
          title,
          description,
          thumbnail_url,
          reward_type,
          reward_value
        )
      `)
      .single()

    if (error) {
      console.error('Error claiming reward:', error)
      
      // Handle unique constraint violation
      if (error.code === '23505') {
        return NextResponse.json({ error: 'You have already claimed this reward' }, { status: 400 })
      }
      
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ 
      data: userReward,
      message: 'Reward claimed successfully!' 
    }, { status: 201 })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 