'use client'

import { useState, useEffect } from 'react'
import { Plus, Trash2, CheckSquare, Square, ChevronDown, ChevronUp, Tag, Pencil } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { formatRelativeDate } from '@/lib/utils'
import { localTasks, localClients, isUsingLocalStore } from '@/lib/local-store'
import type { Task, TaskPriority, Client } from '@/types'

const priorityConfig: Record<TaskPriority, { label: string; dot: string; badge: 'destructive' | 'warning' | 'success' }> = {
  high: { label: 'High', dot: 'bg-red-500', badge: 'destructive' },
  medium: { label: 'Medium', dot: 'bg-amber-500', badge: 'warning' },
  low: { label: 'Low', dot: 'bg-green-500', badge: 'success' },
}

function isToday(d: string | null) {
  if (!d) return false
  return d === new Date().toISOString().split('T')[0]
}
function isThisWeek(d: string | null) {
  if (!d) return false
  const now = new Date(), end = new Date(now)
  end.setDate(now.getDate() + 7)
  const dd = new Date(d)
  return dd >= now && dd <= end
}

interface TaskFormProps {
  open: boolean
  onOpenChange: (v: boolean) => void
  onSave: (task: Task) => void
  clients: Client[]
  initial?: Task | null
}

function TaskForm({ open, onOpenChange, onSave, clients, initial }: TaskFormProps) {
  const isEdit = !!initial
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState({ title: '', description: '', due_date: '', priority: 'medium' as TaskPriority, client_id: '' })

  useEffect(() => {
    if (open) {
      setError(null)
      setForm(initial ? {
        title: initial.title,
        description: initial.description ?? '',
        due_date: initial.due_date ?? '',
        priority: initial.priority,
        client_id: initial.client_id ?? '',
      } : { title: '', description: '', due_date: '', priority: 'medium', client_id: '' })
    }
  }, [open, initial])

  function set(f: string, v: string) { setForm(p => ({ ...p, [f]: v })) }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.title.trim()) { setError('Title is required'); return }
    setLoading(true); setError(null)
    const payload = { ...form, client_id: form.client_id || null, description: form.description || null, due_date: form.due_date || null }
    try {
      if (isUsingLocalStore()) {
        if (isEdit) {
          const updated = localTasks.update(initial!.id, payload)
          if (!updated) throw new Error('Failed')
          onSave(updated)
        } else {
          onSave(localTasks.add(payload))
        }
      } else {
        const url = isEdit ? `/api/tasks/${initial!.id}` : '/api/tasks'
        const method = isEdit ? 'PATCH' : 'POST'
        const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
        if (!res.ok) throw new Error((await res.json()).error ?? 'Failed')
        onSave(await res.json())
      }
      onOpenChange(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Task' : 'Add Task'}</DialogTitle>
          <DialogDescription>{isEdit ? 'Update the task details.' : 'Create a new task to track your work.'}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
          <div className="space-y-1.5">
            <Label htmlFor="title">Title *</Label>
            <Input id="title" value={form.title} onChange={e => set('title', e.target.value)} placeholder="Task title..." required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" value={form.description} onChange={e => set('description', e.target.value)} rows={2} className="resize-none" placeholder="Optional details..." />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="due_date">Due Date</Label>
              <Input id="due_date" type="date" value={form.due_date} onChange={e => set('due_date', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Priority</Label>
              <Select value={form.priority} onValueChange={v => set('priority', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          {clients.length > 0 && (
            <div className="space-y-1.5">
              <Label>Client (optional)</Label>
              <Select value={form.client_id} onValueChange={v => set('client_id', v)}>
                <SelectTrigger><SelectValue placeholder="No client" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="">No client</SelectItem>
                  {clients.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>Cancel</Button>
            <Button type="submit" disabled={loading}>
              {loading ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" /> : <Plus className="h-4 w-4" />}
              {isEdit ? 'Save Changes' : 'Add Task'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

interface TaskCardProps {
  task: Task
  onToggle: (id: string, done: boolean) => void
  onDelete: (id: string) => void
  onEdit: (task: Task) => void
}

function TaskCard({ task, onToggle, onDelete, onEdit }: TaskCardProps) {
  const done = task.status === 'done'
  const p = priorityConfig[task.priority]
  return (
    <Card className={`transition-opacity ${done ? 'opacity-60' : ''}`}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <button onClick={() => onToggle(task.id, !done)} className="mt-0.5 shrink-0 text-gray-400 hover:text-blue-600 transition-colors">
            {done ? <CheckSquare className="h-5 w-5 text-green-600" /> : <Square className="h-5 w-5" />}
          </button>
          <div className="flex-1 min-w-0">
            <p className={`font-medium text-gray-900 ${done ? 'line-through text-gray-400' : ''}`}>{task.title}</p>
            {task.description && <p className="text-sm text-gray-500 mt-0.5 truncate">{task.description}</p>}
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <div className="flex items-center gap-1">
                <div className={`h-2 w-2 rounded-full ${p.dot}`} />
                <span className="text-xs text-gray-500">{p.label}</span>
              </div>
              {task.due_date && (
                <Badge variant={isToday(task.due_date) && !done ? 'warning' : 'secondary'} className="text-xs">
                  {formatRelativeDate(task.due_date)}
                </Badge>
              )}
              {task.client && (
                <Badge variant="outline" className="text-xs gap-1">
                  <Tag className="h-2.5 w-2.5" />
                  {task.client.name}
                </Badge>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <button onClick={() => onEdit(task)} className="rounded p-1 text-gray-400 hover:text-blue-600 transition-colors" title="Edit task">
              <Pencil className="h-4 w-4" />
            </button>
            <button onClick={() => onDelete(task.id)} className="rounded p-1 text-gray-400 hover:text-red-500 transition-colors" title="Delete task">
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

interface TaskListProps {
  items: Task[]
  onToggle: (id: string, done: boolean) => void
  onDelete: (id: string) => void
  onEdit: (task: Task) => void
}

function TaskList({ items, onToggle, onDelete, onEdit }: TaskListProps) {
  if (items.length === 0) return <div className="text-center py-10 text-sm text-gray-400">No tasks here</div>
  return (
    <div className="space-y-2">
      {items.map(t => (
        <TaskCard key={t.id} task={t} onToggle={onToggle} onDelete={onDelete} onEdit={onEdit} />
      ))}
    </div>
  )
}

export default function TodoPage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [addOpen, setAddOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [showDone, setShowDone] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (isUsingLocalStore()) {
      setTasks(localTasks.list())
      setClients(localClients.list())
      setLoading(false)
      return
    }
    Promise.all([
      fetch('/api/tasks').then(r => r.json()),
      fetch('/api/clients').then(r => r.json()),
    ]).then(([t, c]) => {
      if (Array.isArray(t)) setTasks(t)
      if (Array.isArray(c)) setClients(c)
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  async function handleToggle(id: string, markDone: boolean) {
    const status = markDone ? 'done' : 'todo'
    setTasks(t => t.map(task => task.id === id ? { ...task, status } : task))
    if (isUsingLocalStore()) {
      localTasks.update(id, { status })
    } else {
      await fetch(`/api/tasks/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) }).catch(() => {})
    }
  }

  async function handleDelete(id: string) {
    setTasks(t => t.filter(task => task.id !== id))
    if (isUsingLocalStore()) {
      localTasks.delete(id)
    } else {
      await fetch(`/api/tasks/${id}`, { method: 'DELETE' }).catch(() => {})
    }
  }

  function handleSaved(task: Task) {
    setTasks(prev => {
      const exists = prev.find(t => t.id === task.id)
      return exists ? prev.map(t => t.id === task.id ? task : t) : [task, ...prev]
    })
  }

  const active = tasks.filter(t => t.status !== 'done')
  const done = tasks.filter(t => t.status === 'done')
  const today = active.filter(t => isToday(t.due_date))
  const thisWeek = active.filter(t => !isToday(t.due_date) && isThisWeek(t.due_date))
  const high = active.filter(t => t.priority === 'high')

  function handleEdit(task: Task) { setEditingTask(task); setAddOpen(true) }

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tasks</h1>
          <p className="mt-1 text-sm text-gray-500">{active.length} pending · {done.length} completed</p>
        </div>
        <Button onClick={() => { setEditingTask(null); setAddOpen(true) }}>
          <Plus className="h-4 w-4" />
          Add Task
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
        </div>
      ) : (
        <>
          <Tabs defaultValue="all">
            <TabsList>
              <TabsTrigger value="all">
                All{active.length > 0 && <span className="ml-1.5 rounded-full bg-gray-200 px-1.5 py-0.5 text-xs">{active.length}</span>}
              </TabsTrigger>
              <TabsTrigger value="today">
                Today{today.length > 0 && <span className="ml-1.5 rounded-full bg-amber-200 px-1.5 py-0.5 text-xs">{today.length}</span>}
              </TabsTrigger>
              <TabsTrigger value="week">This Week</TabsTrigger>
              <TabsTrigger value="priority">
                High Priority{high.length > 0 && <span className="ml-1.5 rounded-full bg-red-200 px-1.5 py-0.5 text-xs">{high.length}</span>}
              </TabsTrigger>
            </TabsList>
            <TabsContent value="all"><TaskList items={active} onToggle={handleToggle} onDelete={handleDelete} onEdit={handleEdit} /></TabsContent>
            <TabsContent value="today"><TaskList items={today} onToggle={handleToggle} onDelete={handleDelete} onEdit={handleEdit} /></TabsContent>
            <TabsContent value="week"><TaskList items={thisWeek} onToggle={handleToggle} onDelete={handleDelete} onEdit={handleEdit} /></TabsContent>
            <TabsContent value="priority"><TaskList items={high} onToggle={handleToggle} onDelete={handleDelete} onEdit={handleEdit} /></TabsContent>
          </Tabs>

          {done.length > 0 && (
            <div>
              <button onClick={() => setShowDone(v => !v)} className="flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors">
                {showDone ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                Completed ({done.length})
              </button>
              {showDone && (
                <div className="mt-3 space-y-2">
                  {done.map(t => (
                    <TaskCard key={t.id} task={t} onToggle={handleToggle} onDelete={handleDelete} onEdit={handleEdit} />
                  ))}
                </div>
              )}
            </div>
          )}

          <TaskForm
            open={addOpen}
            onOpenChange={open => { setAddOpen(open); if (!open) setEditingTask(null) }}
            onSave={handleSaved}
            clients={clients}
            initial={editingTask}
          />
        </>
      )}
    </div>
  )
}
