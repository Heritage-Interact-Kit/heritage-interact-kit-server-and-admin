'use client'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createClient } from '@/utils/supabase/client'
import { useRouter, useSearchParams } from 'next/navigation'
import { useState, useEffect, Suspense } from 'react'

import appConfig from "../../../app.config";

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const message = searchParams.get('message')
    if (message === 'account_deactivated') {
      setError('Your account has been deactivated. Please contact an administrator.')
    }
  }, [searchParams])

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)

    const supabase = createClient()
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setError(error.message)
    } else if (data.user) {
      // Check if user is active after successful authentication
      const isActive = data.user.user_metadata?.is_active !== false
      
      if (!isActive) {
        // Sign out the deactivated user immediately
        await supabase.auth.signOut()
        setError('Your account has been deactivated. Please contact an administrator.')
        return
      }
      
      // User is active, proceed to dashboard
      router.push('/dashboard')
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center justify-center py-4 mb-2">
            <img className="h-12 w-auto object-contain" src={appConfig.appLogo} alt={appConfig.appName} />
            <span className="ml-2 text-lg font-semibold tracking-tight">{appConfig.appName}</span>
          </div>
          <CardTitle>Login</CardTitle>
          <CardDescription>
            Enter your email and password to access your account.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin}>
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="m@example.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              {error && <p className="text-red-500">{error}</p>}
              <Button type="submit" className="w-full">
                Login
              </Button>
            </div>
          </form>

        </CardContent>
      </Card>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardHeader>
            <div className="flex items-center justify-center py-4 mb-2">
              <img className="h-12 w-auto object-contain" src={appConfig.appLogo} alt={appConfig.appName} />
              <span className="ml-2 text-lg font-semibold tracking-tight">{appConfig.appName}</span>
            </div>
            <CardTitle>Login</CardTitle>
            <CardDescription>
              Loading...
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    }>
      <LoginForm />
    </Suspense>
  )
}