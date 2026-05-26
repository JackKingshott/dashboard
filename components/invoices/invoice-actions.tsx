'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Send, Copy, CheckCircle, ExternalLink } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { formatDate } from '@/lib/utils'
import type { Invoice } from '@/types'

interface Props {
  invoice: Invoice
}

export function InvoiceActions({ invoice }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSend() {
    setLoading('send')
    setError(null)
    try {
      const res = await fetch(`/api/invoices/${invoice.id}/send`, { method: 'POST' })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error ?? 'Failed to send invoice')
      }
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send')
    } finally {
      setLoading(null)
    }
  }

  async function handleMarkPaid() {
    setLoading('paid')
    setError(null)
    try {
      const res = await fetch(`/api/invoices/${invoice.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'paid', paid_at: new Date().toISOString() }),
      })
      if (!res.ok) throw new Error('Failed to update')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update')
    } finally {
      setLoading(null)
    }
  }

  async function copyPaymentLink() {
    if (!invoice.stripe_payment_link) return
    await navigator.clipboard.writeText(invoice.stripe_payment_link)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Actions</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {error && (
          <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
        )}

        {/* Send via Stripe (for draft) */}
        {(invoice.status === 'draft' || invoice.status === 'overdue') && (
          <Button className="w-full" onClick={handleSend} disabled={loading === 'send'}>
            {loading === 'send' ? (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            Send via Stripe
          </Button>
        )}

        {/* Copy payment link */}
        {invoice.stripe_payment_link && invoice.status !== 'paid' && (
          <Button variant="outline" className="w-full" onClick={copyPaymentLink}>
            {copied ? (
              <>
                <CheckCircle className="h-4 w-4 text-green-600" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="h-4 w-4" />
                Copy Payment Link
              </>
            )}
          </Button>
        )}

        {/* View on Stripe */}
        {invoice.stripe_invoice_id && (
          <Button variant="ghost" className="w-full" asChild>
            <a
              href={`https://dashboard.stripe.com/invoices/${invoice.stripe_invoice_id}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <ExternalLink className="h-4 w-4" />
              View on Stripe
            </a>
          </Button>
        )}

        {/* Mark as paid */}
        {(invoice.status === 'sent' || invoice.status === 'overdue') && (
          <Button
            variant="outline"
            className="w-full border-green-200 text-green-700 hover:bg-green-50"
            onClick={handleMarkPaid}
            disabled={loading === 'paid'}
          >
            {loading === 'paid' ? (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-green-700 border-t-transparent" />
            ) : (
              <CheckCircle className="h-4 w-4" />
            )}
            Mark as Paid
          </Button>
        )}

        {/* Info */}
        <div className="border-t border-gray-100 pt-3 space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">Due</span>
            <span className="font-medium text-gray-900">{formatDate(invoice.due_date)}</span>
          </div>
          {invoice.sent_at && (
            <div className="flex justify-between">
              <span className="text-gray-500">Sent</span>
              <span className="text-gray-700">{formatDate(invoice.sent_at)}</span>
            </div>
          )}
          {invoice.paid_at && (
            <div className="flex justify-between">
              <span className="text-gray-500">Paid</span>
              <span className="text-green-700 font-medium">{formatDate(invoice.paid_at)}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
