import { Sidebar } from "./sidebar"
import { Header } from "./header"
import { AuthGuard } from "./auth-guard"
import { createClient } from "@/utils/supabase/server"
import { redirect } from "next/navigation"

interface ProtectedLayoutProps {
  children: React.ReactNode
}

export async function ProtectedLayout({ children }: ProtectedLayoutProps) {
  // Check authentication
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return redirect('/login')
  }

  // Check if user is active
  const isActive = user.user_metadata?.is_active !== false
  if (!isActive) {
    return redirect('/login?message=account_deactivated')
  }

  return (
    <AuthGuard>
      <div className="h-screen flex bg-gray-50">
        {/* Sidebar */}
        <Sidebar className="hidden lg:flex" />
        
        {/* Main Content Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header */}
          <Header />
          
          {/* Page Content */}
          <main className="flex-1 overflow-y-auto p-6">
            <div className="max-w-7xl mx-auto">
              {children}
            </div>
          </main>
        </div>
      </div>
    </AuthGuard>
  )
} 