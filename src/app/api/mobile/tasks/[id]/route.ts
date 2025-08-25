import { createClient } from '@/utils/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { getSiteSettings } from '@/utils/settings'

// GET /api/mobile/tasks/[id] - Get task by ID with details
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

    const { id: taskId } = await params

    // Get task with object details
    const { data: task, error } = await supabase
      .from('tasks')
      .select(`
        *,
        object:objects(
          id,
          title,
          description,
          thumbnail_url,
          lat,
          lng,
          created_at
        )
      `)
      .eq('id', taskId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Task not found' }, { status: 404 })
      }
      console.error('Error fetching task:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Check if user already has a submission for this task
    const { data: existingSubmissions, error: submissionError } = await supabase
      .from('submissions')
      .select('id')
      .eq('task_id', taskId)
      .eq('end_user_id', endUser.id)
      .limit(1)

    if (submissionError) {
      console.error('Error checking existing submission:', submissionError)
      return NextResponse.json({ error: submissionError.message }, { status: 500 })
    }

    // Get site settings
    const settings = await getSiteSettings()

    return NextResponse.json({ 
      data: {
        ...task,
        hasSubmission: existingSubmissions && existingSubmissions.length > 0
      },
      settings
    })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 