'use client'

import { useState, useEffect } from 'react'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { CURRENCIES } from '@/lib/utils'
import { localClients, isUsingLocalStore } from '@/lib/local-store'
import type { Client, BillingType, ClientStatus } from '@/types'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: (client: Client) => void
  client?: Client | null
}

const emptyForm = {
  name: '', company: '', email: '', phone: '', address: '',
  currency: 'GBP', billing_type: 'project' as BillingType,
  retainer_amount: '', status: 'active' as ClientStatus,
}

export function ClientDialog({ open, onOpenChange, onSuccess, client }: Props) {
  const isEdit = !!client
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState(emptyForm)

  useEffect(() => {
    if (open) {
      setError(null)
      setForm(client ? {
        name: client.name,
        company: client.company ?? '',
        email: client.email,
        phone: client.phone ?? '',
        address: client.address ?? '',
        currency: client.currency,
        billing_type: client.billing_type,
        retainer_amount: client.retainer_amount ? String(client.retainer_amount) : '',
        status: client.status,
      } : emptyForm)
    }
  }, [open, client])

  function set(field: string, value: string) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (!form.name.trim() || !form.email.trim()) {
      setError('Name and email are required.')
      return
    }
    setLoading(true)
    const payload = {
      name: form.name.trim(),
      company: form.company.trim() || null,
      email: form.email.trim(),
      phone: form.phone.trim() || null,
      address: form.address.trim() || null,
      currency: form.currency,
      billing_type: form.billing_type,
      retainer_amount: form.retainer_amount ? Number(form.retainer_amount) : null,
      status: form.status,
    }
    try {
      if (isUsingLocalStore()) {
        const result = isEdit
          ? localClients.update(client!.id, payload)
          : localClients.add(payload)
        if (!result) throw new Error('Failed to save client')
        onSuccess(result)
      } else {
        const url = isEdit ? `/api/clients/${client!.id}` : '/api/clients'
        const method = isEdit ? 'PATCH' : 'POST'
        const res = await fetch(url, {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        if (!res.ok) throw new Error((await res.json()).error ?? 'Failed')
        onSuccess(await res.json())
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const showRetainer = form.billing_type === 'retainer' || form.billing_type === 'both'

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Client' : 'Add New Client'}</DialogTitle>
          <DialogDescription>{isEdit ? 'Update client details.' : 'Fill in the client details below.'}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="name">Name *</Label>
              <Input id="name" value={form.name} onChange={e => set('name', e.target.value)} placeholder="Jane Smith" required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="company">Company</Label>
              <Input id="company" value={form.company} onChange={e => set('company', e.target.value)} placeholder="Acme Ltd" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="email">Email *</Label>
              <Input id="email" type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="jane@acme.com" required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="+44 7700 900000" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="address">Address</Label>
            <Input id="address" value={form.address} onChange={e => set('address', e.target.value)} placeholder="123 High Street, London" />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label>Currency</Label>
              <Select value={form.currency} onValueChange={v => set('currency', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{CURRENCIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Billing Type</Label>
              <Select value={form.billing_type} onValueChange={v => set('billing_type', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="retainer">Retainer</SelectItem>
                  <SelectItem value="project">Project</SelectItem>
                  <SelectItem value="both">Both</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={v => set('status', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="prospect">Prospect</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          {showRetainer && (
            <div className="space-y-1.5">
              <Label htmlFor="retainer_amount">Monthly Retainer Amount</Label>
              <Input
                id="retainer_amount"
                type="number"
                min="0"
                step="0.01"
                value={form.retainer_amount}
                onChange={e => set('retainer_amount', e.target.value)}
                placeholder="0.00"
              />
            </div>
          )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>Cancel</Button>
            <Button type="submit" disabled={loading}>
              {loading ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" /> : null}
              {isEdit ? 'Save Changes' : 'Add Client'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
