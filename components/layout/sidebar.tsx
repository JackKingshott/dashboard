'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Users, FileText, CheckSquare, CalendarDays, Settings, Zap, Video } from 'lucide-react'
import { cn } from '@/lib/utils'

const nav = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/crm', label: 'Clients', icon: Users },
  { href: '/invoices', label: 'Invoices', icon: FileText },
  { href: '/todo', label: 'To-Do', icon: CheckSquare },
  { href: '/meetings', label: 'Meetings', icon: Video },
  { href: '/calendar', label: 'Calendar', icon: CalendarDays },
  { href: '/settings', label: 'Settings', icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="fixed inset-y-0 left-0 z-50 flex w-60 flex-col border-r border-gray-100 bg-white">
      <div className="flex h-16 items-center gap-2.5 border-b border-gray-100 px-6">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600">
          <Zap className="h-4 w-4 text-white" />
        </div>
        <span className="text-lg font-bold text-gray-900">Scale Storm</span>
      </div>

      <nav className="flex-1 space-y-0.5 px-3 py-4">
        {nav.map(({ href, label, icon: Icon }) => {
          const active = href === '/' ? pathname === '/' : pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                active ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              )}
            >
              <Icon className={cn('h-4 w-4', active ? 'text-blue-600' : 'text-gray-400')} />
              {label}
            </Link>
          )
        })}
      </nav>

      <div className="border-t border-gray-100 px-3 py-4">
        <div className="flex items-center gap-3 rounded-lg px-3 py-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-white text-sm font-semibold shrink-0">
            J
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-900 truncate">Jack</p>
            <p className="text-xs text-gray-400 truncate">Scale Storm</p>
          </div>
        </div>
      </div>
    </aside>
  )
}
