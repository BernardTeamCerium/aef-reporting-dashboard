import type {
  Advisor,
  Metric,
  PrintOrder,
  PrintProduct,
  SeoSnapshot,
  SocialPost,
  SupportTicket,
  TimeseriesPoint,
  TrafficSource,
} from '../types'

// ---------------------------------------------------------------------------
// The signed-in advisor. In a real app this comes from auth/session.
// ---------------------------------------------------------------------------
export const currentAdvisor: Advisor = {
  id: 'adv_001',
  name: 'Renzo Frazier',
  firm: 'Frazier Wealth Partners',
  email: 'renzofrazier@gmail.com',
  website: 'frazierwealth.com',
  avatarInitials: 'RF',
  accountManager: 'Dana Whitfield',
}

// ---------------------------------------------------------------------------
// Feature 1: Performance — site traffic, appointments, leads
// ---------------------------------------------------------------------------
export const headlineMetrics: Metric[] = [
  { label: 'Site Visitors', value: 8421, changePct: 12.4, trend: 'up', format: 'number' },
  { label: 'Appointments Booked', value: 37, changePct: 18.2, trend: 'up', format: 'number' },
  { label: 'Leads Generated', value: 112, changePct: 6.1, trend: 'up', format: 'number' },
  { label: 'Avg. Time on Site', value: 154, changePct: -3.4, trend: 'down', format: 'duration' },
]

export const performanceSeries: TimeseriesPoint[] = [
  { period: 'Jan', visitors: 4820, appointments: 18, leads: 61 },
  { period: 'Feb', visitors: 5210, appointments: 21, leads: 68 },
  { period: 'Mar', visitors: 5980, appointments: 24, leads: 74 },
  { period: 'Apr', visitors: 6440, appointments: 27, leads: 83 },
  { period: 'May', visitors: 7490, appointments: 31, leads: 96 },
  { period: 'Jun', visitors: 8421, appointments: 37, leads: 112 },
]

export const trafficSources: TrafficSource[] = [
  { source: 'Organic Search', visitors: 3705 },
  { source: 'Direct', visitors: 1894 },
  { source: 'Social', visitors: 1432 },
  { source: 'Referral', visitors: 869 },
  { source: 'Email', visitors: 521 },
]

// ---------------------------------------------------------------------------
// Feature 2: Content approvals — upcoming posts
// ---------------------------------------------------------------------------
export const socialPosts: SocialPost[] = [
  {
    id: 'post_101',
    title: 'Mid-Year Market Check-In',
    channel: 'LinkedIn',
    scheduledFor: '2026-06-09',
    status: 'pending',
    body: "Markets shifted fast in the first half of 2026. Here are three things every pre-retiree should review before Q3 — and why a 20-minute portfolio check-in now can save headaches later.",
    hashtags: ['#RetirementPlanning', '#MarketUpdate', '#WealthManagement'],
    imageUrl: 'chart',
  },
  {
    id: 'post_102',
    title: '5 Tax Moves Before Year-End',
    channel: 'Facebook',
    scheduledFor: '2026-06-11',
    status: 'pending',
    body: "It's never too early to think about taxes. Swipe through five moves — from Roth conversions to tax-loss harvesting — that could lower your 2026 bill. Which one fits your situation?",
    hashtags: ['#TaxPlanning', '#FinancialFreedom'],
    imageUrl: 'calculator',
  },
  {
    id: 'post_103',
    title: 'Client Spotlight: The Hendersons',
    channel: 'Instagram',
    scheduledFor: '2026-06-13',
    status: 'pending',
    body: 'Meet the Hendersons — they retired two years ahead of schedule. Here is the planning story behind it (shared with permission). 🎉',
    hashtags: ['#ClientStory', '#RetireEarly'],
    imageUrl: 'people',
  },
  {
    id: 'post_104',
    title: 'Understanding the New 529 Rules',
    channel: 'Blog',
    scheduledFor: '2026-06-16',
    status: 'approved',
    body: 'A full breakdown of the 2026 changes to 529-to-Roth rollovers and what they mean for families saving for education.',
    hashtags: ['#529Plan', '#CollegeSavings'],
    imageUrl: 'book',
  },
  {
    id: 'post_105',
    title: 'Weekly Email: Volatility & You',
    channel: 'Email',
    scheduledFor: '2026-06-06',
    status: 'changes_requested',
    body: "This week's newsletter on staying the course during volatile markets.",
    hashtags: [],
    feedback: 'Please soften the headline and add a CTA to book a review.',
    imageUrl: 'mail',
  },
]

