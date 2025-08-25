'use client'
import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Plus, MapPin, Box, TrendingUp, Clock, Eye, Users } from 'lucide-react'
import Link from 'next/link'

interface DashboardStats {
  tours_count: number
  objects_count: number
  assets_count: number
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    tours_count: 0,
    objects_count: 0,
    assets_count: 0
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/dashboard/stats')
      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch dashboard stats')
      }
      
      setStats(result.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch dashboard stats')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Manage Your Heritage Interactive Experience</h1>
        </div>
        <Link href="/dashboard/tours">
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium flex items-center gap-2 transition-colors">
            <Plus className="w-5 h-5" />
            Create New Tour
          </button>
        </Link>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Tours</p>
              <p className="text-2xl font-bold text-gray-900">
                {loading ? '...' : stats.tours_count}
              </p>
            </div>
            <div className="bg-blue-100 p-3 rounded-full">
              <MapPin className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </Card>
        
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Heritage Objects</p>
              <p className="text-2xl font-bold text-gray-900">
                {loading ? '...' : stats.objects_count}
              </p>
            </div>
            <div className="bg-green-100 p-3 rounded-full">
              <Box className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </Card>
        
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">3D Assets</p>
              <p className="text-2xl font-bold text-gray-900">
                {loading ? '...' : stats.assets_count}
              </p>
            </div>
            <div className="bg-purple-100 p-3 rounded-full">
              <Box className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </Card>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          Error loading dashboard data: {error}
        </div>
      )}

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Tour Creation Workflow */}
        <div className="lg:col-span-2 space-y-6">
          {/* How It Works Section */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">How to Create Digital Heritage Tours</h2>
            
            <div className="space-y-6">
              {/* Step 1 */}
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium">
                  1
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 mb-2">Create Your Tour</h3>
                  <p className="text-gray-600 text-sm mb-3">
                    Start by defining your heritage site or museum tour with a compelling title, description, and location.
                  </p>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <MapPin className="w-4 h-4 text-blue-600" />
                      <span className="text-sm font-medium">Example: &quot;Ancient Roman Forum Virtual Tour&quot;</span>
                    </div>
                    <p className="text-xs text-gray-600">Location: Rome, Italy • Duration: 45 minutes</p>
                  </div>
                </div>
              </div>

              {/* Step 2 */}
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-medium">
                  2
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 mb-2">Add Heritage Objects</h3>
                  <p className="text-gray-600 text-sm mb-3">
                    Include specific locations, artifacts, or exhibits within your tour. Each object represents a stop or point of interest.
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-gray-50 rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-sm font-medium">Temple of Caesar</span>
                      </div>
                      <p className="text-xs text-gray-600">Historical monument</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-sm font-medium">Arch of Titus</span>
                      </div>
                      <p className="text-xs text-gray-600">Triumphal arch</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Step 3 */}
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center text-sm font-medium">
                  3
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 mb-2">Upload Digital Assets</h3>
                  <p className="text-gray-600 text-sm mb-3">
                    Enrich each object with 3D models, historical reconstructions, and interactive content.
                  </p>
                  <div className="space-y-2">
                    <div className="bg-purple-50 rounded-lg p-3 flex items-center gap-3">
                      <Box className="w-8 h-8 text-purple-600" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">e.g. 3D Model: Caesar Statue</p>
                        <p className="text-xs text-gray-600">Historical figure reconstruction</p>
                      </div>
                      <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">Ready</span>
                    </div>
                    <div className="bg-blue-50 rounded-lg p-3 flex items-center gap-3">
                      <Box className="w-8 h-8 text-blue-600" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">e.g. 3D Model: Original Architecture</p>
                        <p className="text-xs text-gray-600">Reconstructed building model</p>
                      </div>
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">Processing</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Right Column - Quick Actions & Assets */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Quick Actions</h2>
            <div className="space-y-3 flex flex-col">
              <Link href="/dashboard/tours">
                <button className="w-full flex items-center gap-3 p-3 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors text-left">
                  <Plus className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="font-medium text-gray-900">Create Tour</p>
                    <p className="text-xs text-gray-600">Start a new heritage tour</p>
                  </div>
                </button>
              </Link>
              
              <Link href="/dashboard/objects">
                <button className="w-full flex items-center gap-3 p-3 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors text-left">
                  <MapPin className="w-5 h-5 text-purple-600" />
                  <div>
                    <p className="font-medium text-gray-900">Manage Objects</p>
                    <p className="text-xs text-gray-600">Edit heritage objects and exhibits</p>
                  </div>
                </button>
              </Link>

              <Link href="/dashboard/tasks">
                <button className="w-full flex items-center gap-3 p-3 bg-orange-50 hover:bg-orange-100 rounded-lg transition-colors text-left">
                  <Box className="w-5 h-5 text-orange-600" />
                  <div>
                    <p className="font-medium text-gray-900">Manage Tasks</p>
                    <p className="text-xs text-gray-600">Add tasks to heritage objects</p>
                  </div>
                </button>
              </Link>

              <Link href="/dashboard/end-users">
                <button className="w-full flex items-center gap-3 p-3 bg-teal-50 hover:bg-teal-100 rounded-lg transition-colors text-left">
                  <Users className="w-5 h-5 text-teal-600" />
                  <div>
                    <p className="font-medium text-gray-900">View End Users</p>
                    <p className="text-xs text-gray-600">Monitor mobile app users</p>
                  </div>
                </button>
              </Link>
            </div>
          </Card>

        </div>
      </div>
    </div>
  )
} 