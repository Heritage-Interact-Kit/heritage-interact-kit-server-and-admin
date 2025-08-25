import { createClient } from '@/utils/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// POST /api/tours/[id]/objects - Add object to tour
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const resolvedParams = await params
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { object_id } = await request.json()

    // Add object to tour_objects table
    const { data: tourObject, error } = await supabase
      .from('tour_objects')
      .insert({ tour_id: resolvedParams.id, object_id })
      .select()
      .single()

    if (error) {
        console.error('Error adding object to tour:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Update the tour's object_order array to include the new object at the end
    const { data: tour, error: tourError } = await supabase
      .from('tours')
      .select('object_order')
      .eq('id', resolvedParams.id)
      .single()

    if (!tourError && tour) {
      const currentOrder = tour.object_order || []
      const newOrder = [...currentOrder, object_id]
      
      await supabase
        .from('tours')
        .update({ object_order: newOrder })
        .eq('id', resolvedParams.id)
    }

    return NextResponse.json({ data: tourObject }, { status: 201 })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// GET /api/tours/[id]/objects - List objects in a tour (sorted by object_order)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const resolvedParams = await params

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get tour with object_order
    const { data: tour, error: tourError } = await supabase
      .from('tours')
      .select('object_order')
      .eq('id', resolvedParams.id)
      .single()

    if (tourError) {
      console.error('Error fetching tour:', tourError)
      return NextResponse.json({ error: tourError.message }, { status: 500 })
    }

    // Get all objects in this tour
    const { data: tourObjects, error } = await supabase
      .from('tour_objects')
      .select(`
        *,
        objects (*)
      `)
      .eq('tour_id', resolvedParams.id)

    if (error) {
      console.error('Error fetching tour objects:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Sort objects according to object_order array
    let sortedTourObjects = tourObjects
    if (tour?.object_order && tour.object_order.length > 0) {
      // Create a map for quick lookup
      const objectMap = new Map(tourObjects.map(obj => [obj.object_id, obj]))
      
      // Sort according to object_order, then append any not in the order
      const orderedObjects = tour.object_order
        .map((id: number) => objectMap.get(id))
        .filter(Boolean) // Remove undefined entries
      
      const unorderedObjects = tourObjects.filter(
        obj => !tour.object_order!.includes(obj.object_id)
      )
      
      sortedTourObjects = [...orderedObjects, ...unorderedObjects]
    }

    return NextResponse.json({ data: sortedTourObjects })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PATCH /api/tours/[id]/objects - Update object order in tour
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const resolvedParams = await params
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { object_order } = await request.json()

    if (!Array.isArray(object_order)) {
      return NextResponse.json({ error: 'object_order must be an array' }, { status: 400 })
    }

    // Verify all object IDs exist in this tour
    const { data: tourObjects, error: verifyError } = await supabase
      .from('tour_objects')
      .select('object_id')
      .eq('tour_id', resolvedParams.id)

    if (verifyError) {
      console.error('Error verifying tour objects:', verifyError)
      return NextResponse.json({ error: verifyError.message }, { status: 500 })
    }

    const validObjectIds = tourObjects.map(obj => obj.object_id)
    const invalidIds = object_order.filter(id => !validObjectIds.includes(id))
    
    if (invalidIds.length > 0) {
      return NextResponse.json({ 
        error: `Invalid object IDs: ${invalidIds.join(', ')}` 
      }, { status: 400 })
    }

    // Update the tour's object_order
    const { data: tour, error } = await supabase
      .from('tours')
      .update({ object_order })
      .eq('id', resolvedParams.id)
      .select()
      .single()

    if (error) {
      console.error('Error updating object order:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data: tour })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 