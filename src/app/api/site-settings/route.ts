import { createClient } from '@/utils/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { CreateSiteSettingsRequest, UpdateSiteSettingsRequest } from '@/types/site-settings'

// GET /api/site-settings - Get site settings (should return single record)
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: siteSettings, error } = await supabase
      .from('site_settings')
      .select('*')
      .single()

    if (error) {
      console.error('Error fetching site settings:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data: siteSettings })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/site-settings - Create new site settings (if none exist)
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body: CreateSiteSettingsRequest = await request.json()
    const { site_name, site_logo_url, site_banner_image_url } = body

    // Validate required fields
    if (!site_name || site_name.trim() === '') {
      return NextResponse.json({ error: 'Site name is required' }, { status: 400 })
    }

    const { data: newSiteSettings, error } = await supabase
      .from('site_settings')
      .insert([{ site_name, site_logo_url, site_banner_image_url }])
      .select()
      .single()

    if (error) {
      console.error('Error creating site settings:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data: newSiteSettings }, { status: 201 })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT /api/site-settings - Update site settings (update the single record)
export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body: UpdateSiteSettingsRequest = await request.json()

    // Get the existing settings first
    const { data: existingSettings, error: fetchError } = await supabase
      .from('site_settings')
      .select('*')
      .single()

    if (fetchError) {
      console.error('Error fetching existing site settings:', fetchError)
      return NextResponse.json({ error: fetchError.message }, { status: 500 })
    }

    const { data: updatedSiteSettings, error } = await supabase
      .from('site_settings')
      .update({
        ...body,
        updated_at: new Date().toISOString()
      })
      .eq('id', existingSettings.id)
      .select()
      .single()

    if (error) {
      console.error('Error updating site settings:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data: updatedSiteSettings })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 