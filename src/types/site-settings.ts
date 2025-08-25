export interface SiteSettings {
  id: number
  site_name: string
  site_logo_url: string | null
  site_banner_image_url: string | null
  created_at: string
  updated_at: string
}

export interface CreateSiteSettingsRequest {
  site_name: string
  site_logo_url?: string
  site_banner_image_url?: string
}

export interface UpdateSiteSettingsRequest {
  site_name?: string
  site_logo_url?: string
  site_banner_image_url?: string
}

export interface SiteSettingsResponse {
  data: SiteSettings
}

export interface SiteSettingsListResponse {
  data: SiteSettings[]
} 