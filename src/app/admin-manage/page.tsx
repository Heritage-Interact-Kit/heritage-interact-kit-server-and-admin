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
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import appConfig from '../../../app.config'

interface User {
  id: string
  email: string
  created_at: string
  banned_until?: string | null
  user_metadata?: {
    is_active?: boolean
    deactivated_at?: string | null
  }
}

export default function AdminManagePage() {
  const router = useRouter()
  const [pageSecret, setPageSecret] = useState('')
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [authSecret, setAuthSecret] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  // Create user form
  const [createEmail, setCreateEmail] = useState('')
  const [createPassword, setCreatePassword] = useState('')

  // Update password form
  const [updateEmail, setUpdateEmail] = useState('')
  const [updatePassword, setUpdatePassword] = useState('')

  // Toggle activation form
  const [toggleEmail, setToggleEmail] = useState('')

  // Users list
  const [users, setUsers] = useState<User[]>([])

  const handlePageSecretSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)

    try {
      const response = await fetch('/api/admin/verify-page-secret', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ page_secret: pageSecret }),
      })

      if (response.ok) {
        setIsAuthenticated(true)
        if (authSecret) {
          fetchUsers()
        }
      } else {
        setError('Invalid page secret')
      }
    } catch (error) {
      setError('An error occurred while verifying page secret')
    }
  }

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/admin/users/list', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ auth_secret: authSecret }),
      })

      if (response.ok) {
        const data = await response.json()
        setUsers(data.users || [])
      }
    } catch (error) {
      console.error('Error fetching users:', error)
    }
  }

  const handleCreateUser = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    setLoading(true)

    try {
      const response = await fetch('/api/admin/users/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: createEmail,
          password: createPassword,
          auth_secret: authSecret,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess('User created successfully')
        setCreateEmail('')
        setCreatePassword('')
        fetchUsers()
      } else {
        setError(data.error || 'Failed to create user')
      }
    } catch (error) {
      setError('An error occurred while creating user')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdatePassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    setLoading(true)

    try {
      const response = await fetch('/api/admin/users/update-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: updateEmail,
          password: updatePassword,
          auth_secret: authSecret,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess('Password updated successfully')
        setUpdateEmail('')
        setUpdatePassword('')
      } else {
        setError(data.error || 'Failed to update password')
      }
    } catch (error) {
      setError('An error occurred while updating password')
    } finally {
      setLoading(false)
    }
  }

  const handleToggleUserActivation = async (email: string, currentlyActive: boolean) => {
    setError(null)
    setSuccess(null)
    setLoading(true)

    console.log('Toggling user activation:', { email, currentlyActive, newStatus: !currentlyActive })

    try {
      const response = await fetch('/api/admin/users/toggle-activation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email,
          is_active: !currentlyActive,
          auth_secret: authSecret,
        }),
      })

      const data = await response.json()
      console.log('Toggle response:', data)

      if (response.ok) {
        setSuccess(`User ${!currentlyActive ? 'activated' : 'deactivated'} successfully`)
        fetchUsers()
      } else {
        setError(data.error || 'Failed to toggle user activation')
      }
    } catch (error) {
      console.error('Toggle activation error:', error)
      setError('An error occurred while toggling user activation')
    } finally {
      setLoading(false)
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardHeader>
            <div className="flex items-center justify-center py-4 mb-2">
              <img className="h-12 w-auto object-contain" src={appConfig.appLogo} alt={appConfig.appName} />
              <span className="ml-2 text-lg font-semibold tracking-tight">{appConfig.appName}</span>
            </div>
            <CardTitle>Admin Access</CardTitle>
            <CardDescription>
              Enter the page secret to access admin user management.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePageSecretSubmit}>
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="pageSecret">Page Secret</Label>
                  <Input
                    id="pageSecret"
                    type="password"
                    required
                    value={pageSecret}
                    onChange={(e) => setPageSecret(e.target.value)}
                  />
                </div>
                {error && <p className="text-red-500">{error}</p>}
                <Button type="submit" className="w-full">
                  Access Admin Panel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center">
          <img className="h-8 w-auto object-contain mr-2" src={appConfig.appLogo} alt={appConfig.appName} />
          <h1 className="text-2xl font-bold">Admin User Management</h1>
        </div>
        <Button variant="outline" onClick={() => router.push('/login')}>
          Back to Login
        </Button>
      </div>

      <div className="grid gap-6">
        {/* Auth Secret Input */}
        <Card>
          <CardHeader>
            <CardTitle>Authentication Secret</CardTitle>
            <CardDescription>
              Enter the auth secret to perform user management operations.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2">
              <Label htmlFor="authSecret">Auth Secret</Label>
              <Input
                id="authSecret"
                type="password"
                value={authSecret}
                onChange={(e) => setAuthSecret(e.target.value)}
                placeholder="Enter auth secret for API operations"
              />
            </div>
          </CardContent>
        </Card>

        {/* Status Messages */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}
        {success && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
            {success}
          </div>
        )}

        {/* Create User */}
        <Card>
          <CardHeader>
            <CardTitle>Create User</CardTitle>
            <CardDescription>
              Create a new admin user account.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateUser}>
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="createEmail">Email</Label>
                  <Input
                    id="createEmail"
                    type="email"
                    required
                    value={createEmail}
                    onChange={(e) => setCreateEmail(e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="createPassword">Password</Label>
                  <Input
                    id="createPassword"
                    type="password"
                    required
                    value={createPassword}
                    onChange={(e) => setCreatePassword(e.target.value)}
                  />
                </div>
                <Button type="submit" disabled={loading || !authSecret}>
                  {loading ? 'Creating...' : 'Create User'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Update Password */}
        <Card>
          <CardHeader>
            <CardTitle>Update User Password</CardTitle>
            <CardDescription>
              Change the password for an existing user.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleUpdatePassword}>
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="updateEmail">Email</Label>
                  <Input
                    id="updateEmail"
                    type="email"
                    required
                    value={updateEmail}
                    onChange={(e) => setUpdateEmail(e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="updatePassword">New Password</Label>
                  <Input
                    id="updatePassword"
                    type="password"
                    required
                    value={updatePassword}
                    onChange={(e) => setUpdatePassword(e.target.value)}
                  />
                </div>
                <Button type="submit" disabled={loading || !authSecret}>
                  {loading ? 'Updating...' : 'Update Password'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* User Activation Management */}
        <Card>
          <CardHeader>
            <CardTitle>User Activation Management</CardTitle>
            <CardDescription>
              Activate or deactivate user accounts. Deactivated users cannot log in but their data is preserved.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">
              Use the toggle buttons in the users list below to activate/deactivate accounts.
            </p>
          </CardContent>
        </Card>

        {/* Users List */}
        <Card>
          <CardHeader>
            <CardTitle>Current Users</CardTitle>
            <CardDescription>
              List of all admin users in the system.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={fetchUsers} disabled={!authSecret} className="mb-4">
              Refresh Users List
            </Button>
            {users.length > 0 ? (
              <div className="space-y-2">
                {users.map((user) => {
                  // User is active if is_active is explicitly true OR undefined (default for new users)
                  // User is inactive only if is_active is explicitly false
                  const isActive = user.user_metadata?.is_active !== false
                  console.log('User status for', user.email, ':', { 
                    user_metadata: user.user_metadata, 
                    is_active_value: user.user_metadata?.is_active,
                    isActive,
                    banned_until: user.banned_until 
                  })
                  return (
                    <div key={user.id} className="flex justify-between items-center p-3 border rounded">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{user.email}</p>
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            isActive 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {isActive ? 'Active' : 'Deactivated'}
                          </span>
                        </div>
                        <p className="text-sm text-gray-500">Created: {new Date(user.created_at).toLocaleDateString()}</p>
                        {!isActive && user.user_metadata?.deactivated_at && (
                          <p className="text-sm text-red-500">
                            Deactivated: {new Date(user.user_metadata.deactivated_at).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                      <Button
                        onClick={() => handleToggleUserActivation(user.email, isActive)}
                        variant={isActive ? "destructive" : "default"}
                        size="sm"
                        disabled={loading || !authSecret}
                      >
                        {loading ? 'Processing...' : (isActive ? 'Deactivate' : 'Activate')}
                      </Button>
                    </div>
                  )
                })}
              </div>
            ) : (
              <p className="text-gray-500">No users found or auth secret not provided.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
