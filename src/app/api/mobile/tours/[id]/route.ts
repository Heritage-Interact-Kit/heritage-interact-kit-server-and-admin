import { createClient } from '@/utils/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { getSiteSettings } from '@/utils/settings'
import { Tour } from '@/types/tours'
import { Object as ObjectType } from '@/types/objects'
import { Asset } from '@/types/assets'
import { Task } from '@/types/tasks'

// Composite type for object with nested assets and tasks
interface ObjectWithAssetsAndTasks extends ObjectType {
  assets: Asset[]
  tasks: Task[]
}

// GET /api/mobile/tours/[id] - Get tour by ID with related objects, assets, and tasks
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

    const { id: tourId } = await params

    // Get tour details
    const { data: tour, error: tourError } = await supabase
      .from('tours')
      .select('*')
      .eq('id', tourId)
      .single()

    if (tourError) {
      if (tourError.code === 'PGRST116') {
        return NextResponse.json({ error: 'Tour not found' }, { status: 404 })
      }
      console.error('Error fetching tour:', tourError)
      return NextResponse.json({ error: tourError.message }, { status: 500 })
    }

    // Get objects associated with this tour through tour_objects join table
    const { data: tourObjects, error: objectsError } = await supabase
      .from('tour_objects')
      .select(`
        object:objects(
          id,
          title,
          description,
          thumbnail_url,
          lat,
          lng,
          created_at,
          assets(
            id,
            title,
            description,
            model_url,
            material_urls,
            thumbnail_image_url,
            marker_image_url,
            audio_url,
            video_url,
            interaction_method,
            folder_id,
            created_at
          ),
          tasks(
            id,
            title,
            description,
            thumbnail_url,
            detailed_img_url,
            created_at
          )
        )
      `)
      .eq('tour_id', tourId)

    if (objectsError) {
      console.error('Error fetching tour objects:', objectsError)
      return NextResponse.json({ error: objectsError.message }, { status: 500 })
    }

    // Extract objects from the join table result
    let objects = (tourObjects?.map(to => to.object).filter(Boolean) || []) as unknown as ObjectWithAssetsAndTasks[]

    // Sort objects according to tour's object_order array
    if (tour.object_order && tour.object_order.length > 0 && objects.length > 0) {
      // Create a map for quick lookup
      const objectMap = new Map<number, ObjectWithAssetsAndTasks>()
      objects.forEach((obj: ObjectWithAssetsAndTasks) => {
        if (obj?.id) {
          objectMap.set(obj.id, obj)
        }
      })
      
      // Sort according to object_order, then append any not in the order
      const orderedObjects = tour.object_order
        .map((id: number) => objectMap.get(id))
        .filter((obj: ObjectWithAssetsAndTasks | undefined): obj is ObjectWithAssetsAndTasks => obj !== undefined) // Remove undefined entries
      
      const unorderedObjects = objects.filter(
        (obj: ObjectWithAssetsAndTasks) => obj?.id && !tour.object_order!.includes(obj.id)
      )
      
      objects = [...orderedObjects, ...unorderedObjects]
    }

    // Return tour with nested objects, assets, and tasks
    const tourWithObjects = {
      ...tour,
      objects: objects
    }

    // Get site settings
    const settings = await getSiteSettings()

    return NextResponse.json({ 
      data: tourWithObjects,
      settings
    })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 