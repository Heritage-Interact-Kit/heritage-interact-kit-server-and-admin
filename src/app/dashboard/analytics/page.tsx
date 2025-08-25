import { Card } from '@/components/ui/card'

export default function AnalyticsPage() {
  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
        <p className="text-gray-600 mt-2">
          Monitor your platform usage and performance metrics
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="text-2xl font-bold text-gray-900">1,234</div>
          <div className="text-sm text-gray-600 mt-1">Total Requests</div>
          <div className="text-xs text-green-600 mt-2">+12% from last month</div>
        </Card>

        <Card className="p-6">
          <div className="text-2xl font-bold text-gray-900">89%</div>
          <div className="text-sm text-gray-600 mt-1">Success Rate</div>
          <div className="text-xs text-green-600 mt-2">+3% from last month</div>
        </Card>

        <Card className="p-6">
          <div className="text-2xl font-bold text-gray-900">2.4s</div>
          <div className="text-sm text-gray-600 mt-1">Avg Response Time</div>
          <div className="text-xs text-red-600 mt-2">+0.2s from last month</div>
        </Card>

        <Card className="p-6">
          <div className="text-2xl font-bold text-gray-900">567</div>
          <div className="text-sm text-gray-600 mt-1">Active Users</div>
          <div className="text-xs text-green-600 mt-2">+8% from last month</div>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Request Volume</h3>
          <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
            <div className="text-gray-500">Chart placeholder</div>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Response Times</h3>
          <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
            <div className="text-gray-500">Chart placeholder</div>
          </div>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
        <div className="space-y-4">
          {[
            { time: "2 minutes ago", action: "API request completed", status: "success" },
            { time: "5 minutes ago", action: "New user registered", status: "info" },
            { time: "12 minutes ago", action: "Heritage story generated", status: "success" },
            { time: "23 minutes ago", action: "Rate limit exceeded", status: "warning" },
          ].map((activity, index) => (
            <div key={index} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
              <div>
                <div className="text-sm font-medium text-gray-900">{activity.action}</div>
                <div className="text-xs text-gray-500">{activity.time}</div>
              </div>
              <div className={`px-2 py-1 text-xs rounded-full ${
                activity.status === 'success' ? 'bg-green-100 text-green-700' :
                activity.status === 'warning' ? 'bg-yellow-100 text-yellow-700' :
                'bg-blue-100 text-blue-700'
              }`}>
                {activity.status}
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
} 