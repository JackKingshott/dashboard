'use client'

import { useState, useEffect } from 'react'
import { Users, Search, Building2, Mail, Phone, Plus, Pencil, Trash2 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ClientDialog } from '@/components/crm/client-dialog'
import { formatCurrency } from '@/lib/utils'
import { localClients, isUsingLocalStore } from '@/lib/local-store'
import type { Client, ClientStatus } from '@/types'
import Link from 'next/link'

const statusConfig: Record<ClientStatus, { label: string; variant: 'success' | 'secondary' | 'warning' }> = {
  active: { label: 'Active', variant: 'success' },
  inactive: { label: 'Inactive', variant: 'secondary' },
  prospect: { label: 'Prospect', variant: 'warning' },
}

export default function CrmPage() {
  const [clients, setClients] = useState<Client[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingClient, setEditingClient] = useState<Client | null>(null)

  useEffect(() => {
    if (isUsingLocalStore()) {
      setClients(localClients.list())
      setLoading(false)
      return
    }
    fetch('/api/clients')
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setClients(data) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  async function handleDelete(id: string) {
    if (!confirm('Delete this client? This cannot be undone.')) return
    setClients(prev => prev.filter(c => c.id !== id))
    if (isUsingLocalStore()) {
      localClients.delete(id)
    } else {
      await fetch(`/api/clients/${id}`, { method: 'DELETE' }).catch(() => {})
    }
  }

  function handleSaved(client: Client) {
    setClients(prev => {
      const exists = prev.find(c => c.id === client.id)
      return exists ? prev.map(c => c.id === client.id ? client : c) : [client, ...prev]
    })
    setDialogOpen(false)
    setEditingClient(null)
  }

  function openAdd() { setEditingClient(null); setDialogOpen(true) }
  function openEdit(e: React.MouseEvent, client: Client) {
    e.preventDefault(); e.stopPropagation()
    setEditingClient(client); setDialogOpen(true)
  }

  const filtered = clients.filter(c => {
    const q = search.toLowerCase()
    return c.name.toLowerCase().includes(q) || (c.company ?? '').toLowerCase().includes(q) || c.email.toLowerCase().includes(q)
  })

  const active = clients.filter(c => c.status === 'active').length
  const inactive = clients.filter(c => c.status === 'inactive').length
  const prospect = clients.filter(c => c.status === 'prospect').length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Clients</h1>
          <p className="mt-1 text-sm text-gray-500">Manage your client relationships</p>
        </div>
        <Button onClick={openAdd}>
          <Plus className="h-4 w-4" />
          Add Client
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: 'Total Clients', value: clients.length, color: 'text-gray-900' },
          { label: 'Active', value: active, color: 'text-green-700' },
          { label: 'Inactive', value: inactive, color: 'text-gray-500' },
          { label: 'Prospects', value: prospect, color: 'text-amber-700' },
        ].map(stat => (
          <Card key={stat.label}>
            <CardContent className="p-4 text-center">
              <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
              <p className="text-xs text-gray-500 mt-1">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <Input
          placeholder="Search clients by name, company or email..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
        </div>
      ) : (
        <>
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
                <Button className="mt-4" onClick={openAdd}>
                  <Plus className="h-4 w-4" />
                  Add Client
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {filtered.map(client => {
                const cfg = statusConfig[client.status]
                return (
                  <Link key={client.id} href={`/crm/${client.id}`}>
                    <Card className="h-full cursor-pointer transition-shadow hover:shadow-md group">
                      <CardContent className="p-5">
                        <div className="flex items-start justify-between mb-3">
                          <div className="min-w-0 flex-1">
                            <p className="font-semibold text-gray-900 truncate">{client.name}</p>
                            {client.company && (
                              <p className="text-sm text-gray-500 flex items-center gap-1 mt-0.5 truncate">
                                <Building2 className="h-3 w-3 shrink-0" />
                                {client.company}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-1.5 ml-2 shrink-0">
                            <Badge variant={cfg.variant}>{cfg.label}</Badge>
                            <button
                              onClick={e => openEdit(e, client)}
                              className="rounded p-1 text-gray-300 hover:text-blue-600 hover:bg-blue-50 transition-colors opacity-0 group-hover:opacity-100"
                              title="Edit client"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={e => { e.preventDefault(); e.stopPropagation(); handleDelete(client.id) }}
                              className="rounded p-1 text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100"
                              title="Delete client"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
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
                          <span className="text-xs text-gray-400 capitalize">{client.billing_type} billing</span>
                          {client.retainer_amount ? (
                            <span className="text-xs font-medium text-gray-700">
                              {formatCurrency(client.retainer_amount, client.currency)}/mo
                            </span>
                          ) : null}
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                )
              })}
            </div>
          )}

          <ClientDialog
            open={dialogOpen}
            onOpenChange={open => { setDialogOpen(open); if (!open) setEditingClient(null) }}
            onSuccess={handleSaved}
            client={editingClient}
          />
        </>
      )}
    </div>
  )
}
