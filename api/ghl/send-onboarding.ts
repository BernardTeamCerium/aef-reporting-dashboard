import type { VercelRequest, VercelResponse } from '@vercel/node'
import { errorMessage, getServiceClient, HttpError, requireAdmin } from '../_lib.js'
import { ghlConfig, ghlFetch } from './_client.js'

// Onboarding sequence sender. Routes a "welcome" text or a "questionnaire"
// (bio-collection form) to the advisor through GoHighLevel. Upserts the advisor
// as a GHL contact, sends the SMS and/or enrolls them in the matching workflow.
// No-ops with a clear message until GoHighLevel is connected.
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  try {
    await requireAdmin(req, getServiceClient())
    const { step, name, email, phone, firm, message } = (req.body ?? {}) as Record<string, string | undefined>
    if (step !== 'welcome' && step !== 'questionnaire') {
      return res.status(400).json({ error: "step must be 'welcome' or 'questionnaire'." })
    }
    if (!email && !phone) return res.status(400).json({ error: 'An email or phone is required.' })

    const { configured, locationId } = ghlConfig()
    if (!configured) {
      return res.status(200).json({
        ok: false,
        reason: 'Connect GoHighLevel (set GHL_API_KEY and GHL_LOCATION_ID in Vercel) to send onboarding messages.',
      })
    }

    // Create/update the advisor as a contact in GoHighLevel.
    const tag = step === 'welcome' ? 'welcome' : 'questionnaire'
    const upsert = await ghlFetch('/contacts/upsert', {
      method: 'POST',
      body: JSON.stringify({ locationId, name, email, phone, companyName: firm, tags: ['advisor', 'onboarding', tag] }),
    })
    const contactId = (upsert.contact as { id?: string } | undefined)?.id

    // Send the welcome SMS directly (if we have a phone + contact).
    let messageSent = false
    if (step === 'welcome' && contactId && phone) {
      const body =
        message ||
        `Welcome to OneStop Print & Digital Marketing${name ? `, ${name.split(' ')[0]}` : ''}! We're excited to get started. You'll get a short questionnaire and your service agreement next.`
      await ghlFetch('/conversations/messages', {
        method: 'POST',
        body: JSON.stringify({ type: 'SMS', contactId, message: body }),
      }).then(() => { messageSent = true }).catch(() => {})
    }

    // Enroll in the relevant workflow (welcome sequence or questionnaire form).
    const workflowId =
      step === 'welcome' ? process.env.GHL_WELCOME_WORKFLOW_ID : process.env.GHL_QUESTIONNAIRE_WORKFLOW_ID
    if (workflowId && contactId) {
      await ghlFetch(`/contacts/${contactId}/workflow/${workflowId}`, {
        method: 'POST',
        body: JSON.stringify({}),
      }).catch(() => {})
    }

    res.status(200).json({ ok: true, contactId, messageSent, workflowTriggered: Boolean(workflowId) })
  } catch (e) {
    const status = e instanceof HttpError ? e.status : 500
    res.status(status).json({ error: errorMessage(e) })
  }
}
