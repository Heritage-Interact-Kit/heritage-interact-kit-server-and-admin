import { createClient } from '@/utils/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { getSiteSettings } from '@/utils/settings'

// Interface for reward data from Supabase queries
interface RewardFromQuery {
  id: number
  title: string
  description: string | null
  thumbnail_url: string | null
  reward_type: string
  reward_value: Record<string, string | number | boolean | null>
  is_active: boolean
}

// GET /api/mobile/objects/[id] - Get object by ID with assets and rewards
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id: objectId } = await params

    // Get object with its assets and rewards
    const { data: object, error } = await supabase
      .from('objects')
      .select(`
        *,
        assets(
          id,
          title,
          description,
          model_url,
          material_urls,
          thumbnail_image_url,
          marker_image_url,
          audio_url,
          video_url,
          interaction_method,
          folder_id,
          created_at
        ),
        rewards(
          id,
          title,
          description,
          thumbnail_url,
          reward_type,
          reward_value,
          is_active
        )
      `)
      .eq('id', objectId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Object not found' }, { status: 404 })
      }
      console.error('Error fetching object:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Get user's existing rewards for this object
    const rewardIds = object.rewards?.map((r: RewardFromQuery) => r.id) || []
    const { data: userRewards, error: rewardsError } = await supabase
      .from('user_rewards')
      .select(`
        reward_id,
        status,
        claimed_at
      `)
      .eq('end_user_id', endUser.id)
      .in('reward_id', rewardIds)

    if (rewardsError) {
      console.error('Error fetching user rewards:', rewardsError)
    }

    // Enhance object with user reward status
    const enhancedObject = {
      ...object,
      rewards: object.rewards?.map((reward: RewardFromQuery) => {
        const userReward = userRewards?.find(ur => ur.reward_id === reward.id)
        return {
          ...reward,
          user_status: userReward ? {
            status: userReward.status,
            claimed_at: userReward.claimed_at
          } : null
        }
      })
    }

    // Get site settings
    const settings = await getSiteSettings()

    return NextResponse.json({ 
      data: enhancedObject,
      settings
    })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 