import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, Send, Copy, CheckCircle, AlertTriangle, ExternalLink } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { createAdminClient } from '@/lib/supabase/admin'
import { formatCurrency, formatDate } from '@/lib/utils'
import type { Invoice, InvoiceStatus } from '@/types'
import { InvoiceActions } from '@/components/invoices/invoice-actions'

const statusConfig: Record<InvoiceStatus, { label: string; variant: 'success' | 'default' | 'destructive' | 'secondary' | 'warning' }> = {
  paid: { label: 'Paid', variant: 'success' },
  sent: { label: 'Sent', variant: 'default' },
  overdue: { label: 'Overdue', variant: 'destructive' },
  draft: { label: 'Draft', variant: 'secondary' },
  cancelled: { label: 'Cancelled', variant: 'secondary' },
}

async function fetchInvoice(id: string): Promise<Invoice | null> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) return null
  try {
    const supabase = createAdminClient()
    const { data, error } = await supabase
      .from('invoices')
      .select('*, client:clients(id, name, company, email), items:invoice_items(*)')
      .eq('id', id)
      .single()
    if (error || !data) return null
    return data as Invoice
  } catch {
    return null
  }
}

interface Props {
  params: Promise<{ id: string }>
}

export default async function InvoiceDetailPage({ params }: Props) {
  const { id } = await params
  const invoice = await fetchInvoice(id)
  if (!invoice) notFound()

  const cfg = statusConfig[invoice.status] ?? statusConfig.draft
  const isOverdue = invoice.status === 'overdue'

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/invoices">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">{invoice.invoice_number}</h1>
            <Badge variant={cfg.variant}>{cfg.label}</Badge>
          </div>
          <p className="mt-0.5 text-sm text-gray-500">
            Created {formatDate(invoice.created_at)}
            {invoice.sent_at && ` · Sent ${formatDate(invoice.sent_at)}`}
            {invoice.paid_at && ` · Paid ${formatDate(invoice.paid_at)}`}
          </p>
        </div>
      </div>

      {/* Overdue banner */}
      {isOverdue && (
        <div className="flex items-center gap-3 rounded-xl bg-red-50 border border-red-200 px-4 py-3">
          <AlertTriangle className="h-5 w-5 text-red-600 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-red-800">This invoice is overdue</p>
            <p className="text-xs text-red-600">Due date was {formatDate(invoice.due_date)}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          {/* Client info */}
          {invoice.client && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Bill To</CardTitle>
              </CardHeader>
              <CardContent>
                <Link href={`/crm/${invoice.client.id}`} className="hover:underline">
                  <p className="font-semibold text-gray-900">{invoice.client.name}</p>
                </Link>
                {invoice.client.company && (
                  <p className="text-sm text-gray-500">{invoice.client.company}</p>
                )}
                <p className="text-sm text-gray-500 mt-1">{invoice.client.email}</p>
              </CardContent>
            </Card>
          )}

          {/* Line items */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Line Items</CardTitle>
            </CardHeader>
            <CardContent>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="pb-3 text-left font-medium text-gray-500">Description</th>
                    <th className="pb-3 text-center font-medium text-gray-500">Qty</th>
                    <th className="pb-3 text-right font-medium text-gray-500">Unit Price</th>
                    <th className="pb-3 text-right font-medium text-gray-500">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {(invoice.items ?? []).map((item) => (
                    <tr key={item.id}>
                      <td className="py-3 text-gray-900">{item.description}</td>
                      <td className="py-3 text-center text-gray-600">{item.quantity}</td>
                      <td className="py-3 text-right text-gray-600">
                        {formatCurrency(item.unit_price, invoice.currency)}
                      </td>
                      <td className="py-3 text-right font-medium text-gray-900">
                        {formatCurrency(item.amount, invoice.currency)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Totals */}
              <div className="mt-4 border-t border-gray-100 pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Subtotal</span>
                  <span>{formatCurrency(invoice.subtotal, invoice.currency)}</span>
                </div>
                {invoice.tax_rate > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Tax ({invoice.tax_rate}%)</span>
                    <span>{formatCurrency(invoice.tax_amount, invoice.currency)}</span>
                  </div>
                )}
                <div className="flex justify-between font-semibold text-gray-900 pt-2 border-t border-gray-100">
                  <span>Total</span>
                  <span className="text-xl">{formatCurrency(invoice.total, invoice.currency)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {invoice.notes && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 whitespace-pre-wrap">{invoice.notes}</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Actions sidebar */}
        <div>
          <InvoiceActions invoice={invoice} />
        </div>
      </div>
    </div>
  )
}
