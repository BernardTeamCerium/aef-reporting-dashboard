import { HttpError } from '../_lib.js'

// GoHighLevel (LeadConnector) API v2 helper. Configured with a Private
// Integration token + the sub-account (location) id.
const GHL_BASE = 'https://services.leadconnectorhq.com'

export function ghlConfig() {
  const token = process.env.GHL_API_KEY
  const locationId = process.env.GHL_LOCATION_ID
  return { token, locationId, configured: Boolean(token && locationId) }
}

export async function ghlFetch(path: string, init?: RequestInit) {
  const { token } = ghlConfig()
  const res = await fetch(GHL_BASE + path, {
    ...init,
    headers: {
      authorization: `Bearer ${token}`,
      Version: '2021-07-28',
      'content-type': 'application/json',
      ...(init?.headers ?? {}),
    },
  })
  const data = (await res.json().catch(() => ({}))) as Record<string, unknown>
  if (!res.ok) {
    throw new HttpError(res.status, (data.message as string) ?? `GoHighLevel request failed (${res.status})`)
  }
  return data
}
