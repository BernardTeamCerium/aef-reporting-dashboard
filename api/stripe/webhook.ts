import type { VercelRequest, VercelResponse } from '@vercel/node'
import Stripe from 'stripe'
import { getServiceClient } from '../_lib.js'

// Stripe sends the raw body; disable Vercel's parser so we can verify the
// signature.
export const config = { api: { bodyParser: false } }

function readRaw(req: VercelRequest): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = []
    req.on('data', (c) => chunks.push(Buffer.from(c)))
    req.on('end', () => resolve(Buffer.concat(chunks)))
    req.on('error', reject)
  })
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const key = process.env.STRIPE_SECRET_KEY
  const whSecret = process.env.STRIPE_WEBHOOK_SECRET
  if (!key || !whSecret) return res.status(200).json({ ok: false, reason: 'Stripe not configured.' })

  const stripe = new Stripe(key)
  let event: Stripe.Event
  try {
    const raw = await readRaw(req)
    event = stripe.webhooks.constructEvent(raw, req.headers['stripe-signature'] as string, whSecret)
  } catch (e) {
    return res.status(400).json({ error: `Webhook signature failed: ${e instanceof Error ? e.message : 'error'}` })
  }

  try {
    if (event.type === 'checkout.session.completed' || event.type === 'invoice.paid') {
      const obj = event.data.object as { metadata?: Record<string, string>; amount_total?: number; amount_paid?: number }
      const advisorId = obj.metadata?.advisorId
      const featureId = obj.metadata?.featureId
      const amount = (obj.amount_total ?? obj.amount_paid ?? 0) / 100

      if (advisorId && featureId) {
        const svc = getServiceClient()
        const { data: row } = await svc.from('advisors_data').select('data').eq('id', advisorId).maybeSingle()
        const advisor = (row?.data ?? {}) as Record<string, unknown>
        const features = { ...(advisor.features as Record<string, boolean> | undefined), [featureId]: true }
        const period = new Date().toISOString().slice(0, 7)
        const billing = [
          {
            id: 'bi-' + Math.random().toString(36).slice(2, 9),
            item: featureId,
            amount,
            period,
            status: 'paid',
            createdOn: new Date().toISOString().slice(0, 10),
            paidOn: new Date().toISOString().slice(0, 10),
          },
          ...((advisor.billing as unknown[]) ?? []),
        ]
        await svc.from('advisors_data').upsert({ id: advisorId, data: { ...advisor, features, billing } }, { onConflict: 'id' })
      }
    }
    res.status(200).json({ received: true })
  } catch {
    // Acknowledge so Stripe doesn't retry forever; the payment still succeeded.
    res.status(200).json({ received: true })
  }
}
