import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

const SETTING_KEYS = ['business_name', 'default_currency', 'tax_rate']

export async function GET() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({})
  }
  try {
    const supabase = createAdminClient()
    const { data, error } = await supabase
      .from('settings')
      .select('key, value')
      .in('key', SETTING_KEYS)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    const result: Record<string, string> = {}
    for (const row of data ?? []) {
      if (row.key) result[row.key] = row.value ?? ''
    }
    return NextResponse.json(result)
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const supabase = createAdminClient()

    const upserts = SETTING_KEYS
      .filter((key) => body[key] !== undefined)
      .map((key) => ({
        key,
        value: String(body[key]),
        updated_at: new Date().toISOString(),
      }))

    if (upserts.length === 0) {
      return NextResponse.json({ success: true })
    }

    const { error } = await supabase
      .from('settings')
      .upsert(upserts, { onConflict: 'key' })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
