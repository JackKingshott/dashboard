'use client'
import { usePathname } from 'next/navigation'
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
  const title = titles[base] ?? 'Scale Storm'

  return (
    <header className="flex h-16 items-center justify-between border-b border-gray-100 bg-white px-6">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">{title}</h1>
        <p className="text-xs text-gray-400">
          {formatDate(new Date().toISOString(), { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </p>
      </div>
    </header>
  )
}
