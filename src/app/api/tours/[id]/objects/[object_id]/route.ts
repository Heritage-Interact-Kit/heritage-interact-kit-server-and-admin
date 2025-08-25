import { createClient } from '@/utils/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// DELETE /api/tours/[id]/objects/[object_id] - Remove object from tour
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; object_id: string }> }
) {
  try {
    const supabase = await createClient()
    const resolvedParams = await params
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Remove object from tour_objects table
    const { error } = await supabase
      .from('tour_objects')
      .delete()
      .eq('tour_id', resolvedParams.id)
      .eq('object_id', resolvedParams.object_id)

    if (error) {
      console.error('Error removing object from tour:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Update the tour's object_order array to remove the deleted object
    const { data: tour, error: tourError } = await supabase
      .from('tours')
      .select('object_order')
      .eq('id', resolvedParams.id)
      .single()

    if (!tourError && tour?.object_order) {
      const objectIdToRemove = parseInt(resolvedParams.object_id)
      const newOrder = tour.object_order.filter((id: number) => id !== objectIdToRemove)
      
      await supabase
        .from('tours')
        .update({ object_order: newOrder })
        .eq('id', resolvedParams.id)
    }

    return NextResponse.json({ message: 'Object removed from tour successfully' })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 