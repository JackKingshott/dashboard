'use client'

import { useState, useEffect } from 'react'
import { Calendar, Plus, Users, ExternalLink, Link2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'
import type { CalendarEvent } from '@/types'

function formatEventDateTime(start: CalendarEvent['start'], end: CalendarEvent['end']) {
  const dt = start.dateTime
  if (!dt) return start.date ?? '—'
  const date = new Intl.DateTimeFormat('en-GB', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  }).format(new Date(dt))
  const startTime = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit' }).format(new Date(dt))
  const endTime = end.dateTime
    ? new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit' }).format(new Date(end.dateTime))
    : null
  return `${date} · ${startTime}${endTime ? ` – ${endTime}` : ''}`
}

function ScheduleMeetingDialog({ onSuccess }: { onSuccess: () => void }) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState({
    summary: '',
    description: '',
    date: '',
    start_time: '',
    end_time: '',
    attendees: '',
  })

  function setField(f: string, v: string) {
    setForm((p) => ({ ...p, [f]: v }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.summary.trim() || !form.date || !form.start_time || !form.end_time) {
      setError('Title, date, and times are required')
      return
    }
    setLoading(true)
    setError(null)
    try {
      const startDateTime = `${form.date}T${form.start_time}:00`
      const endDateTime = `${form.date}T${form.end_time}:00`
      const attendeeEmails = form.attendees
        .split(',')
        .map((e) => e.trim())
        .filter(Boolean)

      const res = await fetch('/api/calendar/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          summary: form.summary.trim(),
          description: form.description.trim() || undefined,
          startDateTime,
          endDateTime,
          attendeeEmails,
        }),
      })
      if (!res.ok) throw new Error((await res.json()).error ?? 'Failed to create event')
      setOpen(false)
      setForm({ summary: '', description: '', date: '', start_time: '', end_time: '', attendees: '' })
      onSuccess()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create event')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus className="h-4 w-4" />
        Schedule Meeting
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Schedule Meeting</DialogTitle>
            <DialogDescription>Create a new Google Calendar event.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
            <div className="space-y-1.5">
              <Label htmlFor="summary">Title *</Label>
              <Input id="summary" value={form.summary} onChange={(e) => setField('summary', e.target.value)} placeholder="Meeting title..." required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" value={form.description} onChange={(e) => setField('description', e.target.value)} rows={2} className="resize-none" placeholder="Optional agenda..." />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="date">Date *</Label>
              <Input id="date" type="date" value={form.date} onChange={(e) => setField('date', e.target.value)} required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="start_time">Start Time *</Label>
                <Input id="start_time" type="time" value={form.start_time} onChange={(e) => setField('start_time', e.target.value)} required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="end_time">End Time *</Label>
                <Input id="end_time" type="time" value={form.end_time} onChange={(e) => setField('end_time', e.target.value)} required />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="attendees">Attendee Emails</Label>
              <Input id="attendees" value={form.attendees} onChange={(e) => setField('attendees', e.target.value)} placeholder="jane@example.com, bob@example.com" />
              <p className="text-xs text-gray-400">Comma-separated email addresses</p>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={loading}>Cancel</Button>
              <Button type="submit" disabled={loading}>
                {loading ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" /> : <Plus className="h-4 w-4" />}
                Create Event
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}

export default function CalendarPage() {
  const [connected, setConnected] = useState<boolean | null>(null)
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [authUrl, setAuthUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  async function checkStatus() {
    try {
      const res = await fetch('/api/calendar/status')
      const data = await res.json()
      setConnected(data.connected)
      if (!data.connected) {
        const authRes = await fetch('/api/calendar/auth')
        const authData = await authRes.json()
        setAuthUrl(authData.url)
      }
    } catch {
      setConnected(false)
    }
  }

  async function fetchEvents() {
    try {
      const res = await fetch('/api/calendar/events')
      if (!res.ok) return
      const data = await res.json()
      setEvents(Array.isArray(data) ? data : [])
    } catch {}
  }

  useEffect(() => {
    checkStatus().then(() => {
      if (connected !== false) fetchEvents()
    }).finally(() => setLoading(false))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (connected === true) {
      fetchEvents().finally(() => setLoading(false))
    } else if (connected === false) {
      setLoading(false)
    }
  }, [connected])

  function handleEventCreated() {
    fetchEvents()
  }

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
      </div>
    )
  }

  if (!connected) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Calendar</h1>
          <p className="mt-1 text-sm text-gray-500">Schedule and manage client meetings</p>
        </div>
        <div className="flex justify-center py-12">
          <Card className="max-w-md w-full">
            <CardContent className="p-8 flex flex-col items-center text-center gap-5">
              <div className="rounded-full bg-blue-50 p-5">
                <Calendar className="h-10 w-10 text-blue-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Connect Google Calendar</h2>
                <p className="text-sm text-gray-500 mt-2">
                  Connect your Google Calendar to view upcoming meetings, schedule events, and invite clients directly from your dashboard.
                </p>
              </div>
              {authUrl ? (
                <Button asChild className="w-full">
                  <a href={authUrl}>
                    <Link2 className="h-4 w-4" />
                    Connect Google Calendar
                  </a>
                </Button>
              ) : (
                <p className="text-sm text-red-600">Google Calendar credentials not configured. Add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to your environment.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Calendar</h1>
          <p className="mt-1 text-sm text-gray-500">
            {events.length} upcoming event{events.length !== 1 ? 's' : ''}
          </p>
        </div>
        <ScheduleMeetingDialog onSuccess={handleEventCreated} />
      </div>

      {/* Events list */}
      {events.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 py-16 text-center">
          <div className="rounded-full bg-gray-100 p-4 mb-4">
            <Calendar className="h-8 w-8 text-gray-400" />
          </div>
          <p className="text-sm font-medium text-gray-900">No upcoming meetings</p>
          <p className="text-xs text-gray-500 mt-1">Schedule a meeting to get started</p>
        </div>
      ) : (
        <div className="space-y-3">
          {events.map((event) => (
            <Card key={event.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-start gap-4">
                  <div className="rounded-xl bg-blue-50 p-2.5 shrink-0">
                    <Calendar className="h-5 w-5 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-semibold text-gray-900 truncate">{event.summary ?? 'Untitled Event'}</h3>
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
                    <p className="text-sm text-blue-600 font-medium mt-0.5">
                      {formatEventDateTime(event.start, event.end)}
                    </p>
                    {event.description && (
                      <p className="text-sm text-gray-500 mt-1 line-clamp-2">{event.description}</p>
                    )}
                    {(event.attendees?.length ?? 0) > 0 && (
                      <div className="flex items-center gap-1.5 mt-2">
                        <Users className="h-3.5 w-3.5 text-gray-400" />
                        <p className="text-xs text-gray-500">
                          {event.attendees!.length} attendee{event.attendees!.length !== 1 ? 's' : ''}
                          {event.attendees!.slice(0, 2).map((a) => ` · ${a.displayName ?? a.email}`).join('')}
                          {event.attendees!.length > 2 && ` + ${event.attendees!.length - 2} more`}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
