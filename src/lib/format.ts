import type { Metric } from '../types'

export function formatMetric(metric: Metric): string {
  switch (metric.format) {
    case 'currency':
      return `$${metric.value.toLocaleString()}`
    case 'percent':
      return `${metric.value}%`
    case 'duration':
      return formatDuration(metric.value)
    case 'number':
    default:
      return metric.value.toLocaleString()
  }
}

/** Seconds -> "2m 34s". */
export function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return m > 0 ? `${m}m ${s}s` : `${s}s`
}

export function formatCurrency(amount: number): string {
  return `$${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export function formatDate(iso: string): string {
  const d = new Date(iso + (iso.length === 10 ? 'T00:00:00' : ''))
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}

export function relativeDay(iso: string): string {
  const target = new Date(iso + 'T00:00:00')
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  const diff = Math.round((target.getTime() - now.getTime()) / 86_400_000)
  if (diff === 0) return 'Today'
  if (diff === 1) return 'Tomorrow'
  if (diff === -1) return 'Yesterday'
  if (diff > 1) return `in ${diff} days`
  return `${Math.abs(diff)} days ago`
}

/** Combine class names, dropping falsy values. */
export function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ')
}
