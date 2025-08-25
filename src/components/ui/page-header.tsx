import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { ReactNode } from "react"

interface PageHeaderProps {
  title: string
  description?: string
  backButton?: {
    href: string
    label: string
  }
  actions?: ReactNode
}

export function PageHeader({ title, description, backButton, actions }: PageHeaderProps) {
  return (
    <div className="space-y-6">
      {/* Navigation Bar */}
      {backButton && (
        <div className="pb-2 border-b border-gray-100">
          <Link href={backButton.href}>
            <Button variant="ghost" size="sm" className="text-gray-600 hover:text-gray-900 -ml-2">
              <ArrowLeft className="h-4 w-4 mr-2" />
              {backButton.label}
            </Button>
          </Link>
        </div>
      )}

      {/* Page Header */}
      <div className={`${actions ? 'flex items-start justify-between' : ''}`}>
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
          {description && (
            <p className="text-lg text-gray-600">{description}</p>
          )}
        </div>
        
        {actions && (
          <div className="flex-shrink-0">
            {actions}
          </div>
        )}
      </div>
    </div>
  )
} 