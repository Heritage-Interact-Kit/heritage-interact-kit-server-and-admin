import { createClient } from '@/utils/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { UpdateRewardRequest } from '@/types/rewards'

// Interface for reward update data
interface RewardUpdateData {
  title?: string
  description?: string | null
  thumbnail_url?: string | null
  reward_type?: 'badge' | 'points' | 'item' | 'digital_content'
  reward_value?: Record<string, string | number | boolean | null>
  task_id?: number | null
  object_id?: number | null
  is_active?: boolean
}

// GET /api/rewards/[id] - Get reward by ID
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

    const { id: rewardId } = await params

    const { data: reward, error } = await supabase
      .from('rewards')
      .select(`
        *,
        task:tasks(id, title, description),
        object:objects(id, title, description),
        user_rewards_count:user_rewards(count)
      `)
      .eq('id', rewardId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Reward not found' }, { status: 404 })
      }
      console.error('Error fetching reward:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Process the reward to extract the count from user_rewards_count
    const processedReward = {
      ...reward,
      user_rewards_count: Array.isArray(reward.user_rewards_count) && reward.user_rewards_count.length > 0 
        ? reward.user_rewards_count[0].count 
        : 0
    }

    return NextResponse.json({ data: processedReward })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT /api/rewards/[id] - Update reward
export async function PUT(
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

    const { id: rewardId } = await params
    const body: UpdateRewardRequest = await request.json()

    // Check if reward exists
    const { data: existingReward, error: fetchError } = await supabase
      .from('rewards')
      .select('*')
      .eq('id', rewardId)
      .single()

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return NextResponse.json({ error: 'Reward not found' }, { status: 404 })
      }
      console.error('Error fetching reward:', fetchError)
      return NextResponse.json({ error: fetchError.message }, { status: 500 })
    }

    // Validate linking constraints if task_id or object_id are being updated
    if ('task_id' in body || 'object_id' in body) {
      const newTaskId = 'task_id' in body ? body.task_id : existingReward.task_id
      const newObjectId = 'object_id' in body ? body.object_id : existingReward.object_id

      // Ensure reward is linked to either task or object, but not both
      if (newTaskId && newObjectId) {
        return NextResponse.json({ error: 'Reward cannot be linked to both task and object' }, { status: 400 })
      }

      if (!newTaskId && !newObjectId) {
        return NextResponse.json({ error: 'Reward must be linked to either a task or an object' }, { status: 400 })
      }

      // Verify that the linked task or object exists
      if (newTaskId && newTaskId !== existingReward.task_id) {
        const { data: task, error: taskError } = await supabase
          .from('tasks')
          .select('id')
          .eq('id', newTaskId)
          .single()

        if (taskError || !task) {
          return NextResponse.json({ error: 'Task not found' }, { status: 404 })
        }
      }

      if (newObjectId && newObjectId !== existingReward.object_id) {
        const { data: object, error: objectError } = await supabase
          .from('objects')
          .select('id')
          .eq('id', newObjectId)
          .single()

        if (objectError || !object) {
          return NextResponse.json({ error: 'Object not found' }, { status: 404 })
        }
      }
    }

    // Prepare update data
    const updateData: RewardUpdateData = {}
    if ('title' in body && body.title !== undefined) {
      if (!body.title || body.title.trim() === '') {
        return NextResponse.json({ error: 'Title is required' }, { status: 400 })
      }
      updateData.title = body.title.trim()
    }
    if ('description' in body) updateData.description = body.description?.trim() || null
    if ('thumbnail_url' in body) updateData.thumbnail_url = body.thumbnail_url || null
    if ('reward_type' in body) updateData.reward_type = body.reward_type
    if ('reward_value' in body) updateData.reward_value = body.reward_value || {}
    if ('task_id' in body) updateData.task_id = body.task_id || null
    if ('object_id' in body) updateData.object_id = body.object_id || null
    if ('is_active' in body) updateData.is_active = body.is_active

    const { data: updatedReward, error } = await supabase
      .from('rewards')
      .update(updateData)
      .eq('id', rewardId)
      .select(`
        *,
        task:tasks(id, title, description),
        object:objects(id, title, description)
      `)
      .single()

    if (error) {
      console.error('Error updating reward:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data: updatedReward })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/rewards/[id] - Delete reward
export async function DELETE(
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

    const { id: rewardId } = await params

    // Check if reward exists and get user_rewards count
    const { data: reward, error: fetchError } = await supabase
      .from('rewards')
      .select(`
        *,
        user_rewards(count)
      `)
      .eq('id', rewardId)
      .single()

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return NextResponse.json({ error: 'Reward not found' }, { status: 404 })
      }
      console.error('Error fetching reward:', fetchError)
      return NextResponse.json({ error: fetchError.message }, { status: 500 })
    }

    // Check if reward has been claimed by users
    if (reward.user_rewards && reward.user_rewards.length > 0) {
      return NextResponse.json({ 
        error: 'Cannot delete reward that has been claimed by users. Consider deactivating it instead.' 
      }, { status: 400 })
    }

    const { error } = await supabase
      .from('rewards')
      .delete()
      .eq('id', rewardId)

    if (error) {
      console.error('Error deleting reward:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ message: 'Reward deleted successfully' })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 