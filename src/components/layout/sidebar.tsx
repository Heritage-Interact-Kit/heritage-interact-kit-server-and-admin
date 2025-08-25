'use client'

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { 
  Search, 
  Home, 
  FileText, 
  Settings, 
  HelpCircle, 
  Users,
  BarChart3,
  CreditCard,
  Book,
  Code,
  Zap,
  MapPin,
  CheckSquare,
  Box,
  Gift
} from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { SiteSettings } from '@/types/site-settings'
import appConfig from '../../../app.config'

interface SidebarProps {
  className?: string
}

const navigationSections = [
  {
    title: "GET STARTED",
    items: [
      { name: "Overview", href: "/dashboard", icon: Home },
      // { name: "Quickstart", href: "/dashboard/quickstart", icon: Zap },
    ]
  },
  {
    title: "CORE FEATURES",
    items: [
      { name: "Tours", href: "/dashboard/tours", icon: MapPin },
      { name: "Objects", href: "/dashboard/objects", icon: Box },
      { name: "Tasks", href: "/dashboard/tasks", icon: CheckSquare },
      { name: "Rewards", href: "/dashboard/rewards", icon: Gift },
      { name: "Submissions", href: "/dashboard/submissions", icon: FileText },
      { name: "End Users", href: "/dashboard/end-users", icon: Users },
      // { name: "Settings", href: "/dashboard/settings", icon: Settings },
      // { name: "Analytics", href: "/dashboard/analytics", icon: BarChart3 },
    ]
  }
]

export function Sidebar({ className }: SidebarProps) {
  const [siteSettings, setSiteSettings] = useState<SiteSettings | null>(null)
  const [loading, setLoading] = useState(true)

  // Fetch site settings
  const fetchSiteSettings = async () => {
    try {
      const response = await fetch('/api/site-settings')
      const result = await response.json()
      
      if (response.ok) {
        setSiteSettings(result.data)
      }
    } catch (error) {
      console.error('Failed to fetch site settings:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSiteSettings()
  }, [])

  return (
    <div className={`w-64 bg-white border-r border-gray-200 h-full flex flex-col ${className}`}>
      {/* Logo */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0 relative w-8 h-8">
            {loading ? (
              <div className="w-8 h-8 bg-gray-200 rounded animate-pulse" />
            ) : (
              <Image
                src={appConfig.appLogo}
                alt={appConfig.appName}
                width={32}
                height={32}
                className="rounded"
              />
            )}
          </div>
          <div className="flex-1 min-w-0">
            {loading ? (
              <div className="h-4 bg-gray-200 rounded animate-pulse" />
            ) : (
              <h1 className="text-sm font-semibold text-gray-900">
                {appConfig.appName}
              </h1>
            )}
          </div>
        </div>
      </div>

      {/* Search */}
      {/* <div className="p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input 
            placeholder="Search" 
            className="pl-10 bg-gray-50 border-gray-200"
          />
          <kbd className="absolute right-3 top-1/2 transform -translate-y-1/2 text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded border">
            ⌘K
          </kbd>
        </div>
      </div> */}

      {/* Navigation */}
      <nav className="flex-1 px-4 py-4 overflow-y-auto">
        {navigationSections.map((section) => (
          <div key={section.title} className="mb-8">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
              {section.title}
            </h3>
            <ul className="space-y-1">
              {section.items.map((item) => {
                const Icon = item.icon
                return (
                  <li key={item.name}>
                    <Link
                      href={item.href}
                      className="flex items-center px-3 py-2 text-sm text-gray-700 rounded-md hover:bg-gray-100 hover:text-gray-900 transition-colors"
                    >
                      <Icon className="h-4 w-4 mr-3 text-gray-400" />
                      {item.name}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </nav>
    </div>
  )
} 