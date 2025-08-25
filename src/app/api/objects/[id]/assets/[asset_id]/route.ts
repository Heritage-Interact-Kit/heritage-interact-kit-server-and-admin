import { createClient } from '@/utils/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { UpdateAssetRequest } from '@/types/assets'

// GET /api/objects/[id]/assets/[asset_id] - Get a single asset
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; asset_id: string }> }
) {
  try {
    const supabase = await createClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Await params in Next.js 15
    const { id, asset_id } = await params

    const { data: asset, error } = await supabase
      .from('assets')
      .select('*')
      .eq('id', asset_id)
      .eq('object_id', id)
      .single()

    if (error) {
        if (error.code === 'PGRST116') {
            return NextResponse.json({ error: 'Asset not found' }, { status: 404 })
        }
        console.error('Error fetching asset:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data: asset })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT /api/objects/[id]/assets/[asset_id] - Update an asset
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; asset_id: string }> }
) {
  try {
    const supabase = await createClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Await params in Next.js 15
    const { id, asset_id } = await params

    const body: UpdateAssetRequest = await request.json()

    const { data: asset, error } = await supabase
      .from('assets')
      .update(body)
      .eq('id', asset_id)
      .eq('object_id', id)
      .select()
      .single()

    if (error) {
        if (error.code === 'PGRST116') {
            return NextResponse.json({ error: 'Asset not found' }, { status: 404 })
        }
        console.error('Error updating asset:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data: asset })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/objects/[id]/assets/[asset_id] - Delete an asset
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; asset_id: string }> }
) {
  try {
    const supabase = await createClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Await params in Next.js 15
    const { id, asset_id } = await params

    const { error } = await supabase
      .from('assets')
      .delete()
      .eq('id', asset_id)
      .eq('object_id', id)

    if (error) {
        console.error('Error deleting asset:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ message: 'Asset deleted successfully' })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 