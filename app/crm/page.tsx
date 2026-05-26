import { Suspense } from 'react'
import { createAdminClient } from '@/lib/supabase/admin'
import type { Client } from '@/types'
import { CrmClientList } from '@/components/crm/crm-client-list'

async function fetchClients(): Promise<Client[]> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) return []
  try {
    const supabase = createAdminClient()
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) return []
    return (data ?? []) as Client[]
  } catch {
    return []
  }
}

export default async function CrmPage() {
  const clients = await fetchClients()

  return (
    <div className="space-y-6">
      <CrmClientList initialClients={clients} />
    </div>
  )
}
