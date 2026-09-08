import type { AdvisorAccount } from '../state/Advisors'

// Premium features that are locked by default. Advisors request access (and see
// the price); admins grant them per advisor. Costs are placeholders — edit here.
export interface GatedFeature {
  id: string
  name: string
  description: string
  monthlyCost: number
}

export const GATED_FEATURES: GatedFeature[] = [
  {
    id: 'seo',
    name: 'SEO & Keywords',
    description: 'Search-visibility tracking, keyword rankings, and monthly optimization.',
    monthlyCost: 149,
  },
  {
    id: 'reviews',
    name: 'Review Management',
    description: 'Collect written & video reviews, request them by text/email, and push to Google.',
    monthlyCost: 99,
  },
  {
    id: 'greetings',
    name: 'Automated Client Messaging',
    description: 'Automated birthday and holiday greetings and follow-ups to your clients.',
    monthlyCost: 79,
  },
  {
    id: 'newsletter',
    name: 'Client Newsletter',
    description: 'Send mass email updates and newsletters to your whole client list.',
    monthlyCost: 59,
  },
]

export function featureById(id: string): GatedFeature | undefined {
  return GATED_FEATURES.find((f) => f.id === id)
}

/**
 * Whether an advisor has access to a gated feature. Unlocked by an explicit
 * admin toggle, or by an add-on request for it that's been marked
 * active/covered.
 */
export function hasFeature(advisor: AdvisorAccount | undefined, id: string): boolean {
  if (!advisor) return false
  if (advisor.features?.[id]) return true
  return (advisor.addons ?? []).some(
    (r) => r.serviceId === id && (r.status === 'active' || r.status === 'covered'),
  )
}

/** The most recent access request for a feature, if any. */
export function featureRequest(advisor: AdvisorAccount | undefined, id: string) {
  return (advisor?.addons ?? []).find((r) => r.serviceId === id)
}
