'use client'

import { useState } from 'react'
import { Trash2, StickyNote, Plus } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { formatDate } from '@/lib/utils'
import type { ClientNote } from '@/types'

interface Props {
  clientId: string
  initialNotes: ClientNote[]
}

export function ClientNotes({ clientId, initialNotes }: Props) {
  const [notes, setNotes] = useState<ClientNote[]>(initialNotes)
  const [content, setContent] = useState('')
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!content.trim()) return
    setSaving(true)
    setError(null)
    const optimisticNote: ClientNote = {
      id: `temp-${Date.now()}`,
      client_id: clientId,
      content: content.trim(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    setNotes((prev) => [optimisticNote, ...prev])
    setContent('')
    try {
      const res = await fetch(`/api/clients/${clientId}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: optimisticNote.content, client_id: clientId }),
      })
      if (!res.ok) throw new Error('Failed to save note')
      const saved: ClientNote = await res.json()
      setNotes((prev) => prev.map((n) => (n.id === optimisticNote.id ? saved : n)))
    } catch {
      setNotes((prev) => prev.filter((n) => n.id !== optimisticNote.id))
      setContent(optimisticNote.content)
      setError('Failed to save note. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(noteId: string) {
    setDeletingId(noteId)
    const previous = notes
    setNotes((prev) => prev.filter((n) => n.id !== noteId))
    try {
      const res = await fetch(`/api/clients/${clientId}/notes/${noteId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete')
    } catch {
      setNotes(previous)
      setError('Failed to delete note. Please try again.')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Notes</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
        )}

        {/* Add note form */}
        <form onSubmit={handleAdd} className="space-y-2">
          <Textarea
            placeholder="Add a note about this client..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={3}
            className="resize-none"
          />
          <Button type="submit" size="sm" disabled={saving || !content.trim()}>
            {saving ? (
              <>
                <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Saving...
              </>
            ) : (
              <>
                <Plus className="h-3.5 w-3.5" />
                Add Note
              </>
            )}
          </Button>
        </form>

        {/* Notes list */}
        {notes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <StickyNote className="h-8 w-8 text-gray-300 mb-2" />
            <p className="text-sm text-gray-500">No notes yet</p>
            <p className="text-xs text-gray-400 mt-0.5">Add a note to keep track of important details</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {notes.map((note) => (
              <div
                key={note.id}
                className="group relative rounded-lg bg-gray-50 p-3 transition-colors hover:bg-gray-100"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-gray-400 mb-1">
                      {formatDate(note.created_at, {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                    <p className="text-sm text-gray-900 whitespace-pre-wrap leading-relaxed">
                      {note.content}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDelete(note.id)}
                    disabled={deletingId === note.id}
                    className="shrink-0 rounded p-1 text-gray-400 opacity-0 transition-opacity hover:text-red-500 group-hover:opacity-100 disabled:opacity-50"
                    title="Delete note"
                  >
                    {deletingId === note.id ? (
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-gray-400 border-t-transparent block" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
