import { createClient } from '@/utils/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

interface AssetUpdateData {
  title: string
  description: string
  interaction_method: string
  marker_image_url?: string
  thumbnail_image_url?: string
  audio_url?: string
  video_url?: string
  model_url?: string
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { id } = await params

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const title = formData.get('title') as string
    const description = formData.get('description') as string
    const interaction_method = formData.get('interaction_method') as string
    const marker_image = formData.get('marker_image') as File | null
    const thumbnail_image = formData.get('thumbnail_image') as File | null
    const audio_file = formData.get('audio_file') as File | null
    const video_url = formData.get('video_url') as string | null
    
    // Get clear flags
    const clear_thumbnail = formData.get('clear_thumbnail') === 'true'
    const clear_audio = formData.get('clear_audio') === 'true'
    const clear_video = formData.get('clear_video') === 'true'
    const clear_model = formData.get('clear_model') === 'true'

    // Get current asset to access folder_id
    const { data: currentAsset, error: fetchError } = await supabase
      .from('assets')
      .select('folder_id, marker_image_url, thumbnail_image_url, audio_url, video_url')
      .eq('id', parseInt(id))
      .single()

    if (fetchError || !currentAsset) {
      return NextResponse.json({ error: 'Asset not found' }, { status: 404 })
    }

    const updateData: AssetUpdateData = {
      title,
      description,
      interaction_method,
    }
    
    // Handle clearing fields
    if (clear_thumbnail) {
      updateData.thumbnail_image_url = ''
    }
    if (clear_audio) {
      updateData.audio_url = ''
    }
    if (clear_video) {
      updateData.video_url = ''
    }
    if (clear_model) {
      updateData.model_url = ''
    }

    // Upload new marker image if provided
    if (marker_image) {
      const markerFileName = `${currentAsset.folder_id}/marker_${marker_image.name}`
      const markerBuffer = Buffer.from(await marker_image.arrayBuffer())
      
      const { data, error: markerUploadError } = await supabase.storage
        .from('assets')
        .upload(markerFileName, markerBuffer, {
          contentType: marker_image.type,
          upsert: true, // Replace if exists
        })

      if (!markerUploadError) {
        const { data: { publicUrl } } = supabase.storage.from('assets').getPublicUrl(markerFileName)
        updateData.marker_image_url = publicUrl
      }
    }

    // Upload new thumbnail image if provided (and not clearing)
    if (thumbnail_image && !clear_thumbnail) {
      const thumbnailFileName = `${currentAsset.folder_id}/thumbnail_${thumbnail_image.name}`
      const thumbnailBuffer = Buffer.from(await thumbnail_image.arrayBuffer())
      
      const { data, error: thumbnailUploadError } = await supabase.storage
        .from('assets')
        .upload(thumbnailFileName, thumbnailBuffer, {
          contentType: thumbnail_image.type,
          upsert: true, // Replace if exists
        })

      if (!thumbnailUploadError) {
        const { data: { publicUrl } } = supabase.storage.from('assets').getPublicUrl(thumbnailFileName)
        updateData.thumbnail_image_url = publicUrl
      }
    }

    // Upload new audio file if provided (and not clearing)
    if (audio_file && !clear_audio) {
      const audioFileName = `${currentAsset.folder_id}/audio_${audio_file.name}`
      const audioBuffer = Buffer.from(await audio_file.arrayBuffer())
      
      const { data, error: audioUploadError } = await supabase.storage
        .from('assets')
        .upload(audioFileName, audioBuffer, {
          contentType: audio_file.type,
          upsert: true, // Replace if exists
        })

      if (!audioUploadError) {
        const { data: { publicUrl } } = supabase.storage.from('assets').getPublicUrl(audioFileName)
        updateData.audio_url = publicUrl
      }
    }

    // Update video URL if provided (and not clearing)
    if (video_url && !clear_video) {
      updateData.video_url = video_url
    }

    const { data: asset, error: updateError } = await supabase
      .from('assets')
      .update(updateData)
      .eq('id', parseInt(id))
      .select()
      .single()

    if (updateError) {
      throw updateError
    }

    return NextResponse.json({ data: asset }, { status: 200 })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { id } = await params

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: asset, error } = await supabase
      .from('assets')
      .select('*')
      .eq('id', parseInt(id))
      .single()

    if (error || !asset) {
      return NextResponse.json({ error: 'Asset not found' }, { status: 404 })
    }

    return NextResponse.json({ data: asset }, { status: 200 })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 