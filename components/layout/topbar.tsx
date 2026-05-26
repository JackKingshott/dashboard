'use client'
import { usePathname } from 'next/navigation'
import { Bell } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { formatDate } from '@/lib/utils'

const titles: Record<string, string> = {
  '/': 'Dashboard',
  '/crm': 'Clients',
  '/invoices': 'Invoices',
  '/todo': 'To-Do',
  '/calendar': 'Calendar',
  '/settings': 'Settings',
}

export function Topbar() {
  const pathname = usePathname()
  const base = '/' + pathname.split('/')[1]
  const title = titles[base] ?? 'Dashboard'

  return (
    <header className="flex h-16 items-center justify-between border-b border-gray-100 bg-white px-6">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">{title}</h1>
        <p className="text-xs text-gray-400">{formatDate(new Date().toISOString(), { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-4 w-4" />
        </Button>
        <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-semibold">
          A
        </div>
      </div>
    </header>
  )
}
