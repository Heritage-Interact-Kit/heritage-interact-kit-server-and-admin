'use client'

import { useState, useRef } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Upload, X, Video } from 'lucide-react'

interface VideoUploadProps {
  value?: string | null
  onChange: (url: string | null) => void
  bucketName?: string
  folder?: string
  label?: string
  disabled?: boolean
}

export function VideoUpload({
  value,
  onChange,
  bucketName = 'assets',
  folder = '',
  label = 'Video File',
  disabled = false
}: VideoUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    const validTypes = ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime']
    if (!validTypes.includes(file.type)) {
      setError('Please select a valid video file (MP4, WebM, OGG, or MOV)')
      return
    }

    // No file size limit for videos
    // You may want to add a reasonable limit later if needed

    await uploadVideo(file)
  }

  const uploadVideo = async (file: File) => {
    try {
      setUploading(true)
      setError(null)

      // Generate unique filename
      const timestamp = Date.now()
      const randomString = Math.random().toString(36).substring(2, 15)
      const fileExt = file.name.split('.').pop()
      const fileName = `${timestamp}_${randomString}.${fileExt}`
      const filePath = folder ? `${folder}/video_${fileName}` : `video_${fileName}`

      // Upload file to Supabase storage
      const { data, error: uploadError } = await supabase.storage
        .from(bucketName)
        .upload(filePath, file, {
          contentType: file.type,
          upsert: false
        })

      if (uploadError) {
        throw uploadError
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from(bucketName)
        .getPublicUrl(filePath)

      onChange(publicUrl)
    } catch (err) {
      console.error('Upload error:', err)
      setError(err instanceof Error ? err.message : 'Failed to upload video')
    } finally {
      setUploading(false)
    }
  }

  const handleRemove = async () => {
    if (!value) return

    try {
      // Extract file path from URL
      const url = new URL(value)
      const pathParts = url.pathname.split('/')
      const filePath = pathParts.slice(pathParts.indexOf(bucketName) + 1).join('/')

      if (filePath) {
        await supabase.storage
          .from(bucketName)
          .remove([filePath])
      }
    } catch (err) {
      console.error('Error removing file:', err)
    }

    onChange(null)
  }

  const triggerFileSelect = () => {
    fileInputRef.current?.click()
  }

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      
      <div className="space-y-3">
        {/* Current video preview */}
        {value && (
          <div className="space-y-2">
            <video
              src={value}
              controls
              className="w-full max-w-md rounded-lg border-2 border-gray-200"
            >
              Your browser does not support the video tag.
            </video>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={handleRemove}
              disabled={disabled || uploading}
            >
              <X className="h-4 w-4 mr-2" />
              Remove Video
            </Button>
          </div>
        )}

        {/* Upload button */}
        {!value && (
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
            <Video className="mx-auto h-12 w-12 text-gray-400 mb-2" />
            <Button
              type="button"
              variant="outline"
              onClick={triggerFileSelect}
              disabled={disabled || uploading}
              className="mb-2"
            >
              <Upload className="h-4 w-4 mr-2" />
              {uploading ? 'Uploading...' : 'Upload Video'}
            </Button>
            <p className="text-sm text-gray-500">
              MP4, WebM, OGG, or MOV
            </p>
          </div>
        )}

        {/* Hidden file input */}
        <Input
          ref={fileInputRef}
          type="file"
          accept="video/*"
          onChange={handleFileSelect}
          className="hidden"
        />

        {/* Error message */}
        {error && (
          <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
            {error}
          </div>
        )}
      </div>
    </div>
  )
}
