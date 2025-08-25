import { createClient } from '@/utils/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { CreateRewardRequest } from '@/types/rewards'

// GET /api/rewards - Get all rewards with optional filtering
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const taskId = searchParams.get('task_id')
    const objectId = searchParams.get('object_id')
    const rewardType = searchParams.get('reward_type')
    const isActive = searchParams.get('is_active')

    // Build query with relations
    let query = supabase
      .from('rewards')
      .select(`
        *,
        task:tasks(id, title, description),
        object:objects(id, title, description),
        user_rewards_count:user_rewards(count)
      `)
      .order('created_at', { ascending: false })

    // Apply filters
    if (taskId) {
      query = query.eq('task_id', taskId)
    }
    if (objectId) {
      query = query.eq('object_id', objectId)
    }
    if (rewardType) {
      query = query.eq('reward_type', rewardType)
    }
    if (isActive !== null) {
      query = query.eq('is_active', isActive === 'true')
    }

    const { data: rewards, error } = await query

    if (error) {
      console.error('Error fetching rewards:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Process the rewards to extract the count from user_rewards_count
    const processedRewards = rewards?.map(reward => ({
      ...reward,
      user_rewards_count: Array.isArray(reward.user_rewards_count) && reward.user_rewards_count.length > 0 
        ? reward.user_rewards_count[0].count 
        : 0
    })) || []

    return NextResponse.json({ data: processedRewards })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/rewards - Create new reward
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body: CreateRewardRequest = await request.json()
    const { 
      title, 
      description, 
      thumbnail_url, 
      reward_type, 
      reward_value, 
      task_id, 
      object_id, 
      is_active = true 
    } = body

    // Validate required fields
    if (!title || title.trim() === '') {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 })
    }

    if (!reward_type) {
      return NextResponse.json({ error: 'Reward type is required' }, { status: 400 })
    }

    // Ensure reward is linked to either task or object, but not both
    if (task_id && object_id) {
      return NextResponse.json({ error: 'Reward cannot be linked to both task and object' }, { status: 400 })
    }

    if (!task_id && !object_id) {
      return NextResponse.json({ error: 'Reward must be linked to either a task or an object' }, { status: 400 })
    }

    // Verify that the linked task or object exists
    if (task_id) {
      const { data: task, error: taskError } = await supabase
        .from('tasks')
        .select('id')
        .eq('id', task_id)
        .single()

      if (taskError || !task) {
        return NextResponse.json({ error: 'Task not found' }, { status: 404 })
      }
    }

    if (object_id) {
      const { data: object, error: objectError } = await supabase
        .from('objects')
        .select('id')
        .eq('id', object_id)
        .single()

      if (objectError || !object) {
        return NextResponse.json({ error: 'Object not found' }, { status: 404 })
      }
    }

    const { data: reward, error } = await supabase
      .from('rewards')
      .insert({
        title: title.trim(),
        description: description?.trim() || null,
        thumbnail_url: thumbnail_url || null,
        reward_type,
        reward_value: reward_value || {},
        task_id: task_id || null,
        object_id: object_id || null,
        is_active
      })
      .select(`
        *,
        task:tasks(id, title, description),
        object:objects(id, title, description)
      `)
      .single()

    if (error) {
      console.error('Error creating reward:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data: reward }, { status: 201 })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 