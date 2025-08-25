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
import { Badge } from '@/components/ui/badge'
import { Reward, RewardWithRelations } from '@/types/rewards'
import { Task } from '@/types/tasks'
import { Object } from '@/types/objects'
import { Plus, Edit, Trash2, Gift, Target, Box } from 'lucide-react'
import { ImageUpload } from '@/components/ui/image-upload'

export default function RewardsPage() {
  const [rewards, setRewards] = useState<RewardWithRelations[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [objects, setObjects] = useState<Object[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editingReward, setEditingReward] = useState<RewardWithRelations | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    thumbnail_url: null as string | null,
    reward_type: 'badge' as 'badge' | 'points' | 'item' | 'digital_content',
    reward_value: {} as Record<string, string | number | boolean | null>,
    link_type: '' as 'task' | 'object' | '',
    task_id: '',
    object_id: '',
    is_active: true
  })

  // Show success/error messages
  const showMessage = (message: string, type: 'success' | 'error' = 'success') => {
    if (type === 'error') {
      console.error(message)
      alert('Error: ' + message)
    } else {
      console.log(message)
    }
  }

  // Fetch rewards
  const fetchRewards = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/rewards')
      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch rewards')
      }
      
      setRewards(result.data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch rewards')
      showMessage('Failed to fetch rewards', 'error')
    } finally {
      setLoading(false)
    }
  }

  // Fetch tasks for dropdown
  const fetchTasks = async () => {
    try {
      const response = await fetch('/api/tasks')
      const result = await response.json()
      
      if (response.ok) {
        setTasks(result.data || [])
      }
    } catch (err) {
      console.error('Failed to fetch tasks:', err)
    }
  }

  // Fetch objects for dropdown
  const fetchObjects = async () => {
    try {
      const response = await fetch('/api/objects')
      const result = await response.json()
      
      if (response.ok) {
        setObjects(result.data || [])
      }
    } catch (err) {
      console.error('Failed to fetch objects:', err)
    }
  }

  // Create reward
  const createReward = async () => {
    try {
      setSubmitting(true)
      
      const payload = {
        title: formData.title,
        description: formData.description,
        thumbnail_url: formData.thumbnail_url,
        reward_type: formData.reward_type,
        reward_value: formData.reward_value,
        task_id: formData.link_type === 'task' ? parseInt(formData.task_id) : undefined,
        object_id: formData.link_type === 'object' ? parseInt(formData.object_id) : undefined,
        is_active: formData.is_active
      }

      const response = await fetch('/api/rewards', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create reward')
      }

      showMessage('Reward created successfully')
      fetchRewards()
      setIsDialogOpen(false)
      resetForm()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create reward'
      setError(message)
      showMessage(message, 'error')
    } finally {
      setSubmitting(false)
    }
  }

  // Update reward
  const updateReward = async () => {
    if (!editingReward) return

    try {
      setSubmitting(true)
      
      const payload = {
        title: formData.title,
        description: formData.description,
        thumbnail_url: formData.thumbnail_url,
        reward_type: formData.reward_type,
        reward_value: formData.reward_value,
        task_id: formData.link_type === 'task' ? parseInt(formData.task_id) : undefined,
        object_id: formData.link_type === 'object' ? parseInt(formData.object_id) : undefined,
        is_active: formData.is_active
      }

      const response = await fetch(`/api/rewards/${editingReward.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update reward')
      }

      showMessage('Reward updated successfully')
      fetchRewards()
      setIsDialogOpen(false)
      resetForm()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update reward'
      setError(message)
      showMessage(message, 'error')
    } finally {
      setSubmitting(false)
    }
  }

  // Delete reward
  const deleteReward = async (id: number) => {
    if (!confirm('Are you sure you want to delete this reward?')) return

    try {
      const response = await fetch(`/api/rewards/${id}`, {
        method: 'DELETE',
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to delete reward')
      }

      showMessage('Reward deleted successfully')
      fetchRewards()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete reward'
      setError(message)
      showMessage(message, 'error')
    }
  }

  // Reset form
  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      thumbnail_url: null,
      reward_type: 'badge',
      reward_value: {},
      link_type: '',
      task_id: '',
      object_id: '',
      is_active: true
    })
    setEditingReward(null)
  }

  // Handle create click
  const handleCreate = () => {
    resetForm()
    setIsDialogOpen(true)
  }

  // Handle edit click
  const handleEdit = (reward: RewardWithRelations) => {
    setEditingReward(reward)
    setFormData({
      title: reward.title || '',
      description: reward.description || '',
      thumbnail_url: reward.thumbnail_url,
      reward_type: reward.reward_type,
      reward_value: reward.reward_value || {},
      link_type: reward.task_id ? 'task' : 'object',
      task_id: reward.task_id?.toString() || '',
      object_id: reward.object_id?.toString() || '',
      is_active: reward.is_active
    })
    setIsDialogOpen(true)
  }

  // Handle form submit
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (editingReward) {
      updateReward()
    } else {
      createReward()
    }
  }

  const onDialogOpenChange = (open: boolean) => {
    if (!open) {
      resetForm()
    }
    setIsDialogOpen(open)
  }

  // Get reward type badge color
  const getRewardTypeBadge = (type: string) => {
    const colors = {
      badge: 'bg-blue-100 text-blue-800',
      points: 'bg-green-100 text-green-800',
      item: 'bg-purple-100 text-purple-800',
      digital_content: 'bg-orange-100 text-orange-800'
    }
    return colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-800'
  }

  // Get task or object title
  const getLinkedItemTitle = (reward: RewardWithRelations) => {
    if (reward.task) {
      return `Task: ${reward.task.title || `Task ${reward.task.id}`}`
    }
    if (reward.object) {
      return `Object: ${reward.object.title || `Object ${reward.object.id}`}`
    }
    return 'Unknown'
  }

  useEffect(() => {
    fetchRewards()
    fetchTasks()
    fetchObjects()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-gray-500">Loading rewards...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Rewards</h1>
          <p className="text-muted-foreground">
            Manage rewards that users can earn from tasks or claim from objects
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={onDialogOpenChange}>
          <DialogTrigger asChild>
            <Button onClick={handleCreate}>
              <Plus className="mr-2 h-4 w-4" />
              Add Reward
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingReward ? 'Edit Reward' : 'Create New Reward'}
              </DialogTitle>
              <DialogDescription>
                {editingReward 
                  ? 'Update the reward details below' 
                  : 'Create a new reward that can be earned from tasks or claimed from objects'
                }
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  placeholder="Enter reward title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <textarea
                  id="description"
                  placeholder="Enter reward description"
                  value={formData.description}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-y"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="link_type">Link To *</Label>
                <Select 
                  value={formData.link_type} 
                  onValueChange={(value) => setFormData(prev => ({ 
                    ...prev, 
                    link_type: value as 'task' | 'object',
                    task_id: value === 'task' ? prev.task_id : '',
                    object_id: value === 'object' ? prev.object_id : ''
                  }))}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select what to link this reward to" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="task">Task (Auto-assigned on completion)</SelectItem>
                    <SelectItem value="object">Object (User can claim directly)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {formData.link_type === 'task' && (
                <div className="space-y-2">
                  <Label htmlFor="task_id">Task *</Label>
                  <Select 
                    value={formData.task_id} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, task_id: value }))}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a task" />
                    </SelectTrigger>
                    <SelectContent>
                      {tasks.map((task) => (
                        <SelectItem key={task.id} value={task.id.toString()}>
                          {task.title || `Task ${task.id}`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {formData.link_type === 'object' && (
                <div className="space-y-2">
                  <Label htmlFor="object_id">Object *</Label>
                  <Select 
                    value={formData.object_id} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, object_id: value }))}
                    required
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

              <div className="space-y-2">
                <Label htmlFor="thumbnail">Thumbnail Image</Label>
                <ImageUpload
                  value={formData.thumbnail_url}
                  onChange={(url) => setFormData(prev => ({ ...prev, thumbnail_url: url }))}
                  folder="rewards"
                  disabled={submitting}
                />
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
                />
                <Label htmlFor="is_active">Active</Label>
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting ? 'Saving...' : (editingReward ? 'Update' : 'Create')}
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

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {rewards.map((reward) => (
          <Card key={reward.id}>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-lg">{reward.title}</CardTitle>
                  {reward.description && (
                    <p className="text-sm text-muted-foreground">
                      {reward.description}
                    </p>
                  )}
                  <div className="flex items-center space-x-2">
                    {/* <Badge className={getRewardTypeBadge(reward.reward_type)}>
                      {reward.reward_type}
                    </Badge> */}
                    {!reward.is_active && (
                      <Badge variant="secondary">Inactive</Badge>
                    )}
                  </div>
                </div>
                <div className="flex space-x-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEdit(reward)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteReward(reward.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">                
                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                  {reward.task_id ? (
                    <Target className="h-4 w-4" />
                  ) : (
                    <Box className="h-4 w-4" />
                  )}
                  <span>{getLinkedItemTitle(reward)}</span>
                </div>

                {reward.user_rewards_count !== undefined && (
                  <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                    <Gift className="h-4 w-4" />
                    <span>{reward.user_rewards_count} claimed</span>
                  </div>
                )}

                {reward.thumbnail_url && (
                  <div className="mt-2">
                    <img 
                      src={reward.thumbnail_url} 
                      alt={reward.title}
                      className="w-full h-24 bg-gray-100 rounded object-contain"
                    />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {rewards.length === 0 && !loading && (
        <div className="text-center py-8">
          <Gift className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No rewards</h3>
          <p className="mt-1 text-sm text-gray-500">
            Get started by creating a new reward.
          </p>
        </div>
      )}
    </div>
  )
} 