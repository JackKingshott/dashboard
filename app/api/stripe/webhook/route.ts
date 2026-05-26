import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(req: NextRequest) {
  const body = await req.text()
  const signature = req.headers.get('stripe-signature')

  if (!signature || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 })
  }

  let event
  try {
    event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET)
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const supabase = createAdminClient()

  if (event.type === 'invoice.paid') {
    const stripeInvoice = event.data.object as { id: string; hosted_invoice_url?: string }
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
