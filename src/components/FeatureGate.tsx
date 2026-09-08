import { type ReactNode } from 'react'
import { Lock, Sparkles } from 'lucide-react'
import { Card } from './ui/Card'
import { Button } from './ui/Button'
import { useToast } from './ui/Toast'
import { useNotify } from '../state/Notifications'
import { useAdvisors } from '../state/Advisors'
import { useMyAdvisor } from '../state/useMyAdvisor'
import { featureById, featureRequest, hasFeature } from '../data/features'
import { formatCurrency } from '../lib/format'

/** Renders children only if the signed-in advisor has the feature; otherwise a paywall. */
export function FeatureGate({ featureId, children }: { featureId: string; children: ReactNode }) {
  const advisor = useMyAdvisor()
  if (hasFeature(advisor, featureId)) return <>{children}</>
  return <LockedFeature featureId={featureId} />
}

export function LockedFeature({ featureId, compact }: { featureId: string; compact?: boolean }) {
  const feature = featureById(featureId)
  const advisor = useMyAdvisor()
  const { addAddonRequestTo } = useAdvisors()
  const notify = useToast()
  const pushNotify = useNotify()

  if (!feature) return null
  const existing = featureRequest(advisor, featureId)
  const pending = existing && (existing.status === 'requested' || existing.status === 'invoiced')

  const request = () => {
    if (!advisor) return
    addAddonRequestTo(advisor.id, { serviceId: feature.id, serviceName: feature.name })
    notify(`Access requested for ${feature.name} — your team will follow up.`)
    pushNotify({
      audience: 'admin',
      type: 'feature_request',
      title: 'Feature access requested',
      body: `${advisor.firm} requested access to ${feature.name} (${formatCurrency(feature.monthlyCost)}/mo).`,
      link: `/admin/advisors/${advisor.id}`,
      email: true,
    })
  }

  return (
    <div className={compact ? '' : 'mx-auto max-w-xl py-6'}>
      <Card className="overflow-hidden">
        <div className="flex items-center gap-3 bg-gradient-to-br from-brand-600 to-brand-800 px-6 py-5 text-white">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/15">
            <Lock size={20} />
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-widest text-brand-100">Premium feature</p>
            <h2 className="text-lg font-semibold">{feature.name}</h2>
          </div>
        </div>
        <div className="space-y-4 p-6">
          <p className="text-sm text-slate-600">{feature.description}</p>
          <div className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
            <span className="text-sm text-slate-500">Price</span>
            <span className="text-lg font-bold text-slate-900">
              {formatCurrency(feature.monthlyCost)}
              <span className="text-sm font-normal text-slate-400"> / month</span>
            </span>
          </div>
          {pending ? (
            <div className="flex items-center gap-2 rounded-lg bg-amber-50 px-3 py-2.5 text-sm text-amber-700">
              <Sparkles size={16} /> Access requested — your OneStop team will confirm the cost and turn it on.
            </div>
          ) : (
            <Button className="w-full" onClick={request}>
              <Sparkles size={16} /> Request access
            </Button>
          )}
          <p className="text-center text-xs text-slate-400">
            Requesting sends this to your OneStop team — they'll invoice you or confirm it's included.
          </p>
        </div>
      </Card>
    </div>
  )
}

/** Small inline gate for a section within a page. */
export function FeatureSection({ featureId, children }: { featureId: string; children: ReactNode }) {
  const advisor = useMyAdvisor()
  if (hasFeature(advisor, featureId)) return <>{children}</>
  return <LockedFeature featureId={featureId} compact />
}
