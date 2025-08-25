'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'

interface AuthGuardProps {
  children: React.ReactNode
}

export function AuthGuard({ children }: AuthGuardProps) {
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    // Check initial auth state
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        router.push('/login')
        return
      }

      // Check if user is active
      const isActive = user.user_metadata?.is_active !== false
      if (!isActive) {
        await supabase.auth.signOut()
        router.push('/login?message=account_deactivated')
        return
      }
    }

    checkAuth()

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event, session?.user?.email)
      
      if (event === 'SIGNED_OUT' || !session?.user) {
        router.push('/login')
        return
      }

      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        // Check if user is still active when auth state changes
        const isActive = session.user.user_metadata?.is_active !== false
        if (!isActive) {
          console.log('User is deactivated during auth state change')
          await supabase.auth.signOut()
          router.push('/login?message=account_deactivated')
          return
        }
      }
    })

    // Cleanup subscription
    return () => {
      subscription.unsubscribe()
    }
  }, [router, supabase])

  return <>{children}</>
}
