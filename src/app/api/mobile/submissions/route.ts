import { createClient } from '@/utils/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { CreateSubmissionRequest } from '@/types/submissions'
import { getSiteSettings } from '@/utils/settings'

// GET /api/mobile/submissions - Get current user's submissions
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
    const taskId = searchParams.get('task_id')
    const objectId = searchParams.get('object_id')

    // Build query for user's submissions with direct object relationship
    let query = supabase
      .from('submissions')
      .select(`
        *,
        task:tasks(id, title, description),
        object:objects(id, title),
        user_rewards(
          id,
          status,
          claimed_at,
          reward:rewards(
            id,
            title,
            description,
            thumbnail_url,
            reward_type,
            reward_value
          )
        )
      `)
      .eq('end_user_id', endUser.id)
      .order('created_at', { ascending: false })

    // Filter by task if provided
    if (taskId) {
      query = query.eq('task_id', taskId)
    }

    // Filter by object if provided
    if (objectId) {
      query = query.eq('object_id', objectId)
    }

    const { data: submissions, error } = await query

    if (error) {
      console.error('Error fetching user submissions:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Get site settings
    const settings = await getSiteSettings()

    return NextResponse.json({ 
      data: submissions || [],
      settings
    })

  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/mobile/submissions - Create new submission and auto-assign rewards
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

    const body: CreateSubmissionRequest = await request.json()

    // Validate required fields
    if (!body.task_id) {
      return NextResponse.json({ error: 'Task ID is required' }, { status: 400 })
    }

    // Verify that the task exists and get its object_id with rewards
    const { data: task, error: taskError } = await supabase
      .from('tasks')
      .select(`
        id, 
        object_id,
        rewards(
          id,
          title,
          description,
          reward_type,
          reward_value,
          is_active
        )
      `)
      .eq('id', body.task_id)
      .single()

    if (taskError || !task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }

    // Create the submission with object_id automatically set
    const submissionData = {
      task_id: body.task_id,
      object_id: task.object_id, // Automatically set from task's object_id
      end_user_id: endUser.id,
      remarks: body.remarks?.trim() || null,
      submitted_files: body.submitted_files || []
    }

    const { data: submission, error } = await supabase
      .from('submissions')
      .insert(submissionData)
      .select(`
        *,
        task:tasks(id, title, description),
        object:objects(id, title)
      `)
      .single()

    if (error) {
      console.error('Error creating submission:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Auto-assign rewards linked to this task
    const assignedRewards = []
    if (task.rewards && task.rewards.length > 0) {
      for (const reward of task.rewards) {
        // Only assign active rewards
        if (!reward.is_active) continue

        try {
          // Check if user already has this reward
          const { data: existingUserReward } = await supabase
            .from('user_rewards')
            .select('id')
            .eq('reward_id', reward.id)
            .eq('end_user_id', endUser.id)
            .single()

          // If user doesn't have the reward, assign it
          if (!existingUserReward) {
            const { data: userReward, error: rewardError } = await supabase
              .from('user_rewards')
              .insert({
                reward_id: reward.id,
                end_user_id: endUser.id,
                obtained_via: 'task_completion',
                submission_id: submission.id,
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

            if (!rewardError && userReward) {
              assignedRewards.push(userReward)
            } else {
              console.error('Error assigning reward:', rewardError)
            }
          }
        } catch (rewardAssignError) {
          console.error('Error in reward assignment process:', rewardAssignError)
          // Continue processing other rewards even if one fails
        }
      }
    }

    // Get site settings
    const settings = await getSiteSettings()

    return NextResponse.json({ 
      data: submission,
      assigned_rewards: assignedRewards,
      message: assignedRewards.length > 0 
        ? `Task completed! You earned ${assignedRewards.length} reward(s).`
        : 'Task completed successfully!',
      settings
    }, { status: 201 })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 