import { createClient } from '@/utils/supabase/server'
import { SiteSettings } from '@/types/site-settings'

/**
 * Fetch site settings from the database
 * Returns null if settings cannot be fetched to avoid breaking API responses
 */
export async function getSiteSettings(): Promise<SiteSettings | null> {
  try {
    const supabase = await createClient()
    
    const { data: siteSettings, error } = await supabase
      .from('site_settings')
      .select('*')
      .single()

    if (error) {
      console.error('Error fetching site settings:', error)
      return null
    }

    return siteSettings
  } catch (error) {
    console.error('Unexpected error fetching site settings:', error)
    return null
  }
} 