// Interaction method enum
export type InteractionMethod = 'place_on_plane' | 'show_on_marker' | 'show_ar_portal' | 'show_directly'

// Base asset interface
export interface Asset {
  id: string
  title: string | null
  description: string | null
  model_url: string | null
  material_urls: string[] | null
  thumbnail_image_url: string | null
  marker_image_url: string | null
  audio_url: string | null
  video_url: string | null
  interaction_method: InteractionMethod
  object_id: string
  folder_id: string | null
  created_at: string
}

export interface CreateAssetRequest {
  title?: string
  description?: string
  model_url?: string
  material_urls?: string[]
  thumbnail_image_url?: string
  marker_image_url?: string
  audio_url?: string
  video_url?: string
  interaction_method?: InteractionMethod
}

export interface UpdateAssetRequest {
  title?: string
  description?: string
  model_url?: string
  material_urls?: string[]
  thumbnail_image_url?: string
  marker_image_url?: string
  audio_url?: string
  video_url?: string
  interaction_method?: InteractionMethod
} 