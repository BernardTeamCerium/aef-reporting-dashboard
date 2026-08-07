import type { VercelRequest, VercelResponse } from '@vercel/node'
import { ADMIN_EMAIL, errorMessage, getServiceClient, HttpError, requireUser, sendViaZapier } from './_lib.js'

// Emails a notification to the audience via the Zapier webhook. Admin-audience
// goes to ADMIN_EMAIL; advisor-audience uses the provided address. No-ops
// safely when the webhook isn't configured.
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  try {
    await requireUser(req, getServiceClient())
    const { audience, to, title, body } = (req.body ?? {}) as {
      audience?: 'admin' | 'advisor'
      to?: string
      title?: string
      body?: string
    }
    if (!title || !body) return res.status(400).json({ error: '"title" and "body" are required.' })

    const recipient = audience === 'admin' ? ADMIN_EMAIL : to
    if (!recipient) return res.status(200).json({ sent: false, reason: 'No recipient address.' })

    const result = await sendViaZapier({
      purpose: 'notification',
      channel: 'email',
      to: recipient,
      subject: title,
      body,
    })
    res.status(200).json(result)
  } catch (e) {
    const status = e instanceof HttpError ? e.status : 500
    res.status(status).json({ error: errorMessage(e) })
  }
}
