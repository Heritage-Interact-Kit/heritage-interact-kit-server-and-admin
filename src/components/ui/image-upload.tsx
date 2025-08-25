'use client'

import { useState, useRef } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Upload, X, Image as ImageIcon } from 'lucide-react'

interface ImageUploadProps {
  value?: string | null
  onChange: (url: string | null) => void
  bucketName?: string
  folder?: string
  label?: string
  disabled?: boolean
}

export function ImageUpload({
  value,
  onChange,
  bucketName = 'thumbnails',
  folder = '',
  label = 'Thumbnail Image',
  disabled = false
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file')
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be less than 5MB')
      return
    }

    await uploadImage(file)
  }

  const uploadImage = async (file: File) => {
    try {
      setUploading(true)
      setError(null)

      // Generate unique filename
      const timestamp = Date.now()
      const randomString = Math.random().toString(36).substring(2, 15)
      const fileExt = file.name.split('.').pop()
      const fileName = `${timestamp}_${randomString}.${fileExt}`
      const filePath = folder ? `${folder}/${fileName}` : fileName

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
      setError(err instanceof Error ? err.message : 'Failed to upload image')
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
        {/* Current image preview */}
        {value && (
          <div className="relative w-32 h-32 border-2 border-gray-200 rounded-lg overflow-hidden">
            <img
              src={value}
              alt="Thumbnail preview"
              className="w-full h-full object-cover"
            />
            <button
              type="button"
              onClick={handleRemove}
              disabled={disabled || uploading}
              className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 disabled:opacity-50"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        )}

        {/* Upload button */}
        {!value && (
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
            <ImageIcon className="mx-auto h-12 w-12 text-gray-400 mb-2" />
            <Button
              type="button"
              variant="outline"
              onClick={triggerFileSelect}
              disabled={disabled || uploading}
              className="mb-2"
            >
              <Upload className="h-4 w-4 mr-2" />
              {uploading ? 'Uploading...' : 'Upload Image'}
            </Button>
            <p className="text-sm text-gray-500">
              PNG, JPG, GIF up to 5MB
            </p>
          </div>
        )}

        {/* Hidden file input */}
        <Input
          ref={fileInputRef}
          type="file"
          accept="image/*"
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