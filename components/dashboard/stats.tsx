import { TrendingUp, Clock, AlertCircle, Users, CheckSquare } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { formatCurrency } from '@/lib/utils'
import { createAdminClient } from '@/lib/supabase/admin'

async function fetchStats() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return { revenueThisMonth: 0, outstandingTotal: 0, overdueCount: 0, activeClients: 0, tasksDueToday: 0, currency: 'GBP' }
  }

  try {
    const supabase = createAdminClient()
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString()
    const today = now.toISOString().split('T')[0]

    const [revenueRes, outstandingRes, overdueRes, clientsRes, tasksRes] = await Promise.all([
      supabase
        .from('invoices')
        .select('total')
        .eq('status', 'paid')
        .gte('created_at', startOfMonth)
        .lte('created_at', endOfMonth),
      supabase
        .from('invoices')
        .select('total')
        .eq('status', 'sent'),
      supabase
        .from('invoices')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'overdue'),
      supabase
        .from('clients')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'active'),
      supabase
        .from('tasks')
        .select('id', { count: 'exact', head: true })
        .eq('due_date', today)
        .neq('status', 'done'),
    ])

    const revenueThisMonth = (revenueRes.data ?? []).reduce((sum, inv) => sum + (inv.total ?? 0), 0)
    const outstandingTotal = (outstandingRes.data ?? []).reduce((sum, inv) => sum + (inv.total ?? 0), 0)

    return {
      revenueThisMonth,
      outstandingTotal,
      overdueCount: overdueRes.count ?? 0,
      activeClients: clientsRes.count ?? 0,
      tasksDueToday: tasksRes.count ?? 0,
      currency: 'GBP',
    }
  } catch {
    return { revenueThisMonth: 0, outstandingTotal: 0, overdueCount: 0, activeClients: 0, tasksDueToday: 0, currency: 'GBP' }
  }
}

export default async function DashboardStats() {
  const stats = await fetchStats()

  const cards = [
    {
      label: 'Revenue This Month',
      value: formatCurrency(stats.revenueThisMonth, stats.currency),
      trend: 'Paid invoices this month',
      icon: TrendingUp,
      iconBg: 'bg-green-50',
      iconColor: 'text-green-600',
      valueColor: 'text-green-700',
    },
    {
      label: 'Outstanding',
      value: formatCurrency(stats.outstandingTotal, stats.currency),
      trend: 'Across all sent invoices',
      icon: Clock,
      iconBg: 'bg-amber-50',
      iconColor: 'text-amber-600',
      valueColor: 'text-amber-700',
    },
    {
      label: 'Overdue Invoices',
      value: stats.overdueCount.toString(),
      trend: stats.overdueCount === 0 ? 'All invoices on time' : 'Requires attention',
      icon: AlertCircle,
      iconBg: 'bg-red-50',
      iconColor: 'text-red-600',
      valueColor: 'text-red-700',
    },
    {
      label: 'Active Clients',
      value: stats.activeClients.toString(),
      trend: `${stats.tasksDueToday} task${stats.tasksDueToday === 1 ? '' : 's'} due today`,
      icon: Users,
      iconBg: 'bg-blue-50',
      iconColor: 'text-blue-600',
      valueColor: 'text-blue-700',
    },
  ]

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => {
        const Icon = card.icon
        return (
          <Card key={card.label} className="relative overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-gray-500">{card.label}</p>
                  <p className={`text-2xl font-bold tracking-tight ${card.valueColor}`}>
                    {card.value}
                  </p>
                  <p className="text-xs text-gray-400">{card.trend}</p>
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
