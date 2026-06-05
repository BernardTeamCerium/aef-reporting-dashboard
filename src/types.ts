// Shared domain types for the Advisor Marketing Hub.
// These mirror the shape of data the OneStop marketing team would expose
// through a real API, so swapping mock data for live endpoints is a small change.

export interface Advisor {
  id: string
  name: string
  firm: string
  email: string
  website: string
  avatarInitials: string
  accountManager: string
}

export type TrendDirection = 'up' | 'down' | 'flat'

export interface Metric {
  label: string
  value: number
  /** Percentage change vs. the previous comparable period. */
  changePct: number
  trend: TrendDirection
  /** Formatting hint for display. */
  format: 'number' | 'currency' | 'duration' | 'percent'
}

export interface TimeseriesPoint {
  /** Short label for the x-axis, e.g. "Jan" or "Wk 1". */
  period: string
  visitors: number
  appointments: number
  leads: number
}

export interface TrafficSource {
  source: string
  visitors: number
}

export type PostChannel = 'Facebook' | 'LinkedIn' | 'Instagram' | 'Blog' | 'Email'

export type PostStatus = 'pending' | 'approved' | 'changes_requested' | 'published'

export interface SocialPost {
  id: string
  title: string
  channel: PostChannel
  scheduledFor: string // ISO date
  status: PostStatus
  body: string
  imageUrl?: string
  hashtags: string[]
  /** Advisor feedback when requesting changes. */
  feedback?: string
}

export type PrintCategory =
  | 'Business Cards'
  | 'Brochures'
  | 'Flyers'
  | 'Postcards'
  | 'Banners'
  | 'Folders'
  | 'Other'

export type OrderStatus =
  | 'submitted'
  | 'in_review'
  | 'in_production'
  | 'shipped'
  | 'delivered'

export interface PrintProduct {
  id: string
  name: string
  category: PrintCategory
  description: string
  unitLabel: string // e.g. "per 250"
  basePrice: number
  turnaround: string // e.g. "5-7 business days"
  imageUrl?: string
}

export interface PrintOrder {
  id: string
  productName: string
  category: PrintCategory
  quantity: number
  status: OrderStatus
  submittedOn: string // ISO date
  estimatedCost: number
  shipTo: string
  notes?: string
}

export type SupportType = 'Digital' | 'Print' | 'Marketing Strategy' | 'Website' | 'Other'
export type SupportPriority = 'low' | 'normal' | 'high' | 'urgent'
export type TicketStatus = 'open' | 'in_progress' | 'waiting_on_you' | 'resolved'

export interface SupportTicket {
  id: string
  subject: string
  type: SupportType
  priority: SupportPriority
  status: TicketStatus
  createdOn: string // ISO date
  updatedOn: string // ISO date
  description: string
  assignedTo?: string
}

export interface Keyword {
  id: string
  term: string
  currentRank: number
  previousRank: number
  searchVolume: number
  /** True when this keyword is on page 1 of results. */
  onPageOne: boolean
}

export interface SeoSnapshot {
  overallScore: number // 0-100
  previousScore: number
  indexedPages: number
  backlinks: number
  domainAuthority: number
  coreWebVitalsPassing: boolean
  issues: { label: string; severity: 'low' | 'medium' | 'high'; count: number }[]
  rankTrend: { period: string; avgRank: number }[]
  keywords: Keyword[]
  lastAuditDate: string // ISO date
}
