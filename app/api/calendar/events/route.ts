import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { listUpcomingEvents, createCalendarEvent } from '@/lib/google-calendar'

async function getTokens() {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from('settings')
    .select('key, value')
    .in('key', ['google_access_token', 'google_refresh_token'])

  const map: Record<string, string> = {}
  for (const row of data ?? []) {
    if (row.key && row.value) map[row.key] = row.value
  }

  return {
    accessToken: map['google_access_token'] ?? process.env.GOOGLE_ACCESS_TOKEN,
    refreshToken: map['google_refresh_token'] ?? process.env.GOOGLE_REFRESH_TOKEN,
  }
}

export async function GET() {
  try {
    const { accessToken, refreshToken } = await getTokens()
    if (!accessToken) {
      return NextResponse.json({ error: 'Google Calendar not connected' }, { status: 401 })
    }
    const events = await listUpcomingEvents(accessToken, refreshToken, 20)
    return NextResponse.json(events)
  } catch (err) {
    console.error('Calendar events error:', err)
    return NextResponse.json({ error: 'Failed to fetch events' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { accessToken, refreshToken } = await getTokens()
    if (!accessToken) {
      return NextResponse.json({ error: 'Google Calendar not connected' }, { status: 401 })
    }

    const event = await createCalendarEvent(accessToken, {
      summary: body.summary,
      description: body.description,
      startDateTime: body.startDateTime,
      endDateTime: body.endDateTime,
      attendeeEmails: body.attendeeEmails,
    }, refreshToken)

    return NextResponse.json(event, { status: 201 })
  } catch (err) {
    console.error('Create event error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to create event' },
      { status: 500 }
    )
  }
}
