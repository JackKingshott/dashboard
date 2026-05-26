export type ClientStatus = 'active' | 'inactive' | 'prospect'
export type BillingType = 'retainer' | 'project' | 'both'
export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled'
export type TaskPriority = 'low' | 'medium' | 'high'
export type TaskStatus = 'todo' | 'in_progress' | 'done'

export interface Client {
  id: string
  name: string
  company: string | null
  email: string
  phone: string | null
  address: string | null
  currency: string
  billing_type: BillingType
  retainer_amount: number | null
  status: ClientStatus
  stripe_customer_id: string | null
  created_at: string
  updated_at: string
}

export interface ClientNote {
  id: string
  client_id: string
  content: string
  created_at: string
  updated_at: string
}

export interface Task {
  id: string
  title: string
  description: string | null
  due_date: string | null
  priority: TaskPriority
  status: TaskStatus
  client_id: string | null
  client?: Pick<Client, 'id' | 'name' | 'company'>
  created_at: string
  updated_at: string
}

export interface InvoiceItem {
  id: string
  invoice_id: string
  description: string
  quantity: number
  unit_price: number
  amount: number
}

export interface Invoice {
  id: string
  invoice_number: string
  client_id: string | null
  client?: Pick<Client, 'id' | 'name' | 'company' | 'email'>
  status: InvoiceStatus
  currency: string
  subtotal: number
  tax_rate: number
  tax_amount: number
  total: number
  due_date: string | null
  sent_at: string | null
  paid_at: string | null
  stripe_invoice_id: string | null
  stripe_payment_link: string | null
  notes: string | null
  items?: InvoiceItem[]
  created_at: string
  updated_at: string
}

export interface CalendarEvent {
  id: string
  summary: string
  description?: string
  start: { dateTime?: string; date?: string }
  end: { dateTime?: string; date?: string }
  attendees?: { email: string; displayName?: string }[]
  htmlLink?: string
}

export interface DashboardStats {
  revenueThisMonth: number
  outstandingTotal: number
  overdueCount: number
  activeClients: number
  tasksDueToday: number
  currency: string
}
