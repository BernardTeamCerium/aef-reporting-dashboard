import type { VercelRequest, VercelResponse } from '@vercel/node'
import { errorMessage, getServiceClient, HttpError, requireAdmin } from '../_lib.js'
import { ghlConfig, ghlFetch } from './_client.js'

// Onboarding: send the advisor an agreement to sign, via GoHighLevel. Upserts
// the advisor as a GHL contact and (if a workflow id is configured) enrolls
// them in the agreement/e-sign workflow. No-ops with a clear message until GHL
// is connected.
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  try {
    await requireAdmin(req, getServiceClient())
    const { name, email, phone, firm } = (req.body ?? {}) as Record<string, string | undefined>
    if (!email && !phone) return res.status(400).json({ error: 'An email or phone is required.' })

    const { configured, locationId } = ghlConfig()
    if (!configured) {
      return res.status(200).json({
        ok: false,
        reason: 'Connect GoHighLevel (set GHL_API_KEY and GHL_LOCATION_ID in Vercel) to send agreements.',
      })
    }

    // Create/update the advisor as a contact in GoHighLevel.
    const upsert = await ghlFetch('/contacts/upsert', {
      method: 'POST',
      body: JSON.stringify({ locationId, name, email, phone, companyName: firm, tags: ['advisor', 'onboarding'] }),
    })
    const contactId = (upsert.contact as { id?: string } | undefined)?.id

    // Optionally trigger the agreement workflow (e-sign) if one is configured.
    const workflowId = process.env.GHL_AGREEMENT_WORKFLOW_ID
    if (workflowId && contactId) {
      await ghlFetch(`/contacts/${contactId}/workflow/${workflowId}`, {
        method: 'POST',
        body: JSON.stringify({}),
      }).catch(() => {})
    }

    res.status(200).json({ ok: true, contactId, workflowTriggered: Boolean(workflowId) })
  } catch (e) {
    const status = e instanceof HttpError ? e.status : 500
    res.status(status).json({ error: errorMessage(e) })
  }
}
