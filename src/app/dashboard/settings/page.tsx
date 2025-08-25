'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { SiteSettings } from '@/types/site-settings'
import { ImageUpload } from '@/components/ui/image-upload'
import { Save, Settings } from 'lucide-react'

export default function SettingsPage() {
  const [settings, setSettings] = useState<SiteSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [formData, setFormData] = useState({ 
    site_name: '', 
    site_logo_url: null as string | null,
    site_banner_image_url: null as string | null
  })
  const [submitting, setSubmitting] = useState(false)

  // Fetch site settings
  const fetchSettings = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch('/api/site-settings')
      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch site settings')
      }
      
      setSettings(result.data)
      setFormData({
        site_name: result.data.site_name || '',
        site_logo_url: result.data.site_logo_url || null,
        site_banner_image_url: result.data.site_banner_image_url || null
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch site settings')
    } finally {
      setLoading(false)
    }
  }

  // Update site settings
  const updateSettings = async () => {
    if (!formData.site_name.trim()) {
      setError('Site name is required')
      return
    }

    try {
      setSubmitting(true)
      setError(null)
      setSuccess(null)
      
      const response = await fetch('/api/site-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          site_name: formData.site_name,
          site_logo_url: formData.site_logo_url,
          site_banner_image_url: formData.site_banner_image_url
        }),
      })
      
      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to update site settings')
      }
      
      setSettings(result.data)
      setSuccess('Site settings updated successfully!')
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update site settings')
    } finally {
      setSubmitting(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    updateSettings()
  }

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    setError(null)
    setSuccess(null)
  }

  const handleLogoChange = (url: string | null) => {
    setFormData(prev => ({ ...prev, site_logo_url: url }))
    setError(null)
    setSuccess(null)
  }

  const handleBannerChange = (url: string | null) => {
    setFormData(prev => ({ ...prev, site_banner_image_url: url }))
    setError(null)
    setSuccess(null)
  }

  useEffect(() => {
    fetchSettings()
  }, [])

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading site settings...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Settings className="h-8 w-8 text-blue-600" />
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Site Settings</h1>
          <p className="text-gray-600">Manage your site&apos;s general settings</p>
        </div>
      </div>

      {/* Settings Form */}
      <Card>
        <CardHeader>
          <CardTitle>General Settings</CardTitle>
          <CardDescription>
            Configure your site&apos;s basic information and branding
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Site Name */}
            <div className="space-y-2">
              <Label htmlFor="site_name">Site Name</Label>
              <Input
                id="site_name"
                type="text"
                value={formData.site_name}
                onChange={(e) => handleInputChange('site_name', e.target.value)}
                placeholder="Enter site name"
                required
                disabled={submitting}
              />
            </div>

            {/* Site Logo */}
            <div className="space-y-2">
              <ImageUpload
                value={formData.site_logo_url}
                onChange={handleLogoChange}
                bucketName="thumbnails"
                folder="site-logos"
                label="Site Logo"
                disabled={submitting}
              />
            </div>

            {/* Site Banner Image */}
            <div className="space-y-2">
              <ImageUpload
                value={formData.site_banner_image_url}
                onChange={handleBannerChange}
                bucketName="thumbnails"
                folder="site-banners"
                label="Site Banner Image"
                disabled={submitting}
              />
            </div>

            {/* Error Alert */}
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Success Alert */}
            {success && (
              <Alert className="border-green-200 bg-green-50 text-green-800">
                <AlertDescription>{success}</AlertDescription>
              </Alert>
            )}

            {/* Submit Button */}
            <div className="flex justify-end">
              <Button 
                type="submit" 
                disabled={submitting || !formData.site_name.trim()}
                className="min-w-32"
              >
                <Save className="h-4 w-4 mr-2" />
                {submitting ? 'Saving...' : 'Save Settings'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Current Settings Info */}
      {settings && (
        <Card>
          <CardHeader>
            <CardTitle>Current Settings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm">
              <div>
                <span className="font-medium">Site Name:</span> {settings.site_name}
              </div>
              <div>
                <span className="font-medium">Logo:</span> {settings.site_logo_url ? 'Uploaded' : 'Not set'}
              </div>
              <div>
                <span className="font-medium">Banner Image:</span> {settings.site_banner_image_url ? 'Uploaded' : 'Not set'}
              </div>
              <div>
                <span className="font-medium">Last Updated:</span> {new Date(settings.updated_at).toLocaleString()}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
} 