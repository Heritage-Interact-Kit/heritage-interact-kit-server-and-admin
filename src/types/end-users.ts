export interface EndUser {
  id: number
  auth_user_id: string | null
  email: string
  username: string | null
  first_name: string | null
  last_name: string | null
  display_name: string | null
  avatar_url: string | null
  is_active: boolean
  last_login_at: string | null
  preferences: Record<string, string | number | boolean | null>
  created_at: string
  updated_at: string
}

// For mobile app user registration/profile creation
export interface CreateEndUserRequest {
  auth_user_id?: string
  email: string
  username?: string
  first_name?: string
  last_name?: string
  display_name?: string
  avatar_url?: string
  preferences?: Record<string, string | number | boolean | null>
}

// For mobile app profile updates
export interface UpdateEndUserRequest {
  username?: string
  first_name?: string
  last_name?: string
  display_name?: string
  avatar_url?: string
  preferences?: Record<string, string | number | boolean | null>
}

// For admin operations
export interface AdminUpdateEndUserRequest {
  username?: string
  first_name?: string
  last_name?: string
  display_name?: string
  avatar_url?: string
  is_active?: boolean
  preferences?: Record<string, string | number | boolean | null>
}

export interface EndUserResponse {
  data: EndUser
}

export interface EndUsersResponse {
  data: EndUser[]
}

export interface EndUsersStatsResponse {
  data: {
    total_users: number
    active_users: number
    new_users_this_month: number
  }
} 