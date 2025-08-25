export interface Tour {
  id: number
  title: string | null
  description: string | null
  thumbnail_url: string | null
  object_order: number[] | null
  created_at: string
}

export interface CreateTourRequest {
  title: string
  description?: string
  thumbnail_url?: string
}

export interface UpdateTourRequest {
  title?: string
  description?: string
  thumbnail_url?: string
  object_order?: number[]
}

export interface TourResponse {
  data: Tour
}

export interface ToursResponse {
  data: Tour[]
} 