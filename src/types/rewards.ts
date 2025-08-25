export interface Reward {
  id: number
  title: string
  description: string | null
  thumbnail_url: string | null
  reward_type: 'badge' | 'points' | 'item' | 'digital_content'
  reward_value: Record<string, string | number | boolean | null>
  task_id: number | null
  object_id: number | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface UserReward {
  id: number
  reward_id: number
  end_user_id: number
  obtained_via: 'task_completion' | 'direct_claim'
  submission_id: number | null
  status: 'claimed' | 'redeemed' | 'expired'
  claimed_at: string
  redeemed_at: string | null
  created_at: string
  updated_at: string
}

export interface CreateRewardRequest {
  title: string
  description?: string
  thumbnail_url?: string
  reward_type: 'badge' | 'points' | 'item' | 'digital_content'
  reward_value?: Record<string, string | number | boolean | null>
  task_id?: number
  object_id?: number
  is_active?: boolean
}

export interface UpdateRewardRequest {
  title?: string
  description?: string
  thumbnail_url?: string
  reward_type?: 'badge' | 'points' | 'item' | 'digital_content'
  reward_value?: Record<string, string | number | boolean | null>
  task_id?: number
  object_id?: number
  is_active?: boolean
}

export interface ClaimRewardRequest {
  reward_id: number
}

// Extended types for API responses including related data
export interface RewardWithRelations extends Reward {
  task?: {
    id: number
    title: string | null
    description: string | null
  }
  object?: {
    id: number
    title: string | null
    description: string | null
  }
  user_rewards_count?: number
}

export interface UserRewardWithRelations extends UserReward {
  reward: Reward
  submission?: {
    id: number
    created_at: string
  }
}

export interface RewardResponse {
  data: Reward
}

export interface RewardsResponse {
  data: Reward[]
}

export interface UserRewardResponse {
  data: UserReward
}

export interface UserRewardsResponse {
  data: UserReward[]
} 