import { NextResponse } from 'next/server'
import { getAuthUrl } from '@/lib/google-calendar'

export async function GET() {
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    return NextResponse.json({ error: 'Google Calendar not configured' }, { status: 503 })
  }
  try {
    const url = getAuthUrl()
    return NextResponse.json({ url })
  } catch {
    return NextResponse.json({ error: 'Failed to generate auth URL' }, { status: 500 })
  }
}
