import type { Metadata } from 'next'
import './globals.css'
import { Sidebar } from '@/components/layout/sidebar'
import { Topbar } from '@/components/layout/topbar'

export const metadata: Metadata = {
  title: 'Scale Storm',
  description: 'Scale Storm business dashboard',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <body className="h-full">
        <div className="flex h-full">
          <Sidebar />
          <div className="flex flex-1 flex-col pl-60">
            <Topbar />
            <main className="flex-1 overflow-auto p-6">
              {children}
            </main>
          </div>
        </div>
      </body>
    </html>
  )
}
