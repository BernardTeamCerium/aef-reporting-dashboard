import { ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react'
import type { ReactNode } from 'react'
import type { Metric } from '../../types'
import { formatMetric } from '../../lib/format'
import { cx } from '../../lib/format'
import { Card } from './Card'

interface StatCardProps {
  metric: Metric
  icon: ReactNode
  /** Lower-is-better metrics (like avg rank) flip the color of the trend. */
  invertTrend?: boolean
}

export function StatCard({ metric, icon, invertTrend = false }: StatCardProps) {
  const isPositive = invertTrend ? metric.changePct < 0 : metric.changePct > 0
  const isNeutral = metric.changePct === 0

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
          {icon}
        </div>
        {!isNeutral && (
          <span
            className={cx(
              'inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-semibold',
              isPositive
                ? 'bg-emerald-50 text-emerald-700'
                : 'bg-rose-50 text-rose-700',
            )}
          >
            {metric.changePct > 0 ? (
              <ArrowUpRight size={13} />
            ) : (
              <ArrowDownRight size={13} />
            )}
            {Math.abs(metric.changePct)}%
          </span>
        )}
        {isNeutral && (
          <span className="inline-flex items-center gap-0.5 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-500">
            <Minus size={13} />
          </span>
        )}
      </div>
      <p className="mt-4 text-2xl font-bold tracking-tight text-slate-900">
        {formatMetric(metric)}
      </p>
      <p className="mt-1 text-sm text-slate-500">{metric.label}</p>
    </Card>
  )
}
