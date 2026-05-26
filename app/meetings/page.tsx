'use client'

import { useState, useEffect } from 'react'
import { Plus, Pencil, Trash2, Clock, Users, Building2, ChevronDown, ChevronUp, FileText } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { formatDate } from '@/lib/utils'
import { localMeetings, localClients } from '@/lib/local-store'
import type { Meeting, Client } from '@/types'

function formatMeetingTime(date: string, start: string, end: string) {
  const d = new Date(`${date}T${start}`)
  const dateStr = formatDate(date, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
  const startStr = d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
  const endStr = new Date(`${date}T${end}`).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
  return `${dateStr} · ${startStr}–${endStr}`
}

const emptyForm = {
  title: '', date: '', start_time: '09:00', end_time: '10:00',
  client_id: '', attendees: '', notes: '',
}

interface MeetingDialogProps {
  open: boolean
  onOpenChange: (v: boolean) => void
  onSave: (m: Meeting) => void
  clients: Client[]
  initial?: Meeting | null
}

function MeetingDialog({ open, onOpenChange, onSave, clients, initial }: MeetingDialogProps) {
  const isEdit = !!initial
  const [form, setForm] = useState(emptyForm)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (open) {
      setError(null)
      setForm(initial ? {
        title: initial.title, date: initial.date,
        start_time: initial.start_time, end_time: initial.end_time,
        client_id: initial.client_id ?? '', attendees: initial.attendees, notes: initial.notes,
      } : { ...emptyForm, date: new Date().toISOString().split('T')[0] })
    }
  }, [open, initial])

  function set(f: string, v: string) { setForm(p => ({ ...p, [f]: v })) }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.title.trim() || !form.date) { setError('Title and date are required.'); return }
    setLoading(true)
    try {
      const payload = {
        title: form.title.trim(), date: form.date,
        start_time: form.start_time, end_time: form.end_time,
        client_id: form.client_id || null,
        attendees: form.attendees,
        notes: form.notes,
      }
      const result = isEdit
        ? localMeetings.update(initial!.id, payload)
        : localMeetings.add(payload)
      if (!result) throw new Error('Failed to save')
      onSave(result)
      onOpenChange(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save meeting')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Meeting' : 'Schedule Meeting'}</DialogTitle>
          <DialogDescription>{isEdit ? 'Update the meeting details.' : 'Add a new meeting to your schedule.'}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
          <div className="space-y-1.5">
            <Label htmlFor="m-title">Meeting Title *</Label>
            <Input id="m-title" value={form.title} onChange={e => set('title', e.target.value)} placeholder="e.g. Monthly Strategy Call" required />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5 col-span-1">
              <Label htmlFor="m-date">Date *</Label>
              <Input id="m-date" type="date" value={form.date} onChange={e => set('date', e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="m-start">Start</Label>
              <Input id="m-start" type="time" value={form.start_time} onChange={e => set('start_time', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="m-end">End</Label>
              <Input id="m-end" type="time" value={form.end_time} onChange={e => set('end_time', e.target.value)} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Client (optional)</Label>
            <Select value={form.client_id} onValueChange={v => set('client_id', v)}>
              <SelectTrigger><SelectValue placeholder="No client" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="">No client</SelectItem>
                {clients.map(c => <SelectItem key={c.id} value={c.id}>{c.name}{c.company ? ` — ${c.company}` : ''}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="m-attendees">Attendees</Label>
            <Input id="m-attendees" value={form.attendees} onChange={e => set('attendees', e.target.value)} placeholder="e.g. Sarah, Mike, Client CEO" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="m-notes">Notes</Label>
            <Textarea
              id="m-notes"
              value={form.notes}
              onChange={e => set('notes', e.target.value)}
              rows={5}
              className="resize-none"
              placeholder="Meeting agenda, action items, decisions made..."
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>Cancel</Button>
            <Button type="submit" disabled={loading}>
              {loading ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" /> : null}
              {isEdit ? 'Save Changes' : 'Schedule Meeting'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function MeetingCard({ meeting, onEdit, onDelete }: { meeting: Meeting; onEdit: (m: Meeting) => void; onDelete: (id: string) => void }) {
  const [notesOpen, setNotesOpen] = useState(false)
  const isPast = meeting.date < new Date().toISOString().split('T')[0]

  return (
    <Card className={isPast ? 'opacity-75' : ''}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <p className="font-semibold text-gray-900 truncate">{meeting.title}</p>
              {isPast && <Badge variant="secondary" className="text-xs shrink-0">Past</Badge>}
            </div>
            <p className="text-xs text-gray-500 flex items-center gap-1.5 mb-2">
              <Clock className="h-3 w-3 shrink-0" />
              {formatMeetingTime(meeting.date, meeting.start_time, meeting.end_time)}
            </p>
            <div className="flex flex-wrap items-center gap-3">
              {meeting.client && (
                <span className="text-xs text-gray-500 flex items-center gap-1">
                  <Building2 className="h-3 w-3" />
                  {meeting.client.name}
                </span>
              )}
              {meeting.attendees && (
                <span className="text-xs text-gray-500 flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  {meeting.attendees}
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 gap-1.5 text-xs text-gray-500 hover:text-gray-900"
              onClick={() => setNotesOpen(v => !v)}
            >
              <FileText className="h-3.5 w-3.5" />
              Notes
              {notesOpen ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            </Button>
            <button onClick={() => onEdit(meeting)} className="rounded p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors">
              <Pencil className="h-3.5 w-3.5" />
            </button>
            <button onClick={() => onDelete(meeting.id)} className="rounded p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors">
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {notesOpen && (
          <div className="mt-4 border-t border-gray-100 pt-4">
            <MeetingNotes meeting={meeting} />
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function MeetingNotes({ meeting }: { meeting: Meeting }) {
  const [notes, setNotes] = useState(meeting.notes)
  const [saved, setSaved] = useState(true)
  const [saving, setSaving] = useState(false)

  function handleChange(val: string) {
    setNotes(val)
    setSaved(false)
  }

  function handleSave() {
    setSaving(true)
    localMeetings.update(meeting.id, { notes })
    setSaving(false)
    setSaved(true)
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-gray-500">Meeting Notes</p>
        {!saved && (
          <Button size="sm" variant="outline" onClick={handleSave} disabled={saving} className="h-7 text-xs">
            {saving ? 'Saving...' : 'Save notes'}
          </Button>
        )}
        {saved && notes && <span className="text-xs text-green-600">Saved</span>}
      </div>
      <Textarea
        value={notes}
        onChange={e => handleChange(e.target.value)}
        rows={6}
        className="resize-none text-sm"
        placeholder="Add meeting notes, action items, decisions made, follow-ups..."
      />
    </div>
  )
}

export default function MeetingsPage() {
  const [meetings, setMeetings] = useState<Meeting[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Meeting | null>(null)

  useEffect(() => {
    setMeetings(localMeetings.list())
    setClients(localClients.list())
  }, [])

  function handleSave(m: Meeting) {
    setMeetings(prev => {
      const exists = prev.find(x => x.id === m.id)
      const updated = exists ? prev.map(x => x.id === m.id ? m : x) : [m, ...prev]
      return updated.sort((a, b) => new Date(`${b.date}T${b.start_time}`).getTime() - new Date(`${a.date}T${a.start_time}`).getTime())
    })
  }

  function handleDelete(id: string) {
    if (!confirm('Delete this meeting?')) return
    localMeetings.delete(id)
    setMeetings(prev => prev.filter(m => m.id !== id))
  }

  function openEdit(m: Meeting) { setEditing(m); setDialogOpen(true) }
  function openAdd() { setEditing(null); setDialogOpen(true) }

  const today = new Date().toISOString().split('T')[0]
  const upcoming = meetings.filter(m => m.date >= today).sort((a, b) => new Date(`${a.date}T${a.start_time}`).getTime() - new Date(`${b.date}T${b.start_time}`).getTime())
  const past = meetings.filter(m => m.date < today).sort((a, b) => new Date(`${b.date}T${b.start_time}`).getTime() - new Date(`${a.date}T${a.start_time}`).getTime())

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Meetings</h1>
          <p className="mt-1 text-sm text-gray-500">
            {upcoming.length} upcoming · {past.length} past
          </p>
        </div>
        <Button onClick={openAdd}>
          <Plus className="h-4 w-4" />
          Schedule Meeting
        </Button>
      </div>

      <Tabs defaultValue="upcoming">
        <TabsList>
          <TabsTrigger value="upcoming">
            Upcoming
            {upcoming.length > 0 && <span className="ml-1.5 rounded-full bg-blue-100 text-blue-700 px-1.5 py-0.5 text-xs">{upcoming.length}</span>}
          </TabsTrigger>
          <TabsTrigger value="past">Past</TabsTrigger>
          <TabsTrigger value="all">All</TabsTrigger>
        </TabsList>

        {[
          { value: 'upcoming', items: upcoming },
          { value: 'past', items: past },
          { value: 'all', items: meetings },
        ].map(({ value, items }) => (
          <TabsContent key={value} value={value}>
            {items.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 py-16 text-center">
                <div className="rounded-full bg-blue-50 p-4 mb-4">
                  <Clock className="h-8 w-8 text-blue-400" />
                </div>
                <p className="text-sm font-medium text-gray-900">No {value === 'upcoming' ? 'upcoming ' : value === 'past' ? 'past ' : ''}meetings</p>
                {value === 'upcoming' && (
                  <Button className="mt-4" onClick={openAdd}>
                    <Plus className="h-4 w-4" />
                    Schedule your first meeting
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {items.map(m => (
                  <MeetingCard key={m.id} meeting={m} onEdit={openEdit} onDelete={handleDelete} />
                ))}
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>

      <MeetingDialog
        open={dialogOpen}
        onOpenChange={open => { setDialogOpen(open); if (!open) setEditing(null) }}
        onSave={handleSave}
        clients={clients}
        initial={editing}
      />
    </div>
  )
}
