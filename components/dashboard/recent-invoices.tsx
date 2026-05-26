import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatCurrency, formatDate } from '@/lib/utils'
import { createAdminClient } from '@/lib/supabase/admin'
import type { Invoice, InvoiceStatus } from '@/types'

async function fetchRecentInvoices() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) return []
  try {
    const supabase = createAdminClient()
    const { data, error } = await supabase
      .from('invoices')
      .select('*, client:clients(id, name, company)')
      .order('created_at', { ascending: false })
      .limit(5)
    if (error) return []
    return (data ?? []) as Invoice[]
  } catch {
    return []
  }
}

const statusConfig: Record<InvoiceStatus, { label: string; variant: 'success' | 'default' | 'destructive' | 'secondary' | 'warning' }> = {
  paid: { label: 'Paid', variant: 'success' },
  sent: { label: 'Sent', variant: 'default' },
  overdue: { label: 'Overdue', variant: 'destructive' },
  draft: { label: 'Draft', variant: 'secondary' },
  cancelled: { label: 'Cancelled', variant: 'secondary' },
}

export default async function RecentInvoices() {
  const invoices = await fetchRecentInvoices()

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base">Recent Invoices</CardTitle>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/invoices" className="text-xs text-blue-600 flex items-center gap-1">
            View all <ArrowRight className="h-3 w-3" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent>
        {invoices.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <p className="text-sm text-gray-500">No invoices yet</p>
            <Button variant="outline" size="sm" className="mt-3" asChild>
              <Link href="/invoices/new">Create your first invoice</Link>
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="pb-3 text-left font-medium text-gray-500">Invoice #</th>
                  <th className="pb-3 text-left font-medium text-gray-500">Client</th>
                  <th className="pb-3 text-right font-medium text-gray-500">Amount</th>
                  <th className="pb-3 text-left font-medium text-gray-500 pl-4">Status</th>
                  <th className="pb-3 text-left font-medium text-gray-500">Due</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {invoices.map((inv) => {
                  const cfg = statusConfig[inv.status] ?? statusConfig.draft
                  return (
                    <tr key={inv.id} className="group hover:bg-gray-50/50 transition-colors">
                      <td className="py-3 pr-4">
                        <Link
                          href={`/invoices/${inv.id}`}
                          className="font-medium text-blue-600 hover:underline"
                        >
                          {inv.invoice_number}
                        </Link>
                      </td>
                      <td className="py-3 pr-4 text-gray-700">
                        {inv.client?.name ?? <span className="text-gray-400 italic">No client</span>}
                      </td>
                      <td className="py-3 pr-4 text-right font-medium text-gray-900">
                        {formatCurrency(inv.total, inv.currency)}
                      </td>
                      <td className="py-3 pl-4 pr-4">
                        <Badge variant={cfg.variant}>{cfg.label}</Badge>
                      </td>
                      <td className="py-3 text-gray-500">{formatDate(inv.due_date)}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
