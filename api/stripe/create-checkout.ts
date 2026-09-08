import type { VercelRequest, VercelResponse } from '@vercel/node'
import Stripe from 'stripe'
import { errorMessage, getServiceClient, HttpError, requireUser } from '../_lib.js'

// Creates a Stripe Checkout subscription session for a single feature. The
// advisor is redirected to Stripe to pay; on success the webhook unlocks the
// feature. No-ops with a clear message until STRIPE_SECRET_KEY is set.
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  try {
    await requireUser(req, getServiceClient())
    const { featureId, featureName, amount, advisorId, email } = (req.body ?? {}) as {
      featureId?: string
      featureName?: string
      amount?: number
      advisorId?: string
      email?: string
    }
    if (!featureId || !featureName || !amount) {
      return res.status(400).json({ error: 'featureId, featureName and amount are required.' })
    }

    const key = process.env.STRIPE_SECRET_KEY
    if (!key) {
      return res.status(200).json({
        ok: false,
        reason: 'Stripe is not connected yet. Add STRIPE_SECRET_KEY in Vercel to enable checkout.',
      })
    }

    const stripe = new Stripe(key)
    const origin = (req.headers.origin as string) || `https://${req.headers.host}`
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: { name: featureName },
            unit_amount: Math.round(amount * 100),
            recurring: { interval: 'month' },
          },
          quantity: 1,
        },
      ],
      customer_email: email,
      metadata: { advisorId: advisorId ?? '', featureId },
      subscription_data: { metadata: { advisorId: advisorId ?? '', featureId } },
      success_url: `${origin}/billing?paid=1`,
      cancel_url: `${origin}/services`,
    })

    res.status(200).json({ ok: true, url: session.url })
  } catch (e) {
    const status = e instanceof HttpError ? e.status : 500
    res.status(status).json({ error: errorMessage(e) })
  }
}
