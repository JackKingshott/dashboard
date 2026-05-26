import Link from 'next/link'
import { Calendar, Users, ExternalLink, CalendarX } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { formatDate } from '@/lib/utils'
import { listUpcomingEvents } from '@/lib/google-calendar'

function formatEventTime(dateTime?: string, date?: string) {
  if (dateTime) {
    return new Intl.DateTimeFormat('en-GB', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(dateTime))
  }
  if (date) return formatDate(date)
  return '—'
}

export async function UpcomingMeetings() {
  const accessToken = process.env.GOOGLE_ACCESS_TOKEN
  const refreshToken = process.env.GOOGLE_REFRESH_TOKEN

  if (!accessToken) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Upcoming Meetings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center gap-3">
            <div className="rounded-full bg-blue-50 p-3">
              <Calendar className="h-6 w-6 text-blue-500" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">Google Calendar not connected</p>
              <p className="text-xs text-gray-500 mt-1">Connect to see your upcoming meetings here</p>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href="/settings">Connect Google Calendar</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  let events: Awaited<ReturnType<typeof listUpcomingEvents>> = []
  try {
    events = await listUpcomingEvents(accessToken, refreshToken, 5)
  } catch {
    events = []
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base">Upcoming Meetings</CardTitle>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/calendar" className="text-xs text-blue-600">View calendar</Link>
        </Button>
      </CardHeader>
      <CardContent>
        {events.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center gap-2">
            <CalendarX className="h-8 w-8 text-gray-300" />
            <p className="text-sm text-gray-500">No upcoming meetings</p>
          </div>
        ) : (
          <div className="space-y-3">
            {events.map((event) => (
              <div
                key={event.id}
                className="flex items-start gap-3 rounded-lg border border-gray-100 p-3 hover:bg-gray-50/50 transition-colors"
              >
                <div className="mt-0.5 rounded-lg bg-blue-50 p-1.5 shrink-0">
                  <Calendar className="h-4 w-4 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{event.summary ?? 'Untitled'}</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {formatEventTime(event.start?.dateTime ?? undefined, event.start?.date ?? undefined)}
                  </p>
                  {(event.attendees?.length ?? 0) > 0 && (
                    <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {event.attendees!.length} attendee{event.attendees!.length !== 1 ? 's' : ''}
                    </p>
                  )}
                </div>
                {event.htmlLink && (
                  <a
                    href={event.htmlLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shrink-0 text-gray-400 hover:text-blue-600 transition-colors"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
