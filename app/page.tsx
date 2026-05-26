import { Greeting } from '@/components/dashboard/greeting'
import { DashboardStats } from '@/components/dashboard/stats'
import { RecentInvoices } from '@/components/dashboard/recent-invoices'
import { MeetingsWidget } from '@/components/dashboard/meetings-widget'
import { TasksWidget } from '@/components/dashboard/tasks-widget'
import { RevenueChart } from '@/components/dashboard/revenue-chart'

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <Greeting />
      <DashboardStats />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <RevenueChart />
          <RecentInvoices />
        </div>
        <div className="space-y-6">
          <MeetingsWidget />
          <TasksWidget />
        </div>
      </div>
    </div>
  )
}
