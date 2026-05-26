'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Users, Search, Building2, Mail, Phone, Plus } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { AddClientDialog } from '@/components/crm/add-client-dialog'
import { formatCurrency } from '@/lib/utils'
import type { Client, ClientStatus } from '@/types'

const statusConfig: Record<ClientStatus, { label: string; variant: 'success' | 'secondary' | 'warning' }> = {
  active: { label: 'Active', variant: 'success' },
  inactive: { label: 'Inactive', variant: 'secondary' },
  prospect: { label: 'Prospect', variant: 'warning' },
}

interface Props {
  initialClients: Client[]
}

export function CrmClientList({ initialClients }: Props) {
  const [clients, setClients] = useState<Client[]>(initialClients)
  const [search, setSearch] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)

  const filtered = clients.filter((c) => {
    const q = search.toLowerCase()
    return (
      c.name.toLowerCase().includes(q) ||
      (c.company ?? '').toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q)
    )
  })

  const total = clients.length
  const active = clients.filter((c) => c.status === 'active').length
  const inactive = clients.filter((c) => c.status === 'inactive').length
  const prospect = clients.filter((c) => c.status === 'prospect').length

  function handleClientAdded(newClient: Client) {
    setClients((prev) => [newClient, ...prev])
    setDialogOpen(false)
  }

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Clients</h1>
          <p className="mt-1 text-sm text-gray-500">Manage your client relationships</p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="h-4 w-4" />
          Add Client
        </Button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: 'Total Clients', value: total, color: 'text-gray-900' },
          { label: 'Active', value: active, color: 'text-green-700' },
          { label: 'Inactive', value: inactive, color: 'text-gray-500' },
          { label: 'Prospects', value: prospect, color: 'text-amber-700' },
        ].map((stat) => (
          <Card key={stat.label}>
            <CardContent className="p-4 text-center">
              <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
              <p className="text-xs text-gray-500 mt-1">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <Input
          placeholder="Search clients by name, company or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Client grid */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 py-16 text-center">
          <div className="rounded-full bg-gray-100 p-4 mb-4">
            <Users className="h-8 w-8 text-gray-400" />
          </div>
          <p className="text-sm font-medium text-gray-900">
            {search ? 'No clients match your search' : 'No clients yet'}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {search ? 'Try a different search term' : 'Add your first client to get started'}
          </p>
          {!search && (
            <Button className="mt-4" onClick={() => setDialogOpen(true)}>
              <Plus className="h-4 w-4" />
              Add Client
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((client) => {
            const cfg = statusConfig[client.status]
            return (
              <Link key={client.id} href={`/crm/${client.id}`}>
                <Card className="h-full cursor-pointer transition-shadow hover:shadow-md">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div className="min-w-0">
                        <p className="font-semibold text-gray-900 truncate">{client.name}</p>
                        {client.company && (
                          <p className="text-sm text-gray-500 flex items-center gap-1 mt-0.5 truncate">
                            <Building2 className="h-3 w-3 shrink-0" />
                            {client.company}
                          </p>
                        )}
                      </div>
                      <Badge variant={cfg.variant} className="shrink-0 ml-2">
                        {cfg.label}
                      </Badge>
                    </div>
                    <div className="space-y-1.5">
                      <p className="text-xs text-gray-500 flex items-center gap-1.5 truncate">
                        <Mail className="h-3 w-3 shrink-0" />
                        {client.email}
                      </p>
                      {client.phone && (
                        <p className="text-xs text-gray-500 flex items-center gap-1.5">
                          <Phone className="h-3 w-3 shrink-0" />
                          {client.phone}
                        </p>
                      )}
                    </div>
                    <div className="mt-3 flex items-center justify-between border-t border-gray-100 pt-3">
                      <span className="text-xs text-gray-400 capitalize">
                        {client.billing_type} billing
                      </span>
                      {client.retainer_amount && (
                        <span className="text-xs font-medium text-gray-700">
                          {formatCurrency(client.retainer_amount, client.currency)}/mo
                        </span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            )
          })}
        </div>
      )}

      <AddClientDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSuccess={handleClientAdded}
      />
    </>
  )
}
