import { Button } from "@/components/ui/button"
import { createClient } from "@/utils/supabase/server"
import { redirect } from "next/navigation"
import { LogOut, User } from "lucide-react"

export async function Header() {
  const supabase = await createClient()
  
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const signOut = async () => {
    "use server"
    const supabase = await createClient()
    await supabase.auth.signOut()
    return redirect('/login')
  }

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <nav className="flex items-center space-x-1">
            {/* <Button variant="ghost" size="sm" className="text-gray-600">
              Docs
            </Button>
            <Button variant="ghost" size="sm" className="text-gray-600">
              API reference
            </Button> */}
          </nav>
        </div>

        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <User className="h-4 w-4" />
            <span>{user?.email}</span>
          </div>
          
          <form action={signOut}>
            <Button variant="outline" size="sm" className="flex items-center space-x-2">
              <LogOut className="h-4 w-4" />
              <span>Sign out</span>
            </Button>
          </form>
        </div>
      </div>
    </header>
  )
} 