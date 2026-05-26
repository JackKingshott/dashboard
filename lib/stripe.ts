import Stripe from 'stripe'

function getStripe(): Stripe {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error('Stripe is not configured. Add STRIPE_SECRET_KEY to your environment variables.')
  }
  return new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2026-04-22.dahlia',
  })
}

export function isStripeConfigured() {
  return !!process.env.STRIPE_SECRET_KEY
}

export async function createStripeCustomer(email: string, name: string) {
  const stripe = getStripe()
  const customer = await stripe.customers.create({ email, name })
  return customer.id
}

export async function createStripeInvoice(params: {
  customerId: string
  items: { description: string; amount: number; currency: string }[]
  dueDate?: Date
  currency: string
}) {
  const stripe = getStripe()
  const invoice = await stripe.invoices.create({
    customer: params.customerId,
    currency: params.currency.toLowerCase(),
    collection_method: 'send_invoice',
    days_until_due: params.dueDate
      ? Math.ceil((params.dueDate.getTime() - Date.now()) / 86400000)
      : 30,
  })

  for (const item of params.items) {
    await stripe.invoiceItems.create({
      customer: params.customerId,
      invoice: invoice.id,
      description: item.description,
      amount: Math.round(item.amount * 100),
      currency: params.currency.toLowerCase(),
    })
  }

  const finalised = await stripe.invoices.finalizeInvoice(invoice.id)
  return finalised
}

export async function sendStripeInvoice(stripeInvoiceId: string) {
  const stripe = getStripe()
  return stripe.invoices.sendInvoice(stripeInvoiceId)
}

export async function constructWebhookEvent(body: string, signature: string) {
  const stripe = getStripe()
  return stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET!)
}
