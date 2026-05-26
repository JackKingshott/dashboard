import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createStripeInvoice, sendStripeInvoice, createStripeCustomer } from '@/lib/stripe'

interface Params {
  params: Promise<{ id: string }>
}

export async function POST(_req: NextRequest, { params }: Params) {
  const { id } = await params
  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json({ error: 'Stripe not configured' }, { status: 503 })
  }

  try {
    const supabase = createAdminClient()

    // Fetch invoice with items and client
    const { data: invoice, error: invErr } = await supabase
      .from('invoices')
      .select('*, client:clients(*), items:invoice_items(*)')
      .eq('id', id)
      .single()

    if (invErr || !invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
    }

    if (invoice.stripe_invoice_id) {
      // Already has a Stripe invoice - just resend
      const sent = await sendStripeInvoice(invoice.stripe_invoice_id)
      await supabase
        .from('invoices')
        .update({ status: 'sent', sent_at: new Date().toISOString(), stripe_payment_link: sent.hosted_invoice_url ?? null })
        .eq('id', id)
      return NextResponse.json({ success: true, payment_link: sent.hosted_invoice_url })
    }

    if (!invoice.client) {
      return NextResponse.json({ error: 'Invoice has no client' }, { status: 400 })
    }

    // Ensure Stripe customer exists
    let customerId = invoice.client.stripe_customer_id
    if (!customerId) {
      customerId = await createStripeCustomer(invoice.client.email, invoice.client.name)
      await supabase.from('clients').update({ stripe_customer_id: customerId }).eq('id', invoice.client.id)
    }

    // Create Stripe invoice
    const stripeItems = (invoice.items ?? []).map((item: { description: string; amount: number }) => ({
      description: item.description,
      amount: item.amount,
      currency: invoice.currency,
    }))

    const stripeInvoice = await createStripeInvoice({
      customerId,
      items: stripeItems,
      dueDate: invoice.due_date ? new Date(invoice.due_date) : undefined,
      currency: invoice.currency,
    })

    const sent = await sendStripeInvoice(stripeInvoice.id!)

    await supabase
      .from('invoices')
      .update({
        status: 'sent',
        sent_at: new Date().toISOString(),
        stripe_invoice_id: sent.id,
        stripe_payment_link: sent.hosted_invoice_url ?? null,
      })
      .eq('id', id)

    return NextResponse.json({ success: true, payment_link: sent.hosted_invoice_url })
  } catch (err) {
    console.error('Send invoice error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to send invoice' },
      { status: 500 }
    )
  }
}
