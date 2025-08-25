import { NextRequest, NextResponse } from 'next/server'

// POST /api/admin/verify-page-secret - Verify the page secret for admin access
export async function POST(request: NextRequest) {
  try {
    const { page_secret } = await request.json()

    // Validate page secret
    if (!page_secret || page_secret !== process.env.ADMIN_PAGE_SECRET) {
      console.log('🚨 Invalid page secret:', page_secret, process.env.ADMIN_PAGE_SECRET)
      return NextResponse.json({ error: 'Invalid page secret' }, { status: 401 })
    }

    return NextResponse.json({
      success: true,
      message: 'Page secret verified'
    })

  } catch (error) {
    console.error('Unexpected error during page secret verification:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
