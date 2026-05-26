import { Suspense } from 'react'
import { DashboardStats } from '@/components/dashboard/stats'
import { RecentInvoices } from '@/components/dashboard/recent-invoices'
import { UpcomingMeetings } from '@/components/dashboard/upcoming-meetings'
import { TasksWidget } from '@/components/dashboard/tasks-widget'
import { RevenueChart } from '@/components/dashboard/revenue-chart'

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <Suspense fallback={<StatsSkeleton />}>
        <DashboardStats />
      </Suspense>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Suspense fallback={<ChartSkeleton />}>
            <RevenueChart />
          </Suspense>
          <Suspense fallback={<ListSkeleton />}>
            <RecentInvoices />
          </Suspense>
        </div>

        <div className="space-y-6">
          <Suspense fallback={<ListSkeleton />}>
            <UpcomingMeetings />
          </Suspense>
          <Suspense fallback={<ListSkeleton />}>
            <TasksWidget />
          </Suspense>
        </div>
      </div>
    </div>
  )
}

function StatsSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="h-28 rounded-xl bg-gray-100 animate-pulse" />
      ))}
    </div>
  )
}

function ChartSkeleton() {
  return <div className="h-64 rounded-xl bg-gray-100 animate-pulse" />
}

function ListSkeleton() {
  return <div className="h-48 rounded-xl bg-gray-100 animate-pulse" />
}
