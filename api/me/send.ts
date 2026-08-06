import type { VercelRequest, VercelResponse } from '@vercel/node'
import { errorMessage, getServiceClient, HttpError, requireUser, sendViaZapier } from '../_lib.js'

// Send a message (e.g. a review request) on behalf of the signed-in user via
// the configured Zapier webhook. Returns { sent:false, reason } instead of an
// error when no channel is configured, so the UI can guide the user.
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  try {
    await requireUser(req, getServiceClient())
    const { to, channel, subject, body, name, purpose } = (req.body ?? {}) as {
      to?: string
      channel?: 'email' | 'sms'
      subject?: string
      body?: string
      name?: string
      purpose?: string
    }
    if (!to || !body) return res.status(400).json({ error: 'Both "to" and "body" are required.' })

    const result = await sendViaZapier({
      purpose: purpose ?? 'review_request',
      channel: channel ?? 'email',
      to,
      name: name ?? '',
      subject: subject ?? 'A quick favor',
      body,
    })
    return res.status(200).json(result)
  } catch (e) {
    const status = e instanceof HttpError ? e.status : 500
    res.status(status).json({ error: errorMessage(e) })
  }
}
