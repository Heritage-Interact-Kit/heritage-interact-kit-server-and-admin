import { createClient } from '@/utils/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { CreateObjectRequest } from '@/types/objects'

// GET /api/objects - List all objects
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get search parameter from URL
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')

    let query = supabase
      .from('objects')
      .select('*')

    // Add search filtering if search parameter is provided
    if (search && search.trim()) {
      const searchTerm = `%${search.trim()}%`
      query = query.or(`title.ilike.${searchTerm},description.ilike.${searchTerm}`)
    }

    const { data: objects, error } = await query.order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching objects:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data: objects })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/objects - Create new object
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body: CreateObjectRequest = await request.json()
    const { title, description, thumbnail_url, lat, lng } = body

    // Validate required fields
    if (!title || title.trim() === '') {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 })
    }

    // Validate latitude range
    if (lat !== undefined && lat !== null && (lat < -90 || lat > 90)) {
      return NextResponse.json({ error: 'Latitude must be between -90 and 90 degrees' }, { status: 400 })
    }

    // Validate longitude range
    if (lng !== undefined && lng !== null && (lng < -180 || lng > 180)) {
      return NextResponse.json({ error: 'Longitude must be between -180 and 180 degrees' }, { status: 400 })
    }

    const { data: object, error } = await supabase
      .from('objects')
      .insert({
        title: title.trim(),
        description: description?.trim() || null,
        thumbnail_url: thumbnail_url || null,
        lat: lat || null,
        lng: lng || null,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating object:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data: object }, { status: 201 })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 