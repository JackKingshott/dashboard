import type { Client, Task, ClientNote, Invoice, InvoiceItem, Meeting, TaskPriority, TaskStatus, ClientStatus, BillingType, InvoiceStatus } from '@/types'

const KEYS = {
  clients: 'ss_clients',
  tasks: 'ss_tasks',
  notes: 'ss_notes',
  invoices: 'ss_invoices',
  invoice_items: 'ss_invoice_items',
  meetings: 'ss_meetings',
}

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

// ─── Clients ────────────────────────────────────────────────────────────────

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

// ─── Tasks ───────────────────────────────────────────────────────────────────

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
    const updated = all.map(t => {
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

// ─── Notes ───────────────────────────────────────────────────────────────────

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

// ─── Invoices ────────────────────────────────────────────────────────────────

export const localInvoices = {
  list(): Invoice[] {
    const invoices = load<Invoice>(KEYS.invoices)
    const items = load<InvoiceItem>(KEYS.invoice_items)
    const clients = load<Client>(KEYS.clients)
    return invoices.map(inv => ({
      ...inv,
      items: items.filter(i => i.invoice_id === inv.id),
      client: inv.client_id ? (() => { const c = clients.find(cl => cl.id === inv.client_id); return c ? { id: c.id, name: c.name, company: c.company, email: c.email } : undefined })() : undefined,
    }))
  },
  get(id: string): Invoice | null {
    return this.list().find(i => i.id === id) ?? null
  },
  add(data: Omit<Invoice, 'id' | 'created_at' | 'updated_at' | 'client' | 'items'> & { items?: Omit<InvoiceItem, 'id' | 'invoice_id'>[] }): Invoice {
    const { items: itemsData, ...invoiceData } = data
    const inv: Omit<Invoice, 'client' | 'items'> = { ...invoiceData, id: uid(), created_at: now(), updated_at: now() }
    const allInvoices = load<Invoice>(KEYS.invoices)
    save(KEYS.invoices, [inv, ...allInvoices])
    if (itemsData?.length) {
      const allItems = load<InvoiceItem>(KEYS.invoice_items)
      const newItems: InvoiceItem[] = itemsData.map(i => ({ ...i, id: uid(), invoice_id: inv.id }))
      save(KEYS.invoice_items, [...allItems, ...newItems])
    }
    return this.get(inv.id)!
  },
  update(id: string, data: Partial<Omit<Invoice, 'id' | 'created_at' | 'client' | 'items'>>): Invoice | null {
    const all = load<Invoice>(KEYS.invoices)
    const updated = all.map(i => i.id === id ? { ...i, ...data, updated_at: now() } : i)
    save(KEYS.invoices, updated)
    return this.get(id)
  },
  delete(id: string) {
    save(KEYS.invoices, load<Invoice>(KEYS.invoices).filter(i => i.id !== id))
    save(KEYS.invoice_items, load<InvoiceItem>(KEYS.invoice_items).filter(i => i.invoice_id !== id))
  },
  nextNumber(): string {
    const all = load<Invoice>(KEYS.invoices)
    const nums = all.map(i => parseInt(i.invoice_number.replace(/\D/g, '')) || 0)
    const next = nums.length ? Math.max(...nums) + 1 : 1
    return `INV-${String(next).padStart(4, '0')}`
  },
}

// ─── Meetings ────────────────────────────────────────────────────────────────

export const localMeetings = {
  list(): Meeting[] {
    const meetings = load<Meeting>(KEYS.meetings)
    const clients = load<Client>(KEYS.clients)
    return meetings
      .map(m => ({
        ...m,
        client: m.client_id ? (() => { const c = clients.find(cl => cl.id === m.client_id); return c ? { id: c.id, name: c.name, company: c.company } : undefined })() : undefined,
      }))
      .sort((a, b) => {
        const da = new Date(`${a.date}T${a.start_time}`)
        const db = new Date(`${b.date}T${b.start_time}`)
        return db.getTime() - da.getTime()
      })
  },
  upcoming(): Meeting[] {
    const today = new Date().toISOString().split('T')[0]
    return this.list()
      .filter(m => m.date >= today)
      .sort((a, b) => {
        const da = new Date(`${a.date}T${a.start_time}`)
        const db = new Date(`${b.date}T${b.start_time}`)
        return da.getTime() - db.getTime()
      })
  },
  get(id: string): Meeting | null { return this.list().find(m => m.id === id) ?? null },
  add(data: Omit<Meeting, 'id' | 'created_at' | 'updated_at' | 'client'>): Meeting {
    const all = load<Meeting>(KEYS.meetings)
    const meeting: Meeting = { ...data, id: uid(), created_at: now(), updated_at: now() }
    save(KEYS.meetings, [meeting, ...all])
    return this.get(meeting.id)!
  },
  update(id: string, data: Partial<Omit<Meeting, 'id' | 'created_at' | 'client'>>): Meeting | null {
    const all = load<Meeting>(KEYS.meetings)
    save(KEYS.meetings, all.map(m => m.id === id ? { ...m, ...data, updated_at: now() } : m))
    return this.get(id)
  },
  delete(id: string) {
    save(KEYS.meetings, load<Meeting>(KEYS.meetings).filter(m => m.id !== id))
  },
}
