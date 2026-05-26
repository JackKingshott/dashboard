import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

interface Params {
  params: Promise<{ id: string; noteId: string }>
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { id, noteId } = await params
  try {
    const supabase = createAdminClient()
    const { error } = await supabase
      .from('client_notes')
      .delete()
      .eq('id', noteId)
      .eq('client_id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
