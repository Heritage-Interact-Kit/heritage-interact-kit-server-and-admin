import { createClient } from '@/utils/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import unzipper from 'unzipper'
import path from 'path'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      object_id,
      title,
      description,
      folderId,
      zipPath,
      markerImagePath,
      thumbnailImagePath,
      audioPath,
      videoPath,
      interaction_method = 'show_directly'
    } = body

    if (!object_id || !title) {
      return NextResponse.json({ error: 'object_id and title are required' }, { status: 400 })
    }

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

    // Get public URLs for uploaded files
    if (markerImagePath) {
      const { data: { publicUrl } } = supabase.storage.from('assets').getPublicUrl(markerImagePath)
      uploadedFiles.marker_image_url = publicUrl
    }

    if (thumbnailImagePath) {
      const { data: { publicUrl } } = supabase.storage.from('assets').getPublicUrl(thumbnailImagePath)
      uploadedFiles.thumbnail_image_url = publicUrl
    }

    if (audioPath) {
      const { data: { publicUrl } } = supabase.storage.from('assets').getPublicUrl(audioPath)
      uploadedFiles.audio_url = publicUrl
    }

    if (videoPath) {
      const { data: { publicUrl } } = supabase.storage.from('assets').getPublicUrl(videoPath)
      uploadedFiles.video_url = publicUrl
    }

    // Process ZIP file if provided
    if (zipPath) {
      // Download the ZIP file from storage
      const { data: zipData, error: downloadError } = await supabase.storage
        .from('assets')
        .download(zipPath)

      if (downloadError) {
        throw new Error('Failed to download ZIP file for processing')
      }

      const buffer = Buffer.from(await zipData.arrayBuffer())
      const directory = await unzipper.Open.buffer(buffer)

      for (const entry of directory.files) {
        if (entry.type === 'Directory') {
          continue
        }
        
        const fileName = path.basename(entry.path)
        
        // Skip the original zip file
        if (fileName.endsWith('.zip')) {
          continue
        }

        const entryBuffer = await entry.buffer()
        const filePath = `${folderId}/${fileName}`

        const { error: uploadError } = await supabase.storage
          .from('assets')
          .upload(filePath, entryBuffer, {
            contentType: 'application/octet-stream',
            upsert: true
          })

        if (uploadError) {
          console.error('Error uploading extracted file:', uploadError)
          continue
        }

        const { data: { publicUrl } } = supabase.storage.from('assets').getPublicUrl(filePath)
        
        if (fileName.endsWith('.obj')) {
          uploadedFiles.model_url = publicUrl
        } else if (fileName.endsWith('.mtl') || fileName.endsWith('.jpg') || fileName.endsWith('.png')) {
          uploadedFiles.material_urls.push(publicUrl)
          // Only set thumbnail from ZIP if no separate thumbnail was uploaded
          if (fileName.includes('thumbnail') && !uploadedFiles.thumbnail_image_url) {
            uploadedFiles.thumbnail_image_url = publicUrl
          }
        }
      }

      // Delete the original ZIP file after extraction
      await supabase.storage.from('assets').remove([zipPath])
    }

    // Create the asset record in the database
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
