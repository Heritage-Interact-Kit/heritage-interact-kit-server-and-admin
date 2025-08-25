'use client'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Search, FileText, Users, TrendingUp, ChevronLeft, ChevronRight, Image, Eye, Calendar, X, Download } from 'lucide-react'
import { SubmissionWithDetails } from '@/types/submissions'

interface SubmissionStats {
  total_submissions: number
  submissions_this_month: number
  unique_submitters: number
}

interface PaginationInfo {
  page: number
  limit: number
  total: number
  totalPages: number
}

interface ObjectOption {
  id: number
  title: string | null
}

interface TaskOption {
  id: number
  title: string | null
  object_id: number
}

export default function SubmissionsPage() {
  const [submissions, setSubmissions] = useState<SubmissionWithDetails[]>([])
  const [stats, setStats] = useState<SubmissionStats>({
    total_submissions: 0,
    submissions_this_month: 0,
    unique_submitters: 0
  })
  const [objects, setObjects] = useState<ObjectOption[]>([])
  const [tasks, setTasks] = useState<TaskOption[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [taskFilter, setTaskFilter] = useState<string>('all')
  const [objectFilter, setObjectFilter] = useState<string>('all')
  const [userFilter, setUserFilter] = useState<string>('all')
  const [sortBy, setSortBy] = useState('created_at')
  const [sortOrder, setSortOrder] = useState('desc')
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  })
  const [expandedSubmission, setExpandedSubmission] = useState<number | null>(null)
  const [isExporting, setIsExporting] = useState(false)

  useEffect(() => {
    fetchStats()
    fetchObjects()
    fetchTasks()
  }, [])

  useEffect(() => {
    fetchSubmissions()
  }, [search, taskFilter, objectFilter, userFilter, sortBy, sortOrder, pagination.page])

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/admin/submissions/stats')
      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch stats')
      }
      
      setStats(result.data)
    } catch (err) {
      console.error('Error fetching stats:', err)
    }
  }

  const fetchObjects = async () => {
    try {
      const response = await fetch('/api/objects')
      const result = await response.json()
      
      if (response.ok) {
        setObjects(result.data || [])
      }
    } catch (err) {
      console.error('Error fetching objects:', err)
    }
  }

  const fetchTasks = async () => {
    try {
      const response = await fetch('/api/tasks')
      const result = await response.json()
      
      if (response.ok) {
        setTasks(result.data || [])
      }
    } catch (err) {
      console.error('Error fetching tasks:', err)
    }
  }

  const fetchSubmissions = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        search,
        sort_by: sortBy,
        sort_order: sortOrder,
      })

      if (taskFilter !== 'all') {
        params.append('task_id', taskFilter)
      }

      if (objectFilter !== 'all') {
        params.append('object_id', objectFilter)
      }

      if (userFilter !== 'all') {
        params.append('end_user_id', userFilter)
      }

      const response = await fetch(`/api/admin/submissions?${params}`)
      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch submissions')
      }
      
      setSubmissions(result.data || [])
      setPagination(result.pagination)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch submissions')
    } finally {
      setLoading(false)
    }
  }

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setPagination(prev => ({ ...prev, page: 1 }))
  }

  const handlePageChange = (newPage: number) => {
    setPagination(prev => ({ ...prev, page: newPage }))
  }

  const clearTaskFilter = () => {
    setTaskFilter('all')
    setPagination(prev => ({ ...prev, page: 1 }))
  }

  const clearObjectFilter = () => {
    setObjectFilter('all')
    setPagination(prev => ({ ...prev, page: 1 }))
  }

  const clearAllFilters = () => {
    setTaskFilter('all')
    setObjectFilter('all')
    setUserFilter('all')
    setSearch('')
    setPagination(prev => ({ ...prev, page: 1 }))
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getUserDisplayName = (submission: SubmissionWithDetails) => {
    if (!submission.end_user) return 'Unknown User'
    const user = submission.end_user
    if (user.display_name) return user.display_name
    if (user.first_name && user.last_name) return `${user.first_name} ${user.last_name}`
    if (user.first_name) return user.first_name
    if (user.username) return user.username
    return user.email
  }

  const getTaskDisplayName = (submission: SubmissionWithDetails) => {
    if (!submission.task) return 'Unknown Task'
    return submission.task.title || `Task ${submission.task.id}`
  }

  const getObjectDisplayName = (submission: SubmissionWithDetails) => {
    if (!submission.object) return 'Unknown Object'
    return submission.object.title || `Object ${submission.object.id}`
  }

  const toggleExpanded = (submissionId: number) => {
    setExpandedSubmission(expandedSubmission === submissionId ? null : submissionId)
  }

  const convertToCSV = (data: SubmissionWithDetails[]) => {
    const headers = [
      'Submission ID',
      'Task ID',
      'Task Title',
      'Object ID',
      'Object Title',
      'User ID',
      'User Email',
      'User Display Name',
      'Remarks',
      'Number of Files',
      'Submitted Files URLs',
      'Created At',
      'Updated At'
    ]

    const rows = data.map(submission => [
      submission.id,
      submission.task_id,
      submission.task?.title || '',
      submission.object_id,
      submission.object?.title || '',
      submission.end_user_id,
      submission.end_user?.email || '',
      getUserDisplayName(submission),
      submission.remarks || '',
      submission.submitted_files?.length || 0,
      submission.submitted_files?.join('; ') || '',
      formatDate(submission.created_at),
      formatDate(submission.updated_at)
    ])

    // Escape CSV values and handle commas, quotes, and newlines
    const escapeCSV = (value: string | number | null | undefined) => {
      if (value === null || value === undefined) return ''
      const str = String(value)
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`
      }
      return str
    }

    const csvContent = [
      headers.map(escapeCSV).join(','),
      ...rows.map(row => row.map(escapeCSV).join(','))
    ].join('\n')

    return csvContent
  }

  const downloadCSV = (csvContent: string, filename: string) => {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = filename
    link.click()
    URL.revokeObjectURL(link.href)
  }

  const handleExportCSV = async () => {
    try {
      setIsExporting(true)
      
      // Fetch all submissions without pagination for export
      const params = new URLSearchParams({
        search,
        sort_by: sortBy,
        sort_order: sortOrder,
        limit: '9999' // Get all results
      })

      if (taskFilter !== 'all') {
        params.append('task_id', taskFilter)
      }

      if (objectFilter !== 'all') {
        params.append('object_id', objectFilter)
      }

      if (userFilter !== 'all') {
        params.append('end_user_id', userFilter)
      }

      const response = await fetch(`/api/admin/submissions?${params}`)
      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch submissions for export')
      }
      
      const allSubmissions = result.data || []
      const csvContent = convertToCSV(allSubmissions)
      const timestamp = new Date().toISOString().split('T')[0]
      const filename = `submissions_export_${timestamp}.csv`
      
      downloadCSV(csvContent, filename)
    } catch (err) {
      console.error('Error exporting CSV:', err)
      setError(err instanceof Error ? err.message : 'Failed to export submissions')
    } finally {
      setIsExporting(false)
    }
  }

  // Get active filter count
  const activeFilterCount = [
    taskFilter !== 'all',
    objectFilter !== 'all',
    userFilter !== 'all',
    search.trim() !== ''
  ].filter(Boolean).length

  if (loading && submissions.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-gray-500">Loading submissions...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Submissions</h1>
          <p className="text-gray-600 mt-1">View and manage user task submissions</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={handleExportCSV}
            disabled={isExporting}
            className="flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            {isExporting ? 'Exporting...' : 'Export CSV'}
          </Button>
          {activeFilterCount > 0 && (
            <Button
              variant="outline"
              onClick={clearAllFilters}
              className="flex items-center gap-2"
            >
              <X className="w-4 h-4" />
              Clear All Filters ({activeFilterCount})
            </Button>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Submissions</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total_submissions}</p>
            </div>
            <div className="bg-blue-100 p-3 rounded-full">
              <FileText className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </Card>
        
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">This Month</p>
              <p className="text-2xl font-bold text-gray-900">{stats.submissions_this_month}</p>
            </div>
            <div className="bg-green-100 p-3 rounded-full">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </Card>
        
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Unique Submitters</p>
              <p className="text-2xl font-bold text-gray-900">{stats.unique_submitters}</p>
            </div>
            <div className="bg-purple-100 p-3 rounded-full">
              <Users className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card className="p-6">
        <div className="flex flex-col gap-4">
          <form onSubmit={handleSearchSubmit} className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search by remarks..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
          </form>
          
          <div className="flex flex-wrap gap-4">
            <Select value={taskFilter} onValueChange={setTaskFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filter by Task" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Tasks</SelectItem>
                {tasks.map((task) => (
                  <SelectItem key={task.id} value={task.id.toString()}>
                    {task.title || `Task ${task.id}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={objectFilter} onValueChange={setObjectFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filter by Object" />
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

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="created_at">Date Created</SelectItem>
                <SelectItem value="updated_at">Date Updated</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sortOrder} onValueChange={setSortOrder}>
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="Order" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="desc">Descending</SelectItem>
                <SelectItem value="asc">Ascending</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Active Filters Display */}
          {(taskFilter !== 'all' || objectFilter !== 'all') && (
            <div className="flex flex-wrap gap-2">
              {taskFilter !== 'all' && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  Task: {tasks.find(task => task.id.toString() === taskFilter)?.title || `Task ${taskFilter}`}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearTaskFilter}
                    className="h-4 w-4 p-0 hover:bg-gray-300"
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </Badge>
              )}
              {objectFilter !== 'all' && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  Object: {objects.find(obj => obj.id.toString() === objectFilter)?.title || `Object ${objectFilter}`}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearObjectFilter}
                    className="h-4 w-4 p-0 hover:bg-gray-300"
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </Badge>
              )}
            </div>
          )}
        </div>
      </Card>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Submissions List */}
      <Card>
        <CardHeader>
          <CardTitle>Submissions ({pagination.total})</CardTitle>
          <CardDescription>
            Showing {submissions.length} of {pagination.total} submissions
            {(taskFilter !== 'all' || objectFilter !== 'all') && (
              <span className="ml-2 text-blue-600">
                • Filtered results
              </span>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {submissions.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No submissions found matching your criteria.
            </div>
          ) : (
            <div className="space-y-4">
              {submissions.map((submission) => (
                <div key={submission.id} className="border border-gray-200 rounded-lg p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-3">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {getTaskDisplayName(submission)}
                        </h3>
                        <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">
                          ID: {submission.id}
                        </span>
                        {submission.submitted_files && submission.submitted_files.length > 0 && (
                          <Badge variant="outline" className="flex items-center gap-1">
                            <Image className="w-3 h-3" />
                            {submission.submitted_files.length} file{submission.submitted_files.length !== 1 ? 's' : ''}
                          </Badge>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600 mb-3">
                        <div>
                          <strong>Object:</strong> {getObjectDisplayName(submission)}
                        </div>
                        <div>
                          <strong>Submitted by:</strong> {getUserDisplayName(submission)}
                        </div>
                        <div>
                          <strong>Email:</strong> {submission.end_user?.email || 'N/A'}
                        </div>
                      </div>

                      {submission.remarks && (
                        <div className="mb-3">
                          <p className="text-sm font-medium text-gray-700 mb-1">Remarks:</p>
                          <p className="text-gray-600 bg-gray-50 p-3 rounded leading-relaxed">
                            {expandedSubmission === submission.id || submission.remarks.length <= 200
                              ? submission.remarks
                              : `${submission.remarks.substring(0, 200)}...`}
                          </p>
                          {submission.remarks.length > 200 && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleExpanded(submission.id)}
                              className="mt-2 p-0 h-auto text-blue-600 hover:text-blue-700"
                            >
                              {expandedSubmission === submission.id ? 'Show less' : 'Show more'}
                            </Button>
                          )}
                        </div>
                      )}

                      {/* Submitted Files */}
                      {submission.submitted_files && submission.submitted_files.length > 0 && (
                        <div className="mb-3">
                          <p className="text-sm font-medium text-gray-700 mb-2">Submitted Files:</p>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                            {submission.submitted_files.map((fileUrl, index) => (
                              <div key={index} className="relative">
                                <img
                                  src={fileUrl}
                                  alt={`Submission file ${index + 1}`}
                                  className="w-full h-20 object-contain rounded border"
                                />
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => window.open(fileUrl, '_blank')}
                                  className="absolute top-1 right-1 bg-white/80 hover:bg-white p-1 h-6 w-6"
                                >
                                  <Eye className="w-3 h-3" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      <div className="flex items-center gap-6 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          <strong>Created:</strong> {formatDate(submission.created_at)}
                        </span>
                        {submission.updated_at !== submission.created_at && (
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            <strong>Updated:</strong> {formatDate(submission.updated_at)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between mt-6 pt-6 border-t">
              <div className="text-sm text-gray-500">
                Page {pagination.page} of {pagination.totalPages}
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page <= 1}
                >
                  <ChevronLeft className="w-4 h-4" />
                  Previous
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page >= pagination.totalPages}
                >
                  Next
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 