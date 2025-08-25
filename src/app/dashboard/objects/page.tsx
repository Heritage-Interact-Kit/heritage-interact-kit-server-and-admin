'use client'
import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Plus, Edit, Trash2, MapPin, Search, X } from 'lucide-react'
import { ImageUpload } from '@/components/ui/image-upload'
import { Object } from '@/types/objects'
import Link from 'next/link'

export default function ObjectsPage() {
  const [objects, setObjects] = useState<Object[]>([])
  const [filteredObjects, setFilteredObjects] = useState<Object[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editingObject, setEditingObject] = useState<Object | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [search, setSearch] = useState('')
  const [formData, setFormData] = useState({ 
    title: '', 
    description: '', 
    thumbnail_url: null as string | null,
    lat: '' as string,
    lng: '' as string
  })
  
  const searchParams = useSearchParams()
  const router = useRouter()

  // Initialize search from URL parameter
  useEffect(() => {
    const searchParam = searchParams.get('search')
    if (searchParam) {
      setSearch(searchParam)
    }
    // Initial fetch will be triggered by the search effect
  }, [searchParams])

  // Update URL when search changes and trigger new fetch
  const handleSearchChange = (value: string) => {
    setSearch(value)
    const params = new URLSearchParams(searchParams.toString())
    if (value.trim()) {
      params.set('search', value)
    } else {
      params.delete('search')
    }
    router.replace(`/dashboard/objects?${params.toString()}`)
  }

  // Fetch objects when search changes (with debounce)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchObjects()
    }, 300) // 300ms debounce

    return () => clearTimeout(timeoutId)
  }, [search])

  // Initial fetch when component mounts (if no search is set)
  useEffect(() => {
    if (!search) {
      fetchObjects()
    }
  }, []) // Only run on mount

  // Remove the old client-side filtering effect since we're now using server-side search
  // useEffect(() => {
  //   if (!search.trim()) {
  //     setFilteredObjects(objects)
  //   } else {
  //     const filtered = objects.filter(obj =>
  //       obj.title?.toLowerCase().includes(search.toLowerCase()) ||
  //       obj.description?.toLowerCase().includes(search.toLowerCase())
  //     )
  //     setFilteredObjects(filtered)
  //   }
  // }, [objects, search])

  const clearSearch = () => {
    handleSearchChange('')
  }

  const fetchObjects = async () => {
    try {
      setLoading(true)
      // Use server-side search if there's a search term
      const searchParam = search.trim() ? `?search=${encodeURIComponent(search.trim())}` : ''
      const response = await fetch(`/api/objects${searchParam}`)
      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch objects')
      }
      
      setObjects(result.data || [])
      // When using server-side search, filtered objects are the same as objects
      setFilteredObjects(result.data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch objects')
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async () => {
    if (!formData.title.trim()) return

    try {
      setSubmitting(true)
      const requestBody = {
        title: formData.title.trim(),
        description: formData.description.trim() || undefined,
        thumbnail_url: formData.thumbnail_url || undefined,
        lat: formData.lat ? parseFloat(formData.lat) : undefined,
        lng: formData.lng ? parseFloat(formData.lng) : undefined,
      }

      const response = await fetch('/api/objects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      })

      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to create object')
      }
      
      await fetchObjects()
      setIsDialogOpen(false)
      setFormData({ title: '', description: '', thumbnail_url: null, lat: '', lng: '' })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create object')
    } finally {
      setSubmitting(false)
    }
  }

  const handleUpdate = async () => {
    if (!editingObject || !formData.title.trim()) return

    try {
      setSubmitting(true)
      const requestBody = {
        title: formData.title.trim(),
        description: formData.description.trim() || undefined,
        thumbnail_url: formData.thumbnail_url || undefined,
        lat: formData.lat ? parseFloat(formData.lat) : undefined,
        lng: formData.lng ? parseFloat(formData.lng) : undefined,
      }

      const response = await fetch(`/api/objects/${editingObject.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      })

      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to update object')
      }
      
      await fetchObjects()
      setIsDialogOpen(false)
      setEditingObject(null)
      setFormData({ title: '', description: '', thumbnail_url: null, lat: '', lng: '' })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update object')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (objectId: number) => {
    if (!confirm('Are you sure you want to delete this object?')) return

    try {
      const response = await fetch(`/api/objects/${objectId}`, {
        method: 'DELETE',
      })
      
      if (!response.ok) {
        const result = await response.json()
        throw new Error(result.error || 'Failed to delete object')
      }
      
      await fetchObjects()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete object')
    }
  }

  // Handle create click
  const handleCreateClick = () => {
    setEditingObject(null)
    setFormData({ title: '', description: '', thumbnail_url: null, lat: '', lng: '' })
    setIsDialogOpen(true)
  }

  // Handle edit click
  const handleEditClick = (object: Object) => {
    setEditingObject(object)
    setFormData({ 
      title: object.title || '', 
      description: object.description || '',
      thumbnail_url: object.thumbnail_url,
      lat: object.lat ? object.lat.toString() : '',
      lng: object.lng ? object.lng.toString() : ''
    })
    setIsDialogOpen(true)
  }

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (editingObject) {
      handleUpdate()
    } else {
      handleCreate()
    }
  }

  const onDialogOpenChange = (open: boolean) => {
    if (!open) {
      setEditingObject(null)
      setFormData({ title: '', description: '', thumbnail_url: null, lat: '', lng: '' })
    }
    setIsDialogOpen(open)
  }

  // Format coordinates for display
  const formatCoordinates = (lat: number | null, lng: number | null) => {
    if (!lat || !lng) return null
    return `${lat.toFixed(6)}, ${lng.toFixed(6)}`
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-gray-500">Loading objects...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Objects</h1>
          <p className="text-gray-600 mt-1">Manage your museum objects</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={onDialogOpenChange}>
          <DialogTrigger asChild>
            <Button 
              onClick={handleCreateClick}
              className="flex items-center space-x-2"
            >
              <Plus className="h-4 w-4" />
              <span>New Object</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingObject ? 'Edit Object' : 'Create New Object'}</DialogTitle>
              <DialogDescription>
                {editingObject ? 'Update object information.' : 'Add a new object to your museum collection.'}
                {' '}Click save when you are done.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleFormSubmit} className="space-y-6">
              <div>
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Enter object title"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="description">Description</Label>
                <textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Enter object description (optional)"
                  className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-y"
                />
              </div>

              <ImageUpload
                value={formData.thumbnail_url}
                onChange={(url) => setFormData({ ...formData, thumbnail_url: url })}
                folder="objects"
                label="Object Thumbnail"
                disabled={submitting}
              />

              {/* Location Fields */}
              <div className="space-y-4">
                <Label className="text-base font-medium">Location (Optional)</Label>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="lat">Latitude</Label>
                    <Input
                      id="lat"
                      type="number"
                      step="any"
                      min="-90"
                      max="90"
                      value={formData.lat}
                      onChange={(e) => setFormData({ ...formData, lat: e.target.value })}
                      placeholder="-90 to 90"
                    />
                  </div>
                  <div>
                    <Label htmlFor="lng">Longitude</Label>
                    <Input
                      id="lng"
                      type="number"
                      step="any"
                      min="-180"
                      max="180"
                      value={formData.lng}
                      onChange={(e) => setFormData({ ...formData, lng: e.target.value })}
                      placeholder="-180 to 180"
                    />
                  </div>
                </div>
                <p className="text-xs text-gray-500">
                  Enter coordinates to mark the object location on a map
                </p>
              </div>
              
              <div className="flex justify-end space-x-2 pt-4">
                <Button type="button" variant="outline" onClick={() => onDialogOpenChange(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting ? 'Saving...' : (editingObject ? 'Update Object' : 'Create Object')}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search Bar */}
      <div className="flex items-center space-x-2">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search objects by title or description..."
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-10 pr-10"
          />
          {search && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearSearch}
              className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
        {search && (
          <div className="text-sm text-gray-500">
            {filteredObjects.length} of {objects.length} objects
          </div>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>All Objects</CardTitle>
          <CardDescription>
            {search 
              ? `${filteredObjects.length} ${filteredObjects.length === 1 ? 'object' : 'objects'} found` 
              : `${objects.length} ${objects.length === 1 ? 'object' : 'objects'} total`
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredObjects.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {search 
                ? `No objects found matching "${search}". Try a different search term.`
                : "No objects found. Create your first object to get started."
              }
            </div>
          ) : (
            <div className="space-y-4">
              {filteredObjects.map((object) => (
                <div key={object.id} className="border border-gray-200 rounded-lg p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex space-x-4 flex-1">
                      {/* Thumbnail */}
                      {object.thumbnail_url && (
                        <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                          <img
                            src={object.thumbnail_url}
                            alt={object.title || 'Object thumbnail'}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {object.title || 'Untitled Object'}
                          </h3>
                          <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">
                            ID: {object.id}
                          </span>
                        </div>
                        
                        {object.description && (
                          <p className="text-gray-600 mb-3 leading-relaxed">
                            {object.description}
                          </p>
                        )}

                        {/* Display location if available */}
                        {object.lat && object.lng && (
                          <div className="flex items-center gap-2 mb-3">
                            <MapPin className="w-4 h-4 text-blue-600" />
                            <span className="text-sm text-gray-600">
                              Location: {formatCoordinates(object.lat, object.lng)}
                            </span>
                          </div>
                        )}
                        
                        <div className="text-sm text-gray-500">
                          Created: {new Date(object.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2 ml-4">
                      <Link href={`/dashboard/objects/${object.id}/assets`}>
                        <Button size="sm" variant="outline">
                          Manage Assets
                        </Button>
                      </Link>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEditClick(object)}
                        className="flex items-center space-x-1"
                      >
                        <Edit className="h-3 w-3" />
                        <span>Edit</span>
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDelete(object.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-3 w-3 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 