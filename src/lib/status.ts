import type { BadgeTone } from '../components/ui/Badge'
import type {
  OrderStatus,
  PostStatus,
  SupportPriority,
  TicketStatus,
} from '../types'

interface StatusMeta {
  label: string
  tone: BadgeTone
}

export const postStatusMeta: Record<PostStatus, StatusMeta> = {
  pending: { label: 'Awaiting your review', tone: 'amber' },
  approved: { label: 'Approved', tone: 'green' },
  changes_requested: { label: 'Changes requested', tone: 'red' },
  published: { label: 'Published', tone: 'blue' },
}

export const orderStatusMeta: Record<OrderStatus, StatusMeta> = {
  submitted: { label: 'Submitted', tone: 'gray' },
  in_review: { label: 'In review', tone: 'amber' },
  in_production: { label: 'In production', tone: 'blue' },
  shipped: { label: 'Shipped', tone: 'purple' },
  delivered: { label: 'Delivered', tone: 'green' },
}

export const ticketStatusMeta: Record<TicketStatus, StatusMeta> = {
  open: { label: 'Open', tone: 'blue' },
  in_progress: { label: 'In progress', tone: 'amber' },
  waiting_on_you: { label: 'Waiting on you', tone: 'red' },
  resolved: { label: 'Resolved', tone: 'green' },
}

export const priorityMeta: Record<SupportPriority, StatusMeta> = {
  low: { label: 'Low', tone: 'gray' },
  normal: { label: 'Normal', tone: 'blue' },
  high: { label: 'High', tone: 'amber' },
  urgent: { label: 'Urgent', tone: 'red' },
}
