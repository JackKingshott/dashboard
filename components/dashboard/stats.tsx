'use client'

import { useState, useEffect } from 'react'
import { TrendingUp, Clock, AlertCircle, Users } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { formatCurrency } from '@/lib/utils'
import { localClients, localInvoices, localTasks, isUsingLocalStore } from '@/lib/local-store'

interface Stats {
  revenueThisMonth: number
  outstandingTotal: number
  overdueCount: number
  activeClients: number
  tasksDueToday: number
  currency: string
}

const zero: Stats = { revenueThisMonth: 0, outstandingTotal: 0, overdueCount: 0, activeClients: 0, tasksDueToday: 0, currency: 'GBP' }

function calcLocalStats(): Stats {
  const today = new Date().toISOString().split('T')[0]
  const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()
  const endOfMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0, 23, 59, 59).toISOString()

  const invoices = localInvoices.list()
  const clients = localClients.list()
  const tasks = localTasks.list()

  const revenueThisMonth = invoices
    .filter(i => i.status === 'paid' && i.paid_at && i.paid_at >= startOfMonth && i.paid_at <= endOfMonth)
    .reduce((s, i) => s + i.total, 0)

  const outstandingTotal = invoices
    .filter(i => i.status === 'sent')
    .reduce((s, i) => s + i.total, 0)

  const overdueCount = invoices.filter(i => i.status === 'overdue').length
  const activeClients = clients.filter(c => c.status === 'active').length
  const tasksDueToday = tasks.filter(t => t.due_date === today && t.status !== 'done').length

  return { revenueThisMonth, outstandingTotal, overdueCount, activeClients, tasksDueToday, currency: 'GBP' }
}

async function fetchApiStats(): Promise<Stats> {
  try {
    const [invRes, clientRes, taskRes] = await Promise.all([
      fetch('/api/invoices').then(r => r.ok ? r.json() : []),
      fetch('/api/clients').then(r => r.ok ? r.json() : []),
      fetch('/api/tasks').then(r => r.ok ? r.json() : []),
    ])
    const today = new Date().toISOString().split('T')[0]
    const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()
    const endOfMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0, 23, 59, 59).toISOString()
    const invoices = Array.isArray(invRes) ? invRes : []
    const clients = Array.isArray(clientRes) ? clientRes : []
    const tasks = Array.isArray(taskRes) ? taskRes : []
    return {
      revenueThisMonth: invoices.filter((i: any) => i.status === 'paid' && i.paid_at >= startOfMonth && i.paid_at <= endOfMonth).reduce((s: number, i: any) => s + i.total, 0),
      outstandingTotal: invoices.filter((i: any) => i.status === 'sent').reduce((s: number, i: any) => s + i.total, 0),
      overdueCount: invoices.filter((i: any) => i.status === 'overdue').length,
      activeClients: clients.filter((c: any) => c.status === 'active').length,
      tasksDueToday: tasks.filter((t: any) => t.due_date === today && t.status !== 'done').length,
      currency: 'GBP',
    }
  } catch { return zero }
}

export function DashboardStats() {
  const [stats, setStats] = useState<Stats>(zero)

  useEffect(() => {
    if (isUsingLocalStore()) {
      setStats(calcLocalStats())
    } else {
      fetchApiStats().then(setStats)
    }
  }, [])

  const cards = [
    {
      label: 'Revenue This Month',
      value: formatCurrency(stats.revenueThisMonth, stats.currency),
      sub: 'Paid invoices this month',
      icon: TrendingUp, iconBg: 'bg-green-50', iconColor: 'text-green-600', valueColor: 'text-green-700',
    },
    {
      label: 'Outstanding',
      value: formatCurrency(stats.outstandingTotal, stats.currency),
      sub: 'Across all sent invoices',
      icon: Clock, iconBg: 'bg-amber-50', iconColor: 'text-amber-600', valueColor: 'text-amber-700',
    },
    {
      label: 'Overdue Invoices',
      value: String(stats.overdueCount),
      sub: stats.overdueCount === 0 ? 'All invoices on time' : 'Requires attention',
      icon: AlertCircle, iconBg: 'bg-red-50', iconColor: 'text-red-600', valueColor: 'text-red-700',
    },
    {
      label: 'Active Clients',
      value: String(stats.activeClients),
      sub: `${stats.tasksDueToday} task${stats.tasksDueToday === 1 ? '' : 's'} due today`,
      icon: Users, iconBg: 'bg-blue-50', iconColor: 'text-blue-600', valueColor: 'text-blue-700',
    },
  ]

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map(card => {
        const Icon = card.icon
        return (
          <Card key={card.label} className="relative overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-gray-500">{card.label}</p>
                  <p className={`text-2xl font-bold tracking-tight ${card.valueColor}`}>{card.value}</p>
                  <p className="text-xs text-gray-400">{card.sub}</p>
                </div>
                <div className={`rounded-xl p-2.5 ${card.iconBg}`}>
                  <Icon className={`h-5 w-5 ${card.iconColor}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
