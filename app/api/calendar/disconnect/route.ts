import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST() {
  try {
    const supabase = createAdminClient()
    await supabase
      .from('settings')
      .delete()
      .in('key', ['google_access_token', 'google_refresh_token'])
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Failed to disconnect' }, { status: 500 })
  }
}
