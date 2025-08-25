'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Tour } from '@/types/tours'
import { Plus, Edit, Trash2, Users } from 'lucide-react'
import { ImageUpload } from '@/components/ui/image-upload'
import Link from 'next/link'

export default function ToursPage() {
  const [tours, setTours] = useState<Tour[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editingTour, setEditingTour] = useState<Tour | null>(null)
  const [formData, setFormData] = useState({ title: '', description: '', thumbnail_url: null as string | null })
  const [submitting, setSubmitting] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  // Fetch tours
  const fetchTours = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/tours')
      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch tours')
      }
      
      setTours(result.data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch tours')
    } finally {
      setLoading(false)
    }
  }

  // Create tour
  const createTour = async () => {
    if (!formData.title.trim()) return

    try {
      setSubmitting(true)
      const response = await fetch('/api/tours', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          title: formData.title,
          description: formData.description,
          thumbnail_url: formData.thumbnail_url
        }),
      })
      
      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to create tour')
      }
      
      setTours([result.data, ...tours])
      setIsDialogOpen(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create tour')
    } finally {
      setSubmitting(false)
    }
  }

  // Update tour
  const updateTour = async () => {
    if (!editingTour || !formData.title.trim()) return

    try {
      setSubmitting(true)
      const response = await fetch(`/api/tours/${editingTour.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          title: formData.title,
          description: formData.description,
          thumbnail_url: formData.thumbnail_url
        }),
      })
      
      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to update tour')
      }
      
      setTours(tours.map(tour => 
        tour.id === editingTour.id ? result.data : tour
      ))
      setIsDialogOpen(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update tour')
    } finally {
      setSubmitting(false)
    }
  }

  // Delete tour
  const deleteTour = async (id: number) => {
    if (!confirm('Are you sure you want to delete this tour?')) return

    try {
      const response = await fetch(`/api/tours/${id}`, {
        method: 'DELETE',
      })
      
      if (!response.ok) {
        const result = await response.json()
        throw new Error(result.error || 'Failed to delete tour')
      }
      
      setTours(tours.filter(tour => tour.id !== id))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete tour')
    }
  }

  // Handle create click
  const handleCreate = () => {
    setEditingTour(null)
    setFormData({ title: '', description: '', thumbnail_url: null })
    setIsDialogOpen(true)
  }
  
  // Handle edit click
  const handleEdit = (tour: Tour) => {
    setEditingTour(tour)
    setFormData({ 
      title: tour.title || '', 
      description: tour.description || '',
      thumbnail_url: tour.thumbnail_url
    })
    setIsDialogOpen(true)
  }

  // Handle form submit
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (editingTour) {
      updateTour()
    } else {
      createTour()
    }
  }

  const onDialogOpenChange = (open: boolean) => {
    if (!open) {
      setEditingTour(null)
      setFormData({ title: '', description: '', thumbnail_url: null })
    }
    setIsDialogOpen(open)
  }

  useEffect(() => {
    fetchTours()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-gray-500">Loading tours...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Tours</h1>
          <p className="text-gray-600 mt-1">Manage your museum tours</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={onDialogOpenChange}>
          <DialogTrigger asChild>
            <Button 
              onClick={handleCreate}
              className="flex items-center space-x-2"
            >
              <Plus className="h-4 w-4" />
              <span>New Tour</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingTour ? 'Edit Tour' : 'Create New Tour'}</DialogTitle>
              <DialogDescription>
                {editingTour ? 'Update tour information.' : 'Add a new tour to your museum.'}
                {' '}Click save when you are done.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Enter tour title"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="description">Description</Label>
                <textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Enter tour description (optional)"
                  className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-y"
                />
              </div>

              <ImageUpload
                value={formData.thumbnail_url}
                onChange={(url) => setFormData({ ...formData, thumbnail_url: url })}
                folder="tours"
                label="Tour Thumbnail"
                disabled={submitting}
              />
              
              <div className="flex justify-end space-x-2 pt-4">
                <Button type="button" variant="outline" onClick={() => onDialogOpenChange(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting ? 'Saving...' : (editingTour ? 'Update Tour' : 'Create Tour')}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Tours List */}
      <Card>
        <CardHeader>
          <CardTitle>All Tours</CardTitle>
          <CardDescription>
            {tours.length} {tours.length === 1 ? 'tour' : 'tours'} total
          </CardDescription>
        </CardHeader>
        <CardContent>
          {tours.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No tours found. Create your first tour to get started.
            </div>
          ) : (
            <div className="space-y-4">
              {tours.map((tour) => (
                <div key={tour.id} className="border border-gray-200 rounded-lg p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex space-x-4 flex-1">
                      {/* Thumbnail */}
                      {tour.thumbnail_url && (
                        <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                          <img
                            src={tour.thumbnail_url}
                            alt={tour.title || 'Tour thumbnail'}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {tour.title || 'Untitled'}
                          </h3>
                          <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">
                            ID: {tour.id}
                          </span>
                        </div>
                        
                        {tour.description && (
                          <p className="text-gray-600 mb-3 leading-relaxed">
                            {tour.description}
                          </p>
                        )}
                        
                        <div className="text-sm text-gray-500">
                          Created: {new Date(tour.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2 ml-4">
                      <Link href={`/dashboard/tours/${tour.id}/objects`}>
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex items-center space-x-1"
                        >
                          <Users className="h-3 w-3" />
                          <span>Manage Objects</span>
                        </Button>
                      </Link>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(tour)}
                        className="flex items-center space-x-1"
                      >
                        <Edit className="h-3 w-3" />
                        <span>Edit</span>
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => deleteTour(tour.id)}
                        className="flex items-center space-x-1 text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-3 w-3" />
                        <span>Delete</span>
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