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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Task } from '@/types/tasks'
import { Object } from '@/types/objects'
import { Plus, Edit, Trash2, Box } from 'lucide-react'
import { ImageUpload } from '@/components/ui/image-upload'

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [objects, setObjects] = useState<Object[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [formData, setFormData] = useState({ 
    object_id: '', 
    title: '', 
    description: '', 
    thumbnail_url: null as string | null,
    detailed_img_url: null as string | null
  })
  const [submitting, setSubmitting] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedObjectFilter, setSelectedObjectFilter] = useState<string>('all')

  // Fetch tasks
  const fetchTasks = async (objectId?: string) => {
    try {
      setLoading(true)
      const url = objectId && objectId !== 'all' 
        ? `/api/tasks?object_id=${objectId}` 
        : '/api/tasks'
      
      const response = await fetch(url)
      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch tasks')
      }
      
      setTasks(result.data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch tasks')
    } finally {
      setLoading(false)
    }
  }

  // Fetch objects
  const fetchObjects = async () => {
    try {
      const response = await fetch('/api/objects')
      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch objects')
      }
      
      setObjects(result.data || [])
    } catch (err) {
      console.error('Error fetching objects:', err)
    }
  }

  // Create task
  const createTask = async () => {
    if (!formData.title.trim() || !formData.object_id) return

    try {
      setSubmitting(true)
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          object_id: parseInt(formData.object_id),
          title: formData.title,
          description: formData.description,
          thumbnail_url: formData.thumbnail_url,
          detailed_img_url: formData.detailed_img_url
        }),
      })
      
      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to create task')
      }
      
      setTasks([result.data, ...tasks])
      setIsDialogOpen(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create task')
    } finally {
      setSubmitting(false)
    }
  }

  // Update task
  const updateTask = async () => {
    if (!editingTask || !formData.title.trim()) return

    try {
      setSubmitting(true)
      const response = await fetch(`/api/tasks/${editingTask.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          title: formData.title,
          description: formData.description,
          thumbnail_url: formData.thumbnail_url,
          detailed_img_url: formData.detailed_img_url
        }),
      })
      
      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to update task')
      }
      
      setTasks(tasks.map(task => 
        task.id === editingTask.id ? result.data : task
      ))
      setIsDialogOpen(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update task')
    } finally {
      setSubmitting(false)
    }
  }

  // Delete task
  const deleteTask = async (id: number) => {
    if (!confirm('Are you sure you want to delete this task?')) return

    try {
      const response = await fetch(`/api/tasks/${id}`, {
        method: 'DELETE',
      })
      
      if (!response.ok) {
        const result = await response.json()
        throw new Error(result.error || 'Failed to delete task')
      }
      
      setTasks(tasks.filter(task => task.id !== id))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete task')
    }
  }

  // Handle create click
  const handleCreate = () => {
    setEditingTask(null)
    setFormData({ object_id: '', title: '', description: '', thumbnail_url: null, detailed_img_url: null })
    setIsDialogOpen(true)
  }
  
  // Handle edit click
  const handleEdit = (task: Task) => {
    setEditingTask(task)
    setFormData({ 
      object_id: task.object_id.toString(),
      title: task.title || '', 
      description: task.description || '',
      thumbnail_url: task.thumbnail_url,
      detailed_img_url: task.detailed_img_url
    })
    setIsDialogOpen(true)
  }

  // Handle form submit
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (editingTask) {
      updateTask()
    } else {
      createTask()
    }
  }

  // Handle filter change
  const handleFilterChange = (value: string) => {
    setSelectedObjectFilter(value)
    fetchTasks(value)
  }

  const onDialogOpenChange = (open: boolean) => {
    if (!open) {
      setEditingTask(null)
      setFormData({ object_id: '', title: '', description: '', thumbnail_url: null, detailed_img_url: null })
    }
    setIsDialogOpen(open)
  }

  // Get object title by ID
  const getObjectTitle = (objectId: number) => {
    const object = objects.find(obj => obj.id === objectId)
    return object?.title || `Object ${objectId}`
  }

  useEffect(() => {
    fetchTasks()
    fetchObjects()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-gray-500">Loading tasks...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Tasks</h1>
          <p className="text-gray-600 mt-1">Manage tasks for heritage objects</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={onDialogOpenChange}>
          <DialogTrigger asChild>
            <Button 
              onClick={handleCreate}
              className="flex items-center space-x-2"
            >
              <Plus className="h-4 w-4" />
              <span>New Task</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingTask ? 'Edit Task' : 'Create New Task'}</DialogTitle>
              <DialogDescription>
                {editingTask ? 'Update task information.' : 'Add a new task to a heritage object.'}
                {' '}Click save when you are done.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-6">
              {!editingTask && (
                <div>
                  <Label htmlFor="object_id">Heritage Object</Label>
                  <Select 
                    value={formData.object_id} 
                    onValueChange={(value) => setFormData({ ...formData, object_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select an object" />
                    </SelectTrigger>
                    <SelectContent>
                      {objects.map((object) => (
                        <SelectItem key={object.id} value={object.id.toString()}>
                          {object.title || `Object ${object.id}`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div>
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Enter task title"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="description">Description</Label>
                <textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Enter task description (optional)"
                  className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-y"
                />
              </div>

              <ImageUpload
                value={formData.thumbnail_url}
                onChange={(url) => setFormData({ ...formData, thumbnail_url: url })}
                folder="tasks"
                label="Task Thumbnail"
                disabled={submitting}
              />

              <ImageUpload
                value={formData.detailed_img_url}
                onChange={(url) => setFormData({ ...formData, detailed_img_url: url })}
                folder="tasks"
                label="Detailed Image"
                disabled={submitting}
              />
              
              <div className="flex justify-end space-x-2 pt-4">
                <Button type="button" variant="outline" onClick={() => onDialogOpenChange(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting || (!editingTask && !formData.object_id)}>
                  {submitting ? 'Saving...' : (editingTask ? 'Update Task' : 'Create Task')}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filter by Object */}
      <div className="flex items-center gap-4">
        <Label htmlFor="object-filter">Filter by Object:</Label>
        <Select value={selectedObjectFilter} onValueChange={handleFilterChange}>
          <SelectTrigger className="w-[300px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Objects</SelectItem>
            {objects.map((object) => (
              <SelectItem key={object.id} value={object.id.toString()}>
                {object.title || `Object ${object.id}`}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Tasks List */}
      <Card>
        <CardHeader>
          <CardTitle>All Tasks</CardTitle>
          <CardDescription>
            {tasks.length} {tasks.length === 1 ? 'task' : 'tasks'} total
            {selectedObjectFilter !== 'all' && (
              <span> for {getObjectTitle(parseInt(selectedObjectFilter))}</span>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {tasks.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No tasks found. Create your first task to get started.
            </div>
          ) : (
            <div className="space-y-4">
              {tasks.map((task) => (
                <div key={task.id} className="border border-gray-200 rounded-lg p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex space-x-4 flex-1">
                      {/* Thumbnail */}
                      {task.thumbnail_url && (
                        <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                          <img
                            src={task.thumbnail_url}
                            alt={task.title || 'Task thumbnail'}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {task.title || 'Untitled'}
                          </h3>
                          <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">
                            ID: {task.id}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 mb-2">
                          <Box className="w-4 h-4 text-gray-500" />
                          <span className="text-sm text-gray-600">
                            Object: {getObjectTitle(task.object_id)}
                          </span>
                        </div>
                        
                        {task.description && (
                          <p className="text-gray-600 mb-3 leading-relaxed">
                            {task.description}
                          </p>
                        )}

                        {/* Show detailed image if available */}
                        {task.detailed_img_url && (
                          <div className="mb-3">
                            <p className="text-sm text-gray-500 mb-2">Detailed Image:</p>
                            <div className="w-32 h-32 rounded-lg overflow-hidden bg-gray-100">
                              <img
                                src={task.detailed_img_url}
                                alt={`${task.title || 'Task'} detailed image`}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          </div>
                        )}
                        
                        <div className="text-sm text-gray-500">
                          Created: {new Date(task.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2 ml-4">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(task)}
                        className="flex items-center space-x-1"
                      >
                        <Edit className="h-3 w-3" />
                        <span>Edit</span>
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => deleteTask(task.id)}
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