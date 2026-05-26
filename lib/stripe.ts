import Stripe from 'stripe'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-04-30.basil',
})

export async function createStripeCustomer(email: string, name: string) {
  const customer = await stripe.customers.create({ email, name })
  return customer.id
}

export async function createStripeInvoice(params: {
  customerId: string
  items: { description: string; amount: number; currency: string }[]
  dueDate?: Date
  currency: string
}) {
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
  return stripe.invoices.sendInvoice(stripeInvoiceId)
}
