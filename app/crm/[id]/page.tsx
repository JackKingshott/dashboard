import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, Building2, Mail, Phone, MapPin, CreditCard, Calendar } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { createAdminClient } from '@/lib/supabase/admin'
import { formatCurrency, formatDate } from '@/lib/utils'
import type { Client, ClientNote, ClientStatus } from '@/types'
import { ClientNotes } from '@/components/crm/client-notes'

const statusConfig: Record<ClientStatus, { label: string; variant: 'success' | 'secondary' | 'warning' }> = {
  active: { label: 'Active', variant: 'success' },
  inactive: { label: 'Inactive', variant: 'secondary' },
  prospect: { label: 'Prospect', variant: 'warning' },
}

async function fetchClient(id: string): Promise<{ client: Client; notes: ClientNote[] } | null> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) return null
  try {
    const supabase = createAdminClient()
    const [clientRes, notesRes] = await Promise.all([
      supabase.from('clients').select('*').eq('id', id).single(),
      supabase.from('client_notes').select('*').eq('client_id', id).order('created_at', { ascending: false }),
    ])
    if (clientRes.error || !clientRes.data) return null
    return {
      client: clientRes.data as Client,
      notes: (notesRes.data ?? []) as ClientNote[],
    }
  } catch {
    return null
  }
}

interface Props {
  params: Promise<{ id: string }>
}

export default async function ClientDetailPage({ params }: Props) {
  const { id } = await params
  const result = await fetchClient(id)
  if (!result) notFound()

  const { client, notes } = result
  const cfg = statusConfig[client.status]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/crm">
            <ArrowLeft className="h-4 w-4" />
          </Link>
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
        <Button variant="outline" asChild>
          <Link href={`/crm/${id}/edit`}>Edit Client</Link>
        </Button>
      </div>

      {/* Two column layout */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Client Details */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Client Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <Mail className="h-4 w-4 text-gray-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs text-gray-500">Email</p>
                  <a href={`mailto:${client.email}`} className="text-sm text-blue-600 hover:underline">
                    {client.email}
                  </a>
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
              {client.retainer_amount && (
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-500">Monthly Retainer</p>
                  <p className="text-sm font-medium text-gray-900">
                    {formatCurrency(client.retainer_amount, client.currency)}
                  </p>
                </div>
              )}
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

        {/* Notes */}
        <ClientNotes clientId={client.id} initialNotes={notes} />
      </div>
    </div>
  )
}
