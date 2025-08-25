'use client'
import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ArrowLeft, Check, Plus } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { type InteractionMethod } from '@/types/assets'

interface Asset {
  id: string
  title: string | null
  description: string | null
  thumbnail_image_url: string | null
  marker_image_url: string | null
  audio_url: string | null
  video_url: string | null
  interaction_method: InteractionMethod
  model_url: string | null
}

const INTERACTION_METHOD_LABELS = {
  place_on_plane: 'Place on Plane',
  show_on_marker: 'Show on Marker',
  show_ar_portal: 'Show AR Portal',
  show_directly: 'Show Directly'
}

export default function AssetsPage({ params }: { params: Promise<{ id: string }> }) {
  const supabase = createClient()
  const router = useRouter()
  const [assets, setAssets] = useState<Asset[]>([])
  const [uploading, setUploading] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [formData, setFormData] = useState({ 
    title: ''
  })
  const [resolvedParams, setResolvedParams] = useState<{ id: string } | null>(null)

  useEffect(() => {
    const initParams = async () => {
      const p = await params
      setResolvedParams(p)
    }
    initParams()
  }, [params])

  const fetchAssets = useCallback(async () => {
    if (!resolvedParams) return
    
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('assets')
        .select('*')
        .eq('object_id', resolvedParams.id)
      
      if (error) {
        throw new Error(error.message)
      }
      
      setAssets(data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch assets')
    } finally {
      setLoading(false)
    }
  }, [resolvedParams, supabase])

  useEffect(() => {
    if (resolvedParams) {
      fetchAssets()
    }
  }, [resolvedParams, fetchAssets])

  const handleUpload = async () => {
    if (!formData.title.trim()) {
      setError('Please enter a title for the asset.')
      return
    }

    try {
      setUploading(true)
      setError(null)
      
      // Create the asset with just the title
      const finalizeResponse = await fetch('/api/assets/finalize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          object_id: resolvedParams?.id || '',
          title: formData.title.trim()
        })
      })
      
      if (!finalizeResponse.ok) {
        throw new Error('Failed to create asset')
      }
      
      const { data: newAsset } = await finalizeResponse.json()
      
      // Navigate to the edit page for the new asset
      router.push(`/dashboard/objects/${resolvedParams?.id}/assets/${newAsset.id}/edit`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error creating asset')
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async (assetId: string) => {
    if (!confirm('Are you sure you want to delete this asset?')) return

    try {
      const { error } = await supabase.from('assets').delete().eq('id', assetId)
      if (error) {
        throw new Error(error.message)
      }
      
      await fetchAssets()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete asset')
    }
  }

  const handleCreateClick = () => {
    setFormData({ title: '' })
    setError(null)
    setIsDialogOpen(true)
  }

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    handleUpload()
  }

  const onDialogOpenChange = (open: boolean) => {
    if (!open) {
      setFormData({ title: '' })
      setError(null)
    }
    setIsDialogOpen(open)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-gray-500">Loading assets...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Navigation Bar */}
      <div className="pb-2 border-b border-gray-100">
        <Link href="/dashboard/objects">
          <Button variant="ghost" size="sm" className="text-gray-600 hover:text-gray-900 -ml-2">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Objects
          </Button>
        </Link>
      </div>

      {/* Page Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-gray-900">Assets Management</h1>
          <p className="text-lg text-gray-600">
            Manage assets for Object ID: <span className="font-medium">{resolvedParams?.id}</span>
          </p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={onDialogOpenChange}>
          <DialogTrigger asChild>
            <Button 
              onClick={handleCreateClick}
              className="flex items-center space-x-2"
            >
              <Plus className="h-4 w-4" />
              <span>New Asset</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Create New Asset</DialogTitle>
              <DialogDescription>
                Enter a title for your new asset. You will be able to upload 3D models, images, audio, and video files on the next page.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleFormSubmit} className="space-y-6">
              <div>
                <Label htmlFor="title">Title</Label>
                <Input 
                  id="title" 
                  value={formData.title} 
                  onChange={(e) => setFormData({ title: e.target.value })}
                  placeholder="Enter asset title"
                  required
                  autoFocus
                />
              </div>
              
              {error && (
                <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
                  {error}
                </div>
              )}
              
              <div className="flex justify-end space-x-2 pt-4">
                <Button type="button" variant="outline" onClick={() => onDialogOpenChange(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={uploading || !formData.title.trim()}>
                  {uploading ? 'Creating...' : 'Create Asset'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {error && !isDialogOpen && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Assets</CardTitle>
          <CardDescription>
            {assets.length} {assets.length === 1 ? 'asset' : 'assets'} uploaded for this object
          </CardDescription>
        </CardHeader>
        <CardContent>
          {assets.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No assets found. Upload your first asset to get started.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Asset Details</TableHead>
                  <TableHead>Interaction Method</TableHead>
                  <TableHead>Media</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {assets.map((asset) => (
                  <TableRow key={asset.id}>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="font-medium">{asset.title}</div>
                        {asset.description && (
                          <div className="text-sm text-gray-500 line-clamp-2 max-w-xs">
                            {asset.description}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {INTERACTION_METHOD_LABELS[asset.interaction_method]}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col space-y-2">
                        {/* Thumbnail */}
                        <div className="flex items-center space-x-2">
                          {asset.thumbnail_image_url ? (
                            <img 
                              src={asset.thumbnail_image_url} 
                              alt={asset.title || ''} 
                              className="w-8 h-8 object-cover rounded border flex-shrink-0"
                              title="Thumbnail"
                            />
                          ) : (
                            <div className="w-8 h-8 bg-gray-100 rounded border flex items-center justify-center text-gray-400 text-xs flex-shrink-0" title="No thumbnail">
                              📷
                            </div>
                          )}
                          <span className="text-xs text-gray-500">Image</span>
                        </div>
                        
                        {/* Marker */}
                        {/* <div className="flex items-center space-x-2">
                          {asset.marker_image_url ? (
                            <img 
                              src={asset.marker_image_url} 
                              alt="Marker" 
                              className="w-8 h-8 object-cover rounded border flex-shrink-0"
                              title="Marker Image"
                            />
                          ) : (
                            <div className="w-8 h-8 bg-gray-100 rounded border flex items-center justify-center text-gray-400 text-xs flex-shrink-0" title="No marker">
                              🎯
                            </div>
                          )}
                          <span className="text-xs text-gray-500">Marker</span>
                        </div> */}
                        
                        {/* Audio */}
                        <div className="flex items-center space-x-2">
                          {asset.audio_url ? (
                            <div className="w-8 h-8 bg-green-50 rounded border flex items-center justify-center flex-shrink-0" title="Has audio">
                              🔇
                            </div>
                          ) : (
                            <div className="w-8 h-8 bg-gray-100 rounded border flex items-center justify-center text-gray-400 text-xs flex-shrink-0" title="No audio">
                              🔇
                            </div>
                          )}
                          <span className="text-xs text-gray-500">Audio</span>
                        </div>
                        
                        {/* Video */}
                        <div className="flex items-center space-x-2">
                          {asset.video_url ? (
                            <div className="w-8 h-8 bg-green-50 rounded border flex items-center justify-center text-green-600 text-xs flex-shrink-0" title="Has video">
                              🎬
                            </div>
                          ) : (
                            <div className="w-8 h-8 bg-gray-100 rounded border flex items-center justify-center text-gray-400 text-xs flex-shrink-0" title="No video">
                              📹
                            </div>
                          )}
                          <span className="text-xs text-gray-500">Video</span>
                        </div>
                        {/* 3D Model */}
                        <div className="flex items-center space-x-2">
                          {asset.model_url ? (
                            <div className="w-8 h-8 bg-green-50 rounded border flex items-center justify-center text-green-600 text-xs flex-shrink-0" title="Has 3D model">
                              <Check className="w-4 h-4" />
                            </div>
                          ) : (
                            <div className="w-8 h-8 bg-gray-100 rounded border flex items-center justify-center text-gray-400 text-xs flex-shrink-0" title="No 3D model">
                              🎯
                            </div>
                          )}
                          <span className="text-xs text-gray-500">3D Model</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Link href={`/dashboard/objects/${resolvedParams?.id}/assets/${asset.id}/edit`}>
                          <Button variant="outline" size="sm">Edit</Button>
                        </Link>
                        <Button 
                          variant="destructive" 
                          size="sm" 
                          onClick={() => handleDelete(asset.id)}
                        >
                          Delete
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 