import { createClient } from '@/utils/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { getSiteSettings } from '@/utils/settings'

// GET /api/mobile/tours - List all available tours for mobile app
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get all tours
    const { data: tours, error } = await supabase
      .from('tours')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching tours:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Get site settings
    const settings = await getSiteSettings()

    return NextResponse.json({ 
      data: tours || [],
      settings
    })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 