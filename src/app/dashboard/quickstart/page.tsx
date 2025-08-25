import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default function QuickstartPage() {
  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Quickstart</h1>
        <p className="text-gray-600 mt-2">
          Get up and running with the Heritage Platform in just a few steps
        </p>
      </div>

      {/* Steps */}
      <div className="space-y-6">
        <Card className="p-6">
          <div className="flex items-start space-x-4">
            <div className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-semibold">
              1
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Install the SDK</h3>
              <p className="text-gray-600 mb-4">
                Install the Heritage Platform SDK using your preferred package manager.
              </p>
              <div className="bg-gray-50 rounded-lg p-4 font-mono text-sm">
                npm install heritage-platform
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-start space-x-4">
            <div className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-semibold">
              2
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Set up authentication</h3>
              <p className="text-gray-600 mb-4">
                Configure your API keys to start making authenticated requests.
              </p>
              <Button variant="outline">Get API Key</Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
} 