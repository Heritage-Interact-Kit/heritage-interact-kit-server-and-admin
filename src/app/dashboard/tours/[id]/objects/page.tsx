'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus, Trash2, MapPin, GripVertical } from 'lucide-react'
import { Object } from '@/types/objects'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import {
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

interface TourObject {
  id: number
  tour_id: number
  object_id: number
  display_order?: number
  created_at: string
  objects: Object
}

// Sortable Item Component
function SortableObjectCard({ tourObject, onRemove }: { 
  tourObject: TourObject; 
  onRemove: (objectId: number) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: tourObject.object_id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <Card ref={setNodeRef} style={style} className={`${isDragging ? 'shadow-lg z-10' : ''} mb-4`}>
      <div className="flex items-center p-4 gap-4">
        {/* Drag Handle */}
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing p-2 hover:bg-gray-100 rounded flex-shrink-0"
        >
          <GripVertical className="h-5 w-5 text-gray-400" />
        </div>

        {/* Thumbnail */}
        {tourObject.objects?.thumbnail_url && (
          <div className="w-16 h-16 overflow-hidden rounded-lg flex-shrink-0">
            <img 
              src={tourObject.objects.thumbnail_url} 
              alt={tourObject.objects?.title || 'Object'}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-semibold text-gray-900 truncate">
                {tourObject.objects?.title || `Object ${tourObject.objects?.id || tourObject.object_id}`}
              </h3>
              
              {tourObject.objects?.description && (
                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                  {tourObject.objects.description}
                </p>
              )}
              
              <div className="flex items-center gap-4 mt-2">
                {(tourObject.objects?.lat && tourObject.objects?.lng) && (
                  <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    <span>{tourObject.objects.lat}, {tourObject.objects.lng}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 ml-4">
              <Link href={`/dashboard/objects?search=${encodeURIComponent(tourObject.objects?.title || '')}`}>
                <Button variant="outline" size="sm">
                  Edit
                </Button>
              </Link>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onRemove(tourObject.object_id)}
                className="text-red-600 hover:text-red-800"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Card>
  )
}

export default function TourObjectsPage({ params }: { params: Promise<{ id: string }> }) {
  const [tourObjects, setTourObjects] = useState<TourObject[]>([])
  const [availableObjects, setAvailableObjects] = useState<Object[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedObjectId, setSelectedObjectId] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [savingOrder, setSavingOrder] = useState(false)
  const [tourId, setTourId] = useState<string>('')
  const router = useRouter()

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  // Initialize params
  useEffect(() => {
    const initParams = async () => {
      const resolvedParams = await params
      setTourId(resolvedParams.id)
    }
    initParams()
  }, [params])

  // Fetch tour objects
  const fetchTourObjects = async () => {
    if (!tourId) return
    
    try {
      const response = await fetch(`/api/tours/${tourId}/objects`)
      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch tour objects')
      }
      
      setTourObjects(result.data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch tour objects')
    } finally {
      setLoading(false)
    }
  }

  // Fetch available objects (not in this tour)
  const fetchAvailableObjects = async () => {
    try {
      const response = await fetch(`/api/objects`)
      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch objects')
      }
      
      // Filter out objects already in this tour
      const usedObjectIds = tourObjects.map(to => to.object_id)
      const available = (result.data || []).filter((obj: Object) => !usedObjectIds.includes(obj.id))
      setAvailableObjects(available)
    } catch (err) {
      console.error('Failed to fetch available objects:', err)
    }
  }

  // Handle object selection (including create new object option)
  const handleObjectSelection = (value: string) => {
    if (value === 'create-new') {
      router.push('/dashboard/objects')
      return
    }
    setSelectedObjectId(value)
  }

  // Add object to tour
  const addObjectToTour = async () => {
    if (!selectedObjectId || !tourId) return

    try {
      setSubmitting(true)
      const response = await fetch(`/api/tours/${tourId}/objects`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          object_id: parseInt(selectedObjectId),
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to add object to tour')
      }

      // Refresh data
      await fetchTourObjects()
      await fetchAvailableObjects()
      
      // Reset form
      setSelectedObjectId('')
      setIsDialogOpen(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add object to tour')
    } finally {
      setSubmitting(false)
    }
  }

  // Remove object from tour
  const removeObjectFromTour = async (objectId: number) => {
    if (!confirm('Are you sure you want to remove this object from the tour?') || !tourId) return

    try {
      const response = await fetch(`/api/tours/${tourId}/objects/${objectId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const result = await response.json()
        throw new Error(result.error || 'Failed to remove object from tour')
      }

      // Refresh data
      await fetchTourObjects()
      await fetchAvailableObjects()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove object from tour')
    }
  }

  // Handle drag end
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      const oldIndex = tourObjects.findIndex(obj => obj.object_id === active.id)
      const newIndex = tourObjects.findIndex(obj => obj.object_id === over.id)
      
      const newTourObjects = arrayMove(tourObjects, oldIndex, newIndex)
      setTourObjects(newTourObjects)
      
      // Save the new order to the backend
      await saveObjectOrder(newTourObjects)
    }
  }

  // Save object order to backend
  const saveObjectOrder = async (orderedObjects: TourObject[]) => {
    if (!tourId) return

    try {
      setSavingOrder(true)
      const objectOrder = orderedObjects.map(obj => obj.object_id)
      
      const response = await fetch(`/api/tours/${tourId}/objects`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ object_order: objectOrder }),
      })

      if (!response.ok) {
        const result = await response.json()
        throw new Error(result.error || 'Failed to save object order')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save object order')
      // Revert the order on error
      await fetchTourObjects()
    } finally {
      setSavingOrder(false)
    }
  }

  useEffect(() => {
    if (tourId) {
      fetchTourObjects()
    }
  }, [tourId])

  useEffect(() => {
    if (tourObjects.length >= 0) {
      fetchAvailableObjects()
    }
  }, [tourObjects])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-gray-500">Loading tour objects...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Tour Objects</h1>
          <p className="text-muted-foreground">
            Manage objects included in this tour. Drag and drop to reorder.
          </p>
          {savingOrder && (
            <p className="text-sm text-blue-600 mt-1">Saving order...</p>
          )}
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center space-x-2">
              <Plus className="h-4 w-4" />
              <span>Add Object</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add Object to Tour</DialogTitle>
              <DialogDescription>
                Select an object to add to this tour.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Select value={selectedObjectId} onValueChange={handleObjectSelection}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select an object" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableObjects.map((object) => (
                      <SelectItem key={object.id} value={object.id.toString()}>
                        {object.title || `Object ${object.id}`}
                      </SelectItem>
                    ))}
                    <SelectItem value="create-new" className="font-medium text-blue-600">
                      <div className="flex items-center space-x-2">
                        <Plus className="h-4 w-4" />
                        <span>Create New Object</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex justify-end space-x-2 pt-4">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={addObjectToTour} 
                  disabled={!selectedObjectId || submitting}
                >
                  {submitting ? 'Adding...' : 'Add Object'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={tourObjects.map(obj => obj.object_id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-2">
            {tourObjects.map((tourObject) => (
              <SortableObjectCard
                key={tourObject.object_id}
                tourObject={tourObject}
                onRemove={removeObjectFromTour}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {tourObjects.length === 0 && !loading && (
        <div className="text-center py-8">
          <MapPin className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No objects in tour</h3>
          <p className="mt-1 text-sm text-gray-500">
            Get started by adding an object to this tour.
          </p>
        </div>
      )}
    </div>
  )
} 