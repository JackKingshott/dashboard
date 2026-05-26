'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Building2, Mail, Phone, MapPin, CreditCard, Calendar, Pencil } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ClientNotes } from '@/components/crm/client-notes'
import { ClientDialog } from '@/components/crm/client-dialog'
import { formatCurrency, formatDate } from '@/lib/utils'
import { localClients, localNotes, isUsingLocalStore } from '@/lib/local-store'
import type { Client, ClientNote, ClientStatus } from '@/types'

const statusConfig: Record<ClientStatus, { label: string; variant: 'success' | 'secondary' | 'warning' }> = {
  active: { label: 'Active', variant: 'success' },
  inactive: { label: 'Inactive', variant: 'secondary' },
  prospect: { label: 'Prospect', variant: 'warning' },
}

export default function ClientDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [client, setClient] = useState<Client | null>(null)
  const [notes, setNotes] = useState<ClientNote[]>([])
  const [loading, setLoading] = useState(true)
  const [editOpen, setEditOpen] = useState(false)

  useEffect(() => {
    if (!id) return
    if (isUsingLocalStore()) {
      const c = localClients.get(id)
      if (!c) { router.push('/crm'); return }
      setClient(c)
      setNotes(localNotes.list(id))
      setLoading(false)
      return
    }
    Promise.all([
      fetch(`/api/clients/${id}`).then(r => r.ok ? r.json() : null),
      fetch(`/api/clients/${id}/notes`).then(r => r.ok ? r.json() : []),
    ]).then(([c, n]) => {
      if (!c) { router.push('/crm'); return }
      setClient(c)
      setNotes(Array.isArray(n) ? n : [])
    }).catch(() => router.push('/crm'))
      .finally(() => setLoading(false))
  }, [id, router])

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
      </div>
    )
  }

  if (!client) return null

  const cfg = statusConfig[client.status]

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/crm"><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">{client.name}</h1>
            <Badge variant={cfg.variant}>{cfg.label}</Badge>
          </div>
          {client.company && (
            <p className="text-sm text-gray-500 flex items-center gap-1 mt-0.5">
              <Building2 className="h-3.5 w-3.5" />
              {client.company}
            </p>
          )}
        </div>
        <Button variant="outline" onClick={() => setEditOpen(true)}>
          <Pencil className="h-4 w-4" />
          Edit Client
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-base">Client Details</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <Mail className="h-4 w-4 text-gray-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs text-gray-500">Email</p>
                  <a href={`mailto:${client.email}`} className="text-sm text-blue-600 hover:underline">{client.email}</a>
                </div>
              </div>
              {client.phone && (
                <div className="flex items-start gap-3">
                  <Phone className="h-4 w-4 text-gray-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs text-gray-500">Phone</p>
                    <p className="text-sm text-gray-900">{client.phone}</p>
                  </div>
                </div>
              )}
              {client.address && (
                <div className="flex items-start gap-3">
                  <MapPin className="h-4 w-4 text-gray-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs text-gray-500">Address</p>
                    <p className="text-sm text-gray-900">{client.address}</p>
                  </div>
                </div>
              )}
            </div>
            <div className="border-t border-gray-100 pt-4 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-500">Currency</p>
                <p className="text-sm font-medium text-gray-900">{client.currency}</p>
              </div>
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-500">Billing Type</p>
                <p className="text-sm font-medium text-gray-900 capitalize">{client.billing_type}</p>
              </div>
              {client.retainer_amount ? (
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-500">Monthly Retainer</p>
                  <p className="text-sm font-medium text-gray-900">{formatCurrency(client.retainer_amount, client.currency)}</p>
                </div>
              ) : null}
              {client.stripe_customer_id && (
                <div className="flex items-start gap-3 pt-1">
                  <CreditCard className="h-4 w-4 text-gray-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs text-gray-500">Stripe Customer</p>
                    <a
                      href={`https://dashboard.stripe.com/customers/${client.stripe_customer_id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:underline font-mono"
                    >
                      {client.stripe_customer_id}
                    </a>
                  </div>
                </div>
              )}
              <div className="flex items-start gap-3 pt-1">
                <Calendar className="h-4 w-4 text-gray-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs text-gray-500">Client Since</p>
                  <p className="text-sm text-gray-900">{formatDate(client.created_at)}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <ClientNotes clientId={client.id} initialNotes={notes} />
      </div>

      <ClientDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        client={client}
        onSuccess={updated => { setClient(updated); setEditOpen(false) }}
      />
    </div>
  )
}
