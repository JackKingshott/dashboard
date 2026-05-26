import Link from 'next/link'
import { Plus, FileText } from 'lucide-react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { createAdminClient } from '@/lib/supabase/admin'
import { formatCurrency, formatDate } from '@/lib/utils'
import type { Invoice, InvoiceStatus } from '@/types'

const statusConfig: Record<InvoiceStatus, { label: string; variant: 'success' | 'default' | 'destructive' | 'secondary' | 'warning' }> = {
  paid: { label: 'Paid', variant: 'success' },
  sent: { label: 'Sent', variant: 'default' },
  overdue: { label: 'Overdue', variant: 'destructive' },
  draft: { label: 'Draft', variant: 'secondary' },
  cancelled: { label: 'Cancelled', variant: 'secondary' },
}

async function fetchInvoices(): Promise<Invoice[]> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) return []
  try {
    const supabase = createAdminClient()
    const { data, error } = await supabase
      .from('invoices')
      .select('*, client:clients(id, name, company, email)')
      .order('created_at', { ascending: false })
    if (error) return []
    return (data ?? []) as Invoice[]
  } catch {
    return []
  }
}

function InvoicesTable({ invoices }: { invoices: Invoice[] }) {
  if (invoices.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 py-16 text-center">
        <div className="rounded-full bg-gray-100 p-4 mb-4">
          <FileText className="h-8 w-8 text-gray-400" />
        </div>
        <p className="text-sm font-medium text-gray-900">No invoices found</p>
        <p className="text-xs text-gray-500 mt-1">Create your first invoice to get started</p>
        <Button className="mt-4" asChild>
          <Link href="/invoices/new">
            <Plus className="h-4 w-4" />
            New Invoice
          </Link>
        </Button>
      </div>
    )
  }

  return (
    <Card>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/50">
              <th className="px-4 py-3 text-left font-medium text-gray-500">Invoice #</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">Client</th>
              <th className="px-4 py-3 text-right font-medium text-gray-500">Amount</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">Status</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">Due Date</th>
              <th className="px-4 py-3 text-right font-medium text-gray-500">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {invoices.map((inv) => {
              const cfg = statusConfig[inv.status] ?? statusConfig.draft
              return (
                <tr key={inv.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-4 py-3">
                    <Link href={`/invoices/${inv.id}`} className="font-medium text-blue-600 hover:underline">
                      {inv.invoice_number}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-gray-700">
                    {inv.client?.name ?? <span className="text-gray-400 italic">No client</span>}
                    {inv.client?.company && (
                      <p className="text-xs text-gray-400">{inv.client.company}</p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right font-medium text-gray-900">
                    {formatCurrency(inv.total, inv.currency)}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={cfg.variant}>{cfg.label}</Badge>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{formatDate(inv.due_date)}</td>
                  <td className="px-4 py-3 text-right">
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/invoices/${inv.id}`}>View</Link>
                    </Button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </Card>
  )
}

export default async function InvoicesPage() {
  const invoices = await fetchInvoices()

  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

  const totalSent = invoices.filter((i) => i.status === 'sent').reduce((s, i) => s + i.total, 0)
  const totalPaidThisMonth = invoices
    .filter((i) => i.status === 'paid' && i.paid_at && new Date(i.paid_at) >= monthStart)
    .reduce((s, i) => s + i.total, 0)
  const totalOutstanding = invoices
    .filter((i) => i.status === 'sent' || i.status === 'overdue')
    .reduce((s, i) => s + i.total, 0)

  const tabs: { value: string; label: string; statuses?: InvoiceStatus[] }[] = [
    { value: 'all', label: 'All' },
    { value: 'draft', label: 'Draft', statuses: ['draft'] },
    { value: 'sent', label: 'Sent', statuses: ['sent'] },
    { value: 'paid', label: 'Paid', statuses: ['paid'] },
    { value: 'overdue', label: 'Overdue', statuses: ['overdue'] },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Invoices</h1>
          <p className="mt-1 text-sm text-gray-500">Manage and track all your invoices</p>
        </div>
        <Button asChild>
          <Link href="/invoices/new">
            <Plus className="h-4 w-4" />
            New Invoice
          </Link>
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-blue-700">{formatCurrency(totalSent)}</p>
            <p className="text-xs text-gray-500 mt-1">Total Sent</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-green-700">{formatCurrency(totalPaidThisMonth)}</p>
            <p className="text-xs text-gray-500 mt-1">Paid This Month</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-amber-700">{formatCurrency(totalOutstanding)}</p>
            <p className="text-xs text-gray-500 mt-1">Outstanding</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="all">
        <TabsList>
          {tabs.map((tab) => {
            const count = tab.statuses
              ? invoices.filter((i) => tab.statuses!.includes(i.status)).length
              : invoices.length
            return (
              <TabsTrigger key={tab.value} value={tab.value}>
                {tab.label}
                {count > 0 && (
                  <span className="ml-1.5 rounded-full bg-gray-200 px-1.5 py-0.5 text-xs">
                    {count}
                  </span>
                )}
              </TabsTrigger>
            )
          })}
        </TabsList>
        {tabs.map((tab) => {
          const filtered = tab.statuses
            ? invoices.filter((i) => tab.statuses!.includes(i.status))
            : invoices
          return (
            <TabsContent key={tab.value} value={tab.value}>
              <InvoicesTable invoices={filtered} />
            </TabsContent>
          )
        })}
      </Tabs>
    </div>
  )
}
