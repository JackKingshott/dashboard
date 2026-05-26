import { NextRequest, NextResponse } from 'next/server'
import { constructWebhookEvent } from '@/lib/stripe'
import { createAdminClient, isSupabaseConfigured } from '@/lib/supabase/admin'

export async function POST(req: NextRequest) {
  if (!process.env.STRIPE_WEBHOOK_SECRET || !process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json({ error: 'Stripe not configured' }, { status: 503 })
  }

  const body = await req.text()
  const signature = req.headers.get('stripe-signature')

  if (!signature) {
    return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 })
  }

  let event
  try {
    event = await constructWebhookEvent(body, signature)
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ received: true })
  }

  const supabase = createAdminClient()

  if (event.type === 'invoice.paid') {
    const stripeInvoice = event.data.object as { id: string }
    await supabase
      .from('invoices')
      .update({ status: 'paid', paid_at: new Date().toISOString() })
      .eq('stripe_invoice_id', stripeInvoice.id)
  }

  if (event.type === 'invoice.payment_failed') {
    const stripeInvoice = event.data.object as { id: string }
    await supabase
      .from('invoices')
      .update({ status: 'overdue' })
      .eq('stripe_invoice_id', stripeInvoice.id)
  }

  return NextResponse.json({ received: true })
}
