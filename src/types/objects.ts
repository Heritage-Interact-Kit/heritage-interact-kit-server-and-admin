export interface Object {
  id: number
  title: string | null
  description: string | null
  thumbnail_url: string | null
  lat: number | null
  lng: number | null
  created_at: string
}

export interface CreateObjectRequest {
  title: string
  description?: string
  thumbnail_url?: string
  lat?: number
  lng?: number
}

export interface UpdateObjectRequest {
  title?: string
  description?: string
  thumbnail_url?: string
  lat?: number
  lng?: number
}

export interface ObjectResponse {
  data: Object
}

export interface ObjectsResponse {
  data: Object[]
} 