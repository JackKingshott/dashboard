'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Plus, Trash2, Send, Save } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { formatCurrency, CURRENCIES } from '@/lib/utils'
import { localClients, localInvoices, isUsingLocalStore } from '@/lib/local-store'
import type { Client } from '@/types'

interface LineItem {
  id: string
  description: string
  quantity: number
  unit_price: number
  amount: number
}

function generateId() {
  return Math.random().toString(36).slice(2, 9)
}

function generateInvoiceNumber() {
  const date = new Date()
  const seq = Math.floor(Math.random() * 900) + 100
  return `INV-${date.getFullYear()}-${seq}`
}

export default function NewInvoicePage() {
  const router = useRouter()
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)

  const [form, setForm] = useState({
    client_id: '',
    invoice_number: '',
    currency: 'GBP',
    due_date: '',
    notes: '',
    tax_rate: '0',
  })

  const [items, setItems] = useState<LineItem[]>([
    { id: '1', description: '', quantity: 1, unit_price: 0, amount: 0 },
  ])

  useEffect(() => {
    if (isUsingLocalStore()) {
      setClients(localClients.list())
      setForm(f => ({ ...f, invoice_number: localInvoices.nextNumber() }))
    } else {
      setForm(f => ({ ...f, invoice_number: generateInvoiceNumber() }))
      fetch('/api/clients')
        .then((r) => r.json())
        .then((data) => Array.isArray(data) && setClients(data))
        .catch(() => {})
    }
    setItems([{ id: generateId(), description: '', quantity: 1, unit_price: 0, amount: 0 }])
    setMounted(true)
  }, [])

  function setField(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  function updateItem(id: string, field: keyof LineItem, value: string | number) {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item
        const updated = { ...item, [field]: value }
        if (field === 'quantity' || field === 'unit_price') {
          updated.amount = Number(updated.quantity) * Number(updated.unit_price)
        }
        return updated
      })
    )
  }

  function addItem() {
    setItems((prev) => [
      ...prev,
      { id: generateId(), description: '', quantity: 1, unit_price: 0, amount: 0 },
    ])
  }

  function removeItem(id: string) {
    setItems((prev) => prev.filter((i) => i.id !== id))
  }

  const subtotal = items.reduce((sum, item) => sum + item.amount, 0)
  const taxRate = parseFloat(form.tax_rate) || 0
  const taxAmount = subtotal * (taxRate / 100)
  const total = subtotal + taxAmount

  async function handleSubmit(send: boolean) {
    setError(null)
    if (!form.client_id) {
      setError('Please select a client')
      return
    }
    if (items.some((i) => !i.description.trim())) {
      setError('All line items must have a description')
      return
    }
    setLoading(true)
    try {
      if (isUsingLocalStore()) {
        const invoice = localInvoices.add({
          ...form,
          tax_rate: taxRate,
          subtotal,
          tax_amount: taxAmount,
          total,
          status: (send ? 'sent' : 'draft') as 'sent' | 'draft',
          client_id: form.client_id || null,
          items: items.map(({ id: _id, ...item }) => item),
          stripe_invoice_id: null,
          sent_at: send ? new Date().toISOString() : null,
          paid_at: null,
          stripe_payment_link: null,
        })
        router.push(`/invoices/${invoice.id}`)
        return
      }
      const res = await fetch('/api/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          tax_rate: taxRate,
          subtotal,
          tax_amount: taxAmount,
          total,
          items: items.map(({ id: _id, ...item }) => item),
          send,
        }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error ?? 'Failed to create invoice')
      }
      const invoice = await res.json()
      router.push(`/invoices/${invoice.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setLoading(false)
    }
  }

  if (!mounted) {
    return (
      <div className="flex justify-center py-24">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/invoices">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">New Invoice</h1>
          <p className="mt-0.5 text-sm text-gray-500">Create and send a new invoice</p>
        </div>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      {/* Main form */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          {/* Invoice details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Invoice Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Client *</Label>
                  <Select value={form.client_id} onValueChange={(v) => setField('client_id', v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select client..." />
                    </SelectTrigger>
                    <SelectContent>
                      {clients.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name}{c.company ? ` — ${c.company}` : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="invoice_number">Invoice Number</Label>
                  <Input
                    id="invoice_number"
                    value={form.invoice_number}
                    onChange={(e) => setField('invoice_number', e.target.value)}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Currency</Label>
                  <Select value={form.currency} onValueChange={(v) => setField('currency', v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CURRENCIES.map((c) => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="due_date">Due Date</Label>
                  <Input
                    id="due_date"
                    type="date"
                    value={form.due_date}
                    onChange={(e) => setField('due_date', e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Line items */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Line Items</CardTitle>
              <Button variant="outline" size="sm" onClick={addItem}>
                <Plus className="h-3.5 w-3.5" />
                Add Item
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="grid grid-cols-12 gap-2 text-xs font-medium text-gray-500 px-1">
                  <div className="col-span-6">Description</div>
                  <div className="col-span-2 text-center">Qty</div>
                  <div className="col-span-2 text-right">Unit Price</div>
                  <div className="col-span-1 text-right">Amount</div>
                  <div className="col-span-1" />
                </div>
                {items.map((item) => (
                  <div key={item.id} className="grid grid-cols-12 gap-2 items-center">
                    <div className="col-span-6">
                      <Input
                        value={item.description}
                        onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                        placeholder="Service description..."
                        className="text-sm"
                      />
                    </div>
                    <div className="col-span-2">
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.quantity}
                        onChange={(e) => updateItem(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                        className="text-sm text-center"
                      />
                    </div>
                    <div className="col-span-2">
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.unit_price}
                        onChange={(e) => updateItem(item.id, 'unit_price', parseFloat(e.target.value) || 0)}
                        className="text-sm text-right"
                      />
                    </div>
                    <div className="col-span-1 text-right text-sm font-medium text-gray-900 px-1">
                      {formatCurrency(item.amount, form.currency)}
                    </div>
                    <div className="col-span-1 flex justify-end">
                      {items.length > 1 && (
                        <button
                          onClick={() => removeItem(item.id)}
                          className="rounded p-1 text-gray-400 hover:text-red-500 transition-colors"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Notes */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={form.notes}
                onChange={(e) => setField('notes', e.target.value)}
                placeholder="Payment terms, additional information..."
                rows={3}
                className="resize-none"
              />
            </CardContent>
          </Card>
        </div>

        {/* Sidebar: totals + actions */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Subtotal</span>
                <span className="font-medium">{formatCurrency(subtotal, form.currency)}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500 shrink-0">Tax</span>
                <div className="flex items-center gap-1 ml-auto">
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={form.tax_rate}
                    onChange={(e) => setField('tax_rate', e.target.value)}
                    className="w-16 h-7 text-xs text-right"
                  />
                  <span className="text-sm text-gray-500">%</span>
                </div>
              </div>
              {taxAmount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Tax Amount</span>
                  <span className="font-medium">{formatCurrency(taxAmount, form.currency)}</span>
                </div>
              )}
              <div className="border-t border-gray-100 pt-3 flex justify-between">
                <span className="font-semibold text-gray-900">Total</span>
                <span className="font-bold text-gray-900 text-lg">
                  {formatCurrency(total, form.currency)}
                </span>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-2">
            <Button
              className="w-full"
              onClick={() => handleSubmit(true)}
              disabled={loading}
            >
              {loading ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              Create &amp; Send via Stripe
            </Button>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => handleSubmit(false)}
              disabled={loading}
            >
              <Save className="h-4 w-4" />
              Save as Draft
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
