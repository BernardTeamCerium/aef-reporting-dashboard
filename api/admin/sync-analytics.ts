import type { VercelRequest, VercelResponse } from '@vercel/node'
import { GoogleAuth } from 'google-auth-library'
import { errorMessage, getServiceClient, HttpError, requireAdmin } from '../_lib.js'

// Pulls live numbers from Google Analytics 4 (traffic) and Google Search
// Console (keyword positions) for one advisor. The client passes the advisor's
// GA4 property id / Search Console site URL; this function authenticates with a
// Google service account (GOOGLE_SERVICE_ACCOUNT_KEY) and returns the numbers,
// which the admin UI applies. Manual overrides always win afterward.

const GA_SCOPE = 'https://www.googleapis.com/auth/analytics.readonly'
const GSC_SCOPE = 'https://www.googleapis.com/auth/webmasters.readonly'

function ymd(daysAgo: number): string {
  const d = new Date()
  d.setDate(d.getDate() - daysAgo)
  return d.toISOString().slice(0, 10)
}

async function accessToken(scopes: string[]): Promise<string> {
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_KEY
  if (!raw) {
    throw new HttpError(
      400,
      'Google is not connected yet. Add GOOGLE_SERVICE_ACCOUNT_KEY (a service-account JSON) in Vercel to enable live sync.',
    )
  }
  let credentials: Record<string, unknown>
  try {
    credentials = JSON.parse(raw)
  } catch {
    throw new HttpError(500, 'GOOGLE_SERVICE_ACCOUNT_KEY is not valid JSON.')
  }
  const auth = new GoogleAuth({ credentials, scopes })
  const client = await auth.getClient()
  const token = await client.getAccessToken()
  if (!token.token) throw new HttpError(500, 'Could not obtain a Google access token.')
  return token.token
}

async function fetchGA4(propertyId: string) {
  const token = await accessToken([GA_SCOPE])
  const res = await fetch(
    `https://analyticsdata.googleapis.com/v1beta/properties/${encodeURIComponent(propertyId)}:runReport`,
    {
      method: 'POST',
      headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
      body: JSON.stringify({
        dateRanges: [{ startDate: '30daysAgo', endDate: 'today' }],
        dimensions: [{ name: 'sessionDefaultChannelGroup' }],
        metrics: [{ name: 'activeUsers' }],
      }),
    },
  )
  const data = (await res.json()) as {
    rows?: { dimensionValues: { value: string }[]; metricValues: { value: string }[] }[]
    error?: { message?: string }
  }
  if (!res.ok) throw new HttpError(res.status, data.error?.message ?? 'Google Analytics request failed.')
  const trafficSources = (data.rows ?? [])
    .map((r) => ({ source: r.dimensionValues[0]?.value ?? 'Other', visitors: Number(r.metricValues[0]?.value ?? 0) }))
    .sort((a, b) => b.visitors - a.visitors)
  const visitors = trafficSources.reduce((s, t) => s + t.visitors, 0)
  return { visitors, trafficSources }
}

async function gscQuery(token: string, siteUrl: string, startDate: string, endDate: string) {
  const res = await fetch(
    `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(siteUrl)}/searchAnalytics/query`,
    {
      method: 'POST',
      headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
      body: JSON.stringify({ startDate, endDate, dimensions: ['query'], rowLimit: 25 }),
    },
  )
  const data = (await res.json()) as {
    rows?: { keys: string[]; position: number; impressions: number }[]
    error?: { message?: string }
  }
  if (!res.ok) throw new HttpError(res.status, data.error?.message ?? 'Search Console request failed.')
  return data.rows ?? []
}

async function fetchSearchConsole(siteUrl: string) {
  const token = await accessToken([GSC_SCOPE])
  const [current, previous] = await Promise.all([
    gscQuery(token, siteUrl, ymd(28), ymd(1)),
    gscQuery(token, siteUrl, ymd(56), ymd(29)),
  ])
  const prevByTerm = new Map(previous.map((r) => [r.keys[0], Math.round(r.position)]))
  const keywords = current.map((r, i) => {
    const term = r.keys[0]
    const currentRank = Math.round(r.position)
    return {
      id: `gsc-${i}`,
      term,
      currentRank,
      previousRank: prevByTerm.get(term) ?? currentRank,
      searchVolume: Math.round(r.impressions),
    }
  })
  return { keywords }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  try {
    await requireAdmin(req, getServiceClient())
    const { gaPropertyId, searchConsoleUrl } = (req.body ?? {}) as {
      gaPropertyId?: string
      searchConsoleUrl?: string
    }
    if (!gaPropertyId && !searchConsoleUrl) {
      return res.status(400).json({ error: 'Provide a GA4 Property ID and/or a Search Console site URL.' })
    }

    const result: {
      visitors?: number
      trafficSources?: { source: string; visitors: number }[]
      keywords?: { id: string; term: string; currentRank: number; previousRank: number; searchVolume: number }[]
    } = {}

    if (gaPropertyId) Object.assign(result, await fetchGA4(gaPropertyId))
    if (searchConsoleUrl) Object.assign(result, await fetchSearchConsole(searchConsoleUrl))

    res.status(200).json(result)
  } catch (e) {
    const status = e instanceof HttpError ? e.status : 500
    res.status(status).json({ error: errorMessage(e) })
  }
}
