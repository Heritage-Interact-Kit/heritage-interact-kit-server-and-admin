'use client'
import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { createClient } from '@/utils/supabase/client'
import { Upload, Music, X, Volume2 } from 'lucide-react'

interface AudioUploadProps {
  value: string | null
  onChange: (url: string | null) => void
  bucketName?: string
  folder?: string
  label?: string
  disabled?: boolean
}

export function AudioUpload({
  value,
  onChange,
  bucketName = 'assets',
  folder = '',
  label = 'Audio File',
  disabled = false
}: AudioUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('audio/')) {
      setError('Please select an audio file')
      return
    }

    // Validate file size (max 50MB)
    if (file.size > 50 * 1024 * 1024) {
      setError('Audio file must be less than 50MB')
      return
    }

    await uploadAudio(file)
  }

  const uploadAudio = async (file: File) => {
    try {
      setUploading(true)
      setError(null)

      // Generate unique filename
      const timestamp = Date.now()
      const randomString = Math.random().toString(36).substring(2, 15)
      const fileExt = file.name.split('.').pop()
      const fileName = `audio_${timestamp}_${randomString}.${fileExt}`
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
      setError(err instanceof Error ? err.message : 'Failed to upload audio')
    } finally {
      setUploading(false)
    }
  }

  const handleRemove = async () => {
    if (!value) return

    try {
      // Extract file path from URL to delete from storage
      const url = new URL(value)
      const filePath = url.pathname.split('/').slice(-2).join('/')
      
      await supabase.storage
        .from(bucketName)
        .remove([filePath])
      
      onChange(null)
    } catch (err) {
      console.error('Error removing audio:', err)
      // Still remove from UI even if storage deletion fails
      onChange(null)
    }
  }

  const triggerFileSelect = () => {
    fileInputRef.current?.click()
  }

  const getFileName = (url: string) => {
    try {
      return decodeURIComponent(url.split('/').pop() || 'audio file').replace(/^audio_\d+_[a-z0-9]+\./, '')
    } catch {
      return 'audio file'
    }
  }

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-gray-700">
        {label}
      </label>
      
      <div className="space-y-3">
        {/* Current audio display */}
        {value && (
          <div className="border rounded-lg p-4 bg-gray-50">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Music className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {getFileName(value)}
                  </p>
                  <p className="text-xs text-gray-500">Audio file</p>
                </div>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleRemove}
                disabled={disabled}
                className="text-red-600 hover:text-red-800 hover:bg-red-50"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            {/* Audio player */}
            <div className="flex items-center space-x-2">
              <Volume2 className="h-4 w-4 text-gray-500" />
              <audio 
                controls 
                className="flex-1 h-8"
                style={{ maxWidth: '100%' }}
              >
                <source src={value} />
                Your browser does not support the audio element.
              </audio>
            </div>
          </div>
        )}

        {/* Upload button */}
        {!value && (
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
            <Music className="mx-auto h-12 w-12 text-gray-400 mb-2" />
            <Button
              type="button"
              variant="outline"
              onClick={triggerFileSelect}
              disabled={disabled || uploading}
              className="mb-2"
            >
              <Upload className="h-4 w-4 mr-2" />
              {uploading ? 'Uploading...' : 'Upload Audio'}
            </Button>
            <p className="text-sm text-gray-500">
              MP3, WAV, M4A up to 50MB
            </p>
          </div>
        )}

        {/* Hidden file input */}
        <Input
          ref={fileInputRef}
          type="file"
          accept="audio/*"
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