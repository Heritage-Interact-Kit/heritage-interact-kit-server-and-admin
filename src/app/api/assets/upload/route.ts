import { createClient } from '@/utils/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { v4 as uuidv4 } from 'uuid'
import unzipper from 'unzipper'
import path from 'path'

// Configure route to handle large file uploads (up to 200MB)
export const maxDuration = 60 // Maximum allowed duration of 60 seconds
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const title = formData.get('title') as string
    const description = formData.get('description') as string
    const object_id = formData.get('object_id') as string
    const interaction_method = formData.get('interaction_method') as string || 'place_on_plane'
    const marker_image = formData.get('marker_image') as File | null
    const thumbnail_image = formData.get('thumbnail_image') as File | null
    const audio_file = formData.get('audio_file') as File | null
    const video_file = formData.get('video_file') as File | null

    // Check that at least one file type is provided
    if (!file && !marker_image && !thumbnail_image && !audio_file && !video_file) {
      return NextResponse.json({ error: 'At least one file (ZIP, marker image, thumbnail image, audio file, or video file) must be uploaded' }, { status: 400 })
    }

    if (!object_id) {
      return NextResponse.json({ error: 'object_id is required' }, { status: 400 })
    }

    const folderId = uuidv4()
    const uploadedFiles: { 
      model_url?: string
      material_urls: string[]
      thumbnail_image_url?: string
      marker_image_url?: string
      audio_url?: string
      video_url?: string
    } = {
      material_urls: [],
    }

    // Upload marker image if provided
    if (marker_image) {
      const markerFileName = `${folderId}/marker_${marker_image.name}`
      const markerBuffer = Buffer.from(await marker_image.arrayBuffer())
      
      const { data, error: markerUploadError } = await supabase.storage
        .from('assets')
        .upload(markerFileName, markerBuffer, {
          contentType: marker_image.type,
        })

      if (!markerUploadError) {
        const { data: { publicUrl } } = supabase.storage.from('assets').getPublicUrl(markerFileName)
        uploadedFiles.marker_image_url = publicUrl
      }
    }

    // Upload thumbnail image if provided
    if (thumbnail_image) {
      const thumbnailFileName = `${folderId}/thumbnail_${thumbnail_image.name}`
      const thumbnailBuffer = Buffer.from(await thumbnail_image.arrayBuffer())
      
      const { data, error: thumbnailUploadError } = await supabase.storage
        .from('assets')
        .upload(thumbnailFileName, thumbnailBuffer, {
          contentType: thumbnail_image.type,
        })

      if (!thumbnailUploadError) {
        const { data: { publicUrl } } = supabase.storage.from('assets').getPublicUrl(thumbnailFileName)
        uploadedFiles.thumbnail_image_url = publicUrl
      }
    }

    // Upload audio file if provided
    if (audio_file) {
      const audioFileName = `${folderId}/audio_${audio_file.name}`
      const audioBuffer = Buffer.from(await audio_file.arrayBuffer())
      
      const { data, error: audioUploadError } = await supabase.storage
        .from('assets')
        .upload(audioFileName, audioBuffer, {
          contentType: audio_file.type,
        })

      if (!audioUploadError) {
        const { data: { publicUrl } } = supabase.storage.from('assets').getPublicUrl(audioFileName)
        uploadedFiles.audio_url = publicUrl
      }
    }

    // Upload video file if provided
    if (video_file) {
      const videoFileName = `${folderId}/video_${video_file.name}`
      const videoBuffer = Buffer.from(await video_file.arrayBuffer())
      
      const { data, error: videoUploadError } = await supabase.storage
        .from('assets')
        .upload(videoFileName, videoBuffer, {
          contentType: video_file.type,
        })

      if (!videoUploadError) {
        const { data: { publicUrl } } = supabase.storage.from('assets').getPublicUrl(videoFileName)
        uploadedFiles.video_url = publicUrl
      }
    }

    // Process file if provided
    if (file) {
      const fileName = file.name.toLowerCase()
      
      // Check if it's a direct model file (GLB, GLTF, OBJ)
      if (fileName.endsWith('.glb') || fileName.endsWith('.gltf') || fileName.endsWith('.obj')) {
        const fileBuffer = Buffer.from(await file.arrayBuffer())
        const filePath = `${folderId}/${file.name}`

        const { data, error: uploadError } = await supabase.storage
          .from('assets')
          .upload(filePath, fileBuffer, {
            contentType: 'application/octet-stream',
          })

        if (uploadError) {
          throw uploadError
        }

        const { data: { publicUrl } } = supabase.storage.from('assets').getPublicUrl(filePath)
        uploadedFiles.model_url = publicUrl
      } else {
        // Process as ZIP file
        const fileBuffer = Buffer.from(await file.arrayBuffer())
        const directory = await unzipper.Open.buffer(fileBuffer)

        for (const entry of directory.files) {
          if (entry.type === 'Directory') {
            continue
          }
          
          const fileName = path.basename(entry.path)
          
          // Skip hidden files (files starting with ._)
          if (fileName.startsWith('._')) {
            continue
          }
          
          const buffer = await entry.buffer()
          const filePath = `${folderId}/${fileName}`

          console.log('filePath', filePath)

          const { data, error: uploadError } = await supabase.storage
            .from('assets')
            .upload(filePath, buffer, {
              contentType: 'application/octet-stream',
            })

          console.log('uploadError', uploadError)

          if (uploadError) {
            throw uploadError
          }

          const { data: { publicUrl } } = supabase.storage.from('assets').getPublicUrl(filePath)
          
          if (fileName.endsWith('.obj') || fileName.endsWith('.glb') || fileName.endsWith('.gltf')) {
            uploadedFiles.model_url = publicUrl
          } else if (fileName.endsWith('.mtl') || fileName.endsWith('.jpg') || fileName.endsWith('.png')) {
            uploadedFiles.material_urls.push(publicUrl)
            // Only set thumbnail from ZIP if no separate thumbnail was uploaded
            if (fileName.includes('thumbnail') && !uploadedFiles.thumbnail_image_url) {
                uploadedFiles.thumbnail_image_url = publicUrl
            }
          }
        }
      }
    }

    const { data: asset, error: insertError } = await supabase.from('assets').insert({
        object_id,
        title,
        description,
        folder_id: folderId,
        interaction_method,
        ...uploadedFiles,
      }).select().single()

    if (insertError) {
        throw insertError
    }

    return NextResponse.json({ data: asset }, { status: 201 })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 