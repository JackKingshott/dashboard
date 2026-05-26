import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET() {
  // Check env var first (for backwards compatibility)
  if (process.env.GOOGLE_ACCESS_TOKEN) {
    return NextResponse.json({ connected: true })
  }

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ connected: false })
  }

  try {
    const supabase = createAdminClient()
    const { data } = await supabase
      .from('settings')
      .select('value')
      .eq('key', 'google_access_token')
      .single()

    return NextResponse.json({ connected: !!data?.value })
  } catch {
    return NextResponse.json({ connected: false })
  }
}
