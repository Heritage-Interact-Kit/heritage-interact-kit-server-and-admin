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
    const objectId = searchParams.get('object_id')
    const showAll = searchParams.get('show_all') === 'true'

    // Get site settings
    const settings = await getSiteSettings()

    if (showAll) {
      // Get all available tasks with object details and rewards
      let query = supabase
        .from('tasks')
        .select(`
          *,
          object:objects(
            id,
            title,
            description,
            thumbnail_url
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
        .order('created_at', { ascending: false })

      if (objectId) {
        query = query.eq('object_id', objectId)
      }

      const { data: tasks, error } = await query

      if (error) {
        console.error('Error fetching tasks:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      // Get user's existing rewards for these tasks
      const taskIds = tasks?.map(task => task.id) || []
      const { data: userRewards, error: rewardsError } = await supabase
        .from('user_rewards')
        .select(`
          reward_id,
          status,
          claimed_at
        `)
        .eq('end_user_id', endUser.id)
        .in('reward_id', tasks?.flatMap(task => task.rewards?.map((r: RewardFromQuery) => r.id) || []) || [])

      if (rewardsError) {
        console.error('Error fetching user rewards:', rewardsError)
      }

      // Enhance tasks with user reward status
      const enhancedTasks = tasks?.map(task => ({
        ...task,
        rewards: task.rewards?.map((reward: RewardFromQuery) => {
          const userReward = userRewards?.find(ur => ur.reward_id === reward.id)
          return {
            ...reward,
            user_status: userReward ? {
              status: userReward.status,
              claimed_at: userReward.claimed_at
            } : null
          }
        })
      }))

      return NextResponse.json({ 
        data: enhancedTasks || [],
        settings
      })
    } else {
      // Get tasks that the user has submitted to (their task history)
      const { data: userTasks, error } = await supabase
        .from('tasks')
        .select(`
          *,
          object:objects(
            id,
            title,
            description,
            thumbnail_url
          ),
          rewards(
            id,
            title,
            description,
            thumbnail_url,
            reward_type,
            reward_value,
            is_active
          ),
          submissions!inner(
            id,
            created_at,
            remarks,
            submitted_files
          )
        `)
        .eq('submissions.end_user_id', endUser.id)
        .order('submissions.created_at', { ascending: false })

      if (error) {
        console.error('Error fetching user tasks:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      // Get user's existing rewards for these tasks
      const { data: userRewards, error: rewardsError } = await supabase
        .from('user_rewards')
        .select(`
          reward_id,
          status,
          claimed_at
        `)
        .eq('end_user_id', endUser.id)
        .in('reward_id', userTasks?.flatMap(task => task.rewards?.map((r: RewardFromQuery) => r.id) || []) || [])

      if (rewardsError) {
        console.error('Error fetching user rewards:', rewardsError)
      }

      // Enhance tasks with user reward status
      const enhancedUserTasks = userTasks?.map(task => ({
        ...task,
        rewards: task.rewards?.map((reward: RewardFromQuery) => {
          const userReward = userRewards?.find(ur => ur.reward_id === reward.id)
          return {
            ...reward,
            user_status: userReward ? {
              status: userReward.status,
              claimed_at: userReward.claimed_at
            } : null
          }
        })
      }))

      return NextResponse.json({ 
        data: enhancedUserTasks || [],
        settings
      })
    }
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 