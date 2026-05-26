import { NextRequest, NextResponse } from 'next/server'
import { getOAuthClient } from '@/lib/google-calendar'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const code = searchParams.get('code')
  const error = searchParams.get('error')

  if (error) {
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/settings?error=calendar_auth_failed`)
  }

  if (!code) {
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/settings?error=no_code`)
  }

  try {
    const oauth2Client = getOAuthClient()
    const { tokens } = await oauth2Client.getToken(code)

    const supabase = createAdminClient()

    // Store tokens in settings table
    const upserts = []
    if (tokens.access_token) {
      upserts.push({
        key: 'google_access_token',
        value: tokens.access_token,
        updated_at: new Date().toISOString(),
      })
    }
    if (tokens.refresh_token) {
      upserts.push({
        key: 'google_refresh_token',
        value: tokens.refresh_token,
        updated_at: new Date().toISOString(),
      })
    }

    if (upserts.length > 0) {
      await supabase.from('settings').upsert(upserts, { onConflict: 'key' })
    }

    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/calendar`)
  } catch (err) {
    console.error('Calendar callback error:', err)
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/settings?error=token_exchange_failed`)
  }
}
