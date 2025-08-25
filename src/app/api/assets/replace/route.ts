import { createClient } from '@/utils/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { v4 as uuidv4 } from 'uuid'
import unzipper from 'unzipper'
import path from 'path'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const asset_id = formData.get('asset_id') as string

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 })
    }
     if (!asset_id) {
      return NextResponse.json({ error: 'asset_id is required' }, { status: 400 })
    }

    const { data: asset, error: fetchError } = await supabase
      .from('assets')
      .select('folder_id')
      .eq('id', asset_id)
      .single()

    if (fetchError || !asset) {
        return NextResponse.json({ error: 'Asset not found' }, { status: 404 })
    }

    const folderId = asset.folder_id
    
    const { data: files, error: listError } = await supabase
      .storage
      .from('assets')
      .list(folderId)

    if (listError) {
        throw listError
    }

    const fileNames = files.map(file => `${folderId}/${file.name}`)
    await supabase.storage.from('assets').remove(fileNames)
    
    const uploadedFiles: { model_url?: string; material_urls: string[]; thumbnail_image_url?: string } = {
      material_urls: [],
    }

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

        const { data, error: uploadError } = await supabase.storage
          .from('assets')
          .upload(filePath, buffer, {
            contentType: 'application/octet-stream',
          })

        if (uploadError) {
          throw uploadError
        }

        const { data: { publicUrl } } = supabase.storage.from('assets').getPublicUrl(filePath)
        
        if (fileName.endsWith('.obj') || fileName.endsWith('.glb') || fileName.endsWith('.gltf')) {
          uploadedFiles.model_url = publicUrl
        } else if (fileName.endsWith('.mtl') || fileName.endsWith('.jpg') || fileName.endsWith('.png')) {
          uploadedFiles.material_urls.push(publicUrl)
          if (fileName.includes('thumbnail')) {
              uploadedFiles.thumbnail_image_url = publicUrl
          }
        }
      }
    }

    const { data: updatedAsset, error: updateError } = await supabase.from('assets').update({
        ...uploadedFiles,
      }).eq('id', asset_id).select().single()

    if (updateError) {
        throw updateError
    }

    return NextResponse.json({ data: updatedAsset }, { status: 200 })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 