import { createClient } from '@/utils/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// GET /api/dashboard/stats - Get dashboard statistics
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get counts for tours, objects, and assets in parallel
    const [toursResult, objectsResult, assetsResult] = await Promise.all([
      supabase.from('tours').select('id', { count: 'exact', head: true }),
      supabase.from('objects').select('id', { count: 'exact', head: true }),
      supabase.from('assets').select('id', { count: 'exact', head: true })
    ])

    if (toursResult.error) {
      console.error('Error fetching tours count:', toursResult.error)
      return NextResponse.json({ error: toursResult.error.message }, { status: 500 })
    }

    if (objectsResult.error) {
      console.error('Error fetching objects count:', objectsResult.error)
      return NextResponse.json({ error: objectsResult.error.message }, { status: 500 })
    }

    if (assetsResult.error) {
      console.error('Error fetching assets count:', assetsResult.error)
      return NextResponse.json({ error: assetsResult.error.message }, { status: 500 })
    }

    const stats = {
      tours_count: toursResult.count || 0,
      objects_count: objectsResult.count || 0,
      assets_count: assetsResult.count || 0
    }

    return NextResponse.json({ data: stats })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 