// ---------------------------------------------------------------------------
// Feature 3: Print ordering — catalog + existing orders
// ---------------------------------------------------------------------------
export const printCatalog: PrintProduct[] = [
  {
    id: 'prod_bc',
    name: 'Premium Business Cards',
    category: 'Business Cards',
    description: '16pt silk-laminate cards with spot-UV logo. Double-sided full color.',
    unitLabel: 'per 250',
    basePrice: 48,
    turnaround: '5-7 business days',
    imageUrl: 'card',
  },
  {
    id: 'prod_br',
    name: 'Tri-Fold Brochure',
    category: 'Brochures',
    description: '8.5x11 tri-fold on 100lb gloss. Great for seminars and lobby displays.',
    unitLabel: 'per 100',
    basePrice: 119,
    turnaround: '7-10 business days',
    imageUrl: 'brochure',
  },
  {
    id: 'prod_fl',
    name: 'Event Flyer',
    category: 'Flyers',
    description: '8.5x11 full-color flyer, 100lb gloss text. Ideal for client events.',
    unitLabel: 'per 250',
    basePrice: 72,
    turnaround: '4-6 business days',
    imageUrl: 'flyer',
  },
  {
    id: 'prod_pc',
    name: 'Seminar Postcards',
    category: 'Postcards',
    description: '6x9 EDDM-ready postcards. Mailing service available on request.',
    unitLabel: 'per 500',
    basePrice: 165,
    turnaround: '6-8 business days',
    imageUrl: 'postcard',
  },
  {
    id: 'prod_bn',
    name: 'Retractable Banner',
    category: 'Banners',
    description: '33x80 retractable banner with stand and carry case.',
    unitLabel: 'each',
    basePrice: 139,
    turnaround: '7-9 business days',
    imageUrl: 'banner',
  },
  {
    id: 'prod_fo',
    name: 'Presentation Folders',
    category: 'Folders',
    description: '9x12 pocket folders with business-card slits. Foil logo optional.',
    unitLabel: 'per 100',
    basePrice: 188,
    turnaround: '8-10 business days',
    imageUrl: 'folder',
  },
]

export const printOrders: PrintOrder[] = [
  {
    id: 'ord_5001',
    productName: 'Premium Business Cards',
    category: 'Business Cards',
    quantity: 500,
    status: 'in_production',
    submittedOn: '2026-05-28',
    estimatedCost: 96,
    shipTo: 'Frazier Wealth Partners, 220 Market St, Suite 400',
  },
  {
    id: 'ord_5002',
    productName: 'Seminar Postcards',
    category: 'Postcards',
    quantity: 1000,
    status: 'shipped',
    submittedOn: '2026-05-19',
    estimatedCost: 330,
    shipTo: 'Frazier Wealth Partners, 220 Market St, Suite 400',
    notes: 'For June retirement seminar.',
  },
  {
    id: 'ord_5003',
    productName: 'Tri-Fold Brochure',
    category: 'Brochures',
    quantity: 200,
    status: 'delivered',
    submittedOn: '2026-04-30',
    estimatedCost: 238,
    shipTo: 'Frazier Wealth Partners, 220 Market St, Suite 400',
  },
]

// ---------------------------------------------------------------------------
// Feature 4: Support tickets
// ---------------------------------------------------------------------------
export const supportTickets: SupportTicket[] = [
  {
    id: 'tkt_9001',
    subject: 'Update headshot on homepage',
    type: 'Website',
    priority: 'normal',
    status: 'in_progress',
    createdOn: '2026-06-02',
    updatedOn: '2026-06-04',
    description: 'New professional headshots attached — please swap the homepage and About page photos.',
    assignedTo: 'Dana Whitfield',
  },
  {
    id: 'tkt_9002',
    subject: 'Need a landing page for July webinar',
    type: 'Digital',
    priority: 'high',
    status: 'waiting_on_you',
    createdOn: '2026-05-30',
    updatedOn: '2026-06-03',
    description: 'Requesting a registration landing page for the "Retire by 60" webinar on July 15.',
    assignedTo: 'Marcus Lee',
  },
  {
    id: 'tkt_9003',
    subject: 'Reprint business cards for new hire',
    type: 'Print',
    priority: 'low',
    status: 'resolved',
    createdOn: '2026-05-21',
    updatedOn: '2026-05-26',
    description: 'New associate Priya Nair — 250 cards, same template.',
    assignedTo: 'Dana Whitfield',
  },
]

// ---------------------------------------------------------------------------
// Feature 5: SEO snapshot
// ---------------------------------------------------------------------------
export const seoSnapshot: SeoSnapshot = {
  overallScore: 78,
  previousScore: 71,
  indexedPages: 142,
  backlinks: 318,
  domainAuthority: 34,
  coreWebVitalsPassing: true,
  lastAuditDate: '2026-06-03',
  issues: [
    { label: 'Missing meta descriptions', severity: 'medium', count: 6 },
    { label: 'Images without alt text', severity: 'low', count: 14 },
    { label: 'Slow-loading pages', severity: 'high', count: 2 },
    { label: 'Broken internal links', severity: 'medium', count: 3 },
  ],
  rankTrend: [
    { period: 'Jan', avgRank: 28.4 },
    { period: 'Feb', avgRank: 25.1 },
    { period: 'Mar', avgRank: 22.7 },
    { period: 'Apr', avgRank: 19.8 },
    { period: 'May', avgRank: 16.5 },
    { period: 'Jun', avgRank: 13.9 },
  ],
  keywords: [
    { id: 'kw1', term: 'financial advisor near me', currentRank: 4, previousRank: 9, searchVolume: 2400, onPageOne: true },
    { id: 'kw2', term: 'retirement planning [city]', currentRank: 2, previousRank: 5, searchVolume: 1300, onPageOne: true },
    { id: 'kw3', term: 'fee-only financial planner', currentRank: 8, previousRank: 12, searchVolume: 880, onPageOne: true },
    { id: 'kw4', term: 'roth conversion strategy', currentRank: 11, previousRank: 14, searchVolume: 720, onPageOne: false },
    { id: 'kw5', term: 'wealth management firm', currentRank: 15, previousRank: 15, searchVolume: 1900, onPageOne: false },
    { id: 'kw6', term: '401k rollover advice', currentRank: 6, previousRank: 18, searchVolume: 1100, onPageOne: true },
    { id: 'kw7', term: 'estate planning checklist', currentRank: 19, previousRank: 23, searchVolume: 640, onPageOne: false },
  ],
}
