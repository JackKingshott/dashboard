import type { Client, Task, ClientNote, BillingType, ClientStatus, TaskPriority, TaskStatus } from '@/types'

const KEYS = { clients: 'ss_clients', tasks: 'ss_tasks', notes: 'ss_notes' }

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2)
}
function now() { return new Date().toISOString() }

function load<T>(key: string): T[] {
  if (typeof window === 'undefined') return []
  try { return JSON.parse(localStorage.getItem(key) ?? '[]') } catch { return [] }
}
function save<T>(key: string, data: T[]) {
  localStorage.setItem(key, JSON.stringify(data))
}

export function isUsingLocalStore() {
  return !process.env.NEXT_PUBLIC_SUPABASE_URL
}

export const localClients = {
  list(): Client[] { return load<Client>(KEYS.clients) },
  get(id: string): Client | null { return load<Client>(KEYS.clients).find(c => c.id === id) ?? null },
  add(data: Omit<Client, 'id' | 'created_at' | 'updated_at' | 'stripe_customer_id'>): Client {
    const all = load<Client>(KEYS.clients)
    const client: Client = { ...data, id: uid(), stripe_customer_id: null, created_at: now(), updated_at: now() }
    save(KEYS.clients, [client, ...all])
    return client
  },
  update(id: string, data: Partial<Omit<Client, 'id' | 'created_at'>>): Client | null {
    const all = load<Client>(KEYS.clients)
    const updated = all.map(c => c.id === id ? { ...c, ...data, updated_at: now() } : c)
    save(KEYS.clients, updated)
    return updated.find(c => c.id === id) ?? null
  },
  delete(id: string) {
    save(KEYS.clients, load<Client>(KEYS.clients).filter(c => c.id !== id))
    save(KEYS.notes, load<ClientNote>(KEYS.notes).filter(n => n.client_id !== id))
  },
}

export const localTasks = {
  list(): Task[] { return load<Task>(KEYS.tasks) },
  get(id: string): Task | null { return load<Task>(KEYS.tasks).find(t => t.id === id) ?? null },
  add(data: { title: string; description?: string | null; due_date?: string | null; priority: TaskPriority; client_id?: string | null }): Task {
    const all = load<Task>(KEYS.tasks)
    const clients = load<Client>(KEYS.clients)
    const client = data.client_id ? clients.find(c => c.id === data.client_id) : undefined
    const task: Task = {
      id: uid(),
      title: data.title,
      description: data.description ?? null,
      due_date: data.due_date ?? null,
      priority: data.priority,
      status: 'todo',
      client_id: data.client_id ?? null,
      client: client ? { id: client.id, name: client.name, company: client.company } : undefined,
      created_at: now(),
      updated_at: now(),
    }
    save(KEYS.tasks, [task, ...all])
    return task
  },
  update(id: string, data: Partial<Omit<Task, 'id' | 'created_at'>>): Task | null {
    const all = load<Task>(KEYS.tasks)
    let updated = all.map(t => {
      if (t.id !== id) return t
      const next = { ...t, ...data, updated_at: now() }
      if (data.client_id !== undefined) {
        const clients = load<Client>(KEYS.clients)
        const client = data.client_id ? clients.find(c => c.id === data.client_id) : undefined
        next.client = client ? { id: client.id, name: client.name, company: client.company } : undefined
      }
      return next
    })
    save(KEYS.tasks, updated)
    return updated.find(t => t.id === id) ?? null
  },
  delete(id: string) {
    save(KEYS.tasks, load<Task>(KEYS.tasks).filter(t => t.id !== id))
  },
}

export const localNotes = {
  list(clientId: string): ClientNote[] {
    return load<ClientNote>(KEYS.notes).filter(n => n.client_id === clientId)
  },
  add(clientId: string, content: string): ClientNote {
    const all = load<ClientNote>(KEYS.notes)
    const note: ClientNote = { id: uid(), client_id: clientId, content, created_at: now(), updated_at: now() }
    save(KEYS.notes, [note, ...all])
    return note
  },
  delete(id: string) {
    save(KEYS.notes, load<ClientNote>(KEYS.notes).filter(n => n.id !== id))
  },
}
