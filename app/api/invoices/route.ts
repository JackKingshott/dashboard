import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createStripeInvoice, sendStripeInvoice, createStripeCustomer } from '@/lib/stripe'

export async function GET(req: NextRequest) {
  try {
    const supabase = createAdminClient()
    const url = new URL(req.url)
    const statusFilter = url.searchParams.get('status')

    let query = supabase
      .from('invoices')
      .select('*, client:clients(id, name, company, email)')
      .order('created_at', { ascending: false })

    if (statusFilter) {
      query = query.eq('status', statusFilter)
    }

    const { data, error } = await query
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data ?? [])
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const supabase = createAdminClient()

    const invoiceData = {
      invoice_number: body.invoice_number,
      client_id: body.client_id || null,
      currency: body.currency ?? 'GBP',
      subtotal: body.subtotal ?? 0,
      tax_rate: body.tax_rate ?? 0,
      tax_amount: body.tax_amount ?? 0,
      total: body.total ?? 0,
      due_date: body.due_date || null,
      notes: body.notes || null,
      status: 'draft',
    }

    const { data: invoice, error: invErr } = await supabase
      .from('invoices')
      .insert(invoiceData)
      .select()
      .single()

    if (invErr) return NextResponse.json({ error: invErr.message }, { status: 500 })

    // Insert line items
    if (body.items?.length) {
      const items = body.items.map((item: { description: string; quantity: number; unit_price: number; amount: number }) => ({
        invoice_id: invoice.id,
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unit_price,
        amount: item.amount,
      }))
      await supabase.from('invoice_items').insert(items)
    }

    // Optionally send via Stripe
    if (body.send && process.env.STRIPE_SECRET_KEY) {
      try {
        // Get client info
        const { data: client } = await supabase
          .from('clients')
          .select('*')
          .eq('id', body.client_id)
          .single()

        if (client) {
          let customerId = client.stripe_customer_id
          if (!customerId) {
            customerId = await createStripeCustomer(client.email, client.name)
            await supabase.from('clients').update({ stripe_customer_id: customerId }).eq('id', client.id)
          }

          const stripeItems = (body.items ?? []).map((item: { description: string; amount: number }) => ({
            description: item.description,
            amount: item.amount,
            currency: body.currency ?? 'GBP',
          }))

          const stripeInvoice = await createStripeInvoice({
            customerId,
            items: stripeItems,
            dueDate: body.due_date ? new Date(body.due_date) : undefined,
            currency: body.currency ?? 'GBP',
          })

          await sendStripeInvoice(stripeInvoice.id!)

          await supabase
            .from('invoices')
            .update({
              status: 'sent',
              sent_at: new Date().toISOString(),
              stripe_invoice_id: stripeInvoice.id,
              stripe_payment_link: stripeInvoice.hosted_invoice_url ?? null,
            })
            .eq('id', invoice.id)

          return NextResponse.json({ ...invoice, status: 'sent', stripe_invoice_id: stripeInvoice.id }, { status: 201 })
        }
      } catch (stripeErr) {
        console.error('Stripe error:', stripeErr)
        // Still return the created invoice, just not sent
      }
    }

    return NextResponse.json(invoice, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
