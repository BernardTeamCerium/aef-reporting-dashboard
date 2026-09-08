import { useMemo, useState } from 'react'
import { BadgeCheck, CreditCard, Receipt, ShieldCheck } from 'lucide-react'
import { Card, CardHeader } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import type { BadgeTone } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { useToast } from '../components/ui/Toast'
import { useMyAdvisor } from '../state/useMyAdvisor'
import type { BillingItem, BillingStatus } from '../state/Advisors'
import { GATED_FEATURES, hasFeature } from '../data/features'
import { formatCurrency, formatDate } from '../lib/format'

const AEF_NAME = 'Allied Elite Financial'

const statusMeta: Record<BillingStatus, { label: string; tone: BadgeTone }> = {
  paid: { label: 'Paid', tone: 'green' },
  due: { label: 'Due', tone: 'amber' },
  covered: { label: `Covered by ${AEF_NAME}`, tone: 'blue' },
}

export function Billing() {
  const advisor = useMyAdvisor()
  const notify = useToast()
  const [payingId, setPayingId] = useState<string | null>(null)

  const isAef = advisor?.affiliation === 'aef'

  // Active monthly subscriptions = every unlocked gated feature.
  const subscriptions = useMemo(
    () => GATED_FEATURES.filter((f) => hasFeature(advisor, f.id)),
    [advisor],
  )
  const monthlyTotal = subscriptions.reduce((sum, f) => sum + f.monthlyCost, 0)

  const invoices = useMemo(
    () => [...(advisor?.billing ?? [])].sort((a, b) => b.period.localeCompare(a.period)),
    [advisor],
  )

  const payInvoice = async (invoice: BillingItem) => {
    if (!advisor) return
    const feature = GATED_FEATURES.find((f) => f.name === invoice.item || f.id === invoice.item)
    setPayingId(invoice.id)
    try {
      const res = await fetch('/api/stripe/create-checkout', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          featureId: feature?.id ?? invoice.item,
          featureName: feature?.name ?? invoice.item,
          amount: invoice.amount,
          advisorId: advisor.id,
          email: advisor.email,
        }),
      })
      const data = (await res.json()) as { ok?: boolean; url?: string; reason?: string; error?: string }
      if (data.url) {
        window.location.href = data.url
        return
      }
      notify(data.reason || data.error || 'Checkout is not available yet — your OneStop team will follow up.')
    } catch {
      notify('Could not start checkout. Please try again in a moment.')
    } finally {
      setPayingId(null)
    }
  }

  return (
    <div className="space-y-6">
      {/* Hero */}
      <Card className="overflow-hidden">
        <div className="flex flex-col gap-4 bg-gradient-to-br from-brand-600 to-brand-800 p-6 text-white sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/15">
              <Receipt size={22} />
            </div>
            <div>
              <h3 className="text-lg font-semibold">Billing</h3>
              <p className="mt-0.5 max-w-lg text-sm text-brand-100">
                {isAef
                  ? `Your OneStop services are covered by ${AEF_NAME}. Nothing is billed to you directly.`
                  : 'Your monthly OneStop services and invoice history. Pay any open invoice securely below.'}
              </p>
            </div>
          </div>
          <div className="rounded-xl bg-white/10 px-5 py-3 text-right">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-brand-100">Monthly total</p>
            <p className="text-2xl font-bold">{formatCurrency(monthlyTotal)}</p>
            {isAef && (
              <p className="mt-0.5 inline-flex items-center gap-1 text-xs text-brand-100">
                <ShieldCheck size={13} /> Paid by {AEF_NAME}
              </p>
            )}
          </div>
        </div>
      </Card>

      {/* Active subscriptions */}
      <Card>
        <CardHeader
          title="Active services"
          subtitle="What you're subscribed to this month"
          icon={<BadgeCheck size={18} />}
        />
        <div className="divide-y divide-slate-100">
          {subscriptions.map((f) => (
            <div key={f.id} className="flex items-center justify-between gap-3 px-5 py-3.5">
              <div className="min-w-0">
                <p className="text-sm font-medium text-slate-800">{f.name}</p>
                <p className="text-xs text-slate-500">{f.description}</p>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <span className="text-sm font-semibold text-slate-900">
                  {formatCurrency(f.monthlyCost)}
                  <span className="text-xs font-normal text-slate-400"> /mo</span>
                </span>
                {isAef ? (
                  <Badge tone="blue"><ShieldCheck size={12} /> Covered</Badge>
                ) : (
                  <Badge tone="green">Active</Badge>
                )}
              </div>
            </div>
          ))}
          {subscriptions.length === 0 && (
            <p className="px-5 py-10 text-center text-sm text-slate-400">
              No active services yet — unlock features from your dashboard to see them here.
            </p>
          )}
        </div>
      </Card>

      {/* Invoice history */}
      <Card>
        <CardHeader
          title="Invoices"
          subtitle={isAef ? `Billed to ${AEF_NAME} on your behalf` : 'Your invoice history'}
          icon={<CreditCard size={18} />}
        />
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-left text-xs uppercase tracking-wide text-slate-400">
                <th className="px-5 py-3 font-medium">Service</th>
                <th className="px-5 py-3 font-medium">Period</th>
                <th className="px-5 py-3 font-medium">Amount</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {invoices.map((inv) => {
                const meta = statusMeta[inv.status]
                return (
                  <tr key={inv.id} className="hover:bg-slate-50">
                    <td className="px-5 py-3 font-medium text-slate-800">{inv.item}</td>
                    <td className="px-5 py-3 text-slate-500">{formatPeriod(inv.period)}</td>
                    <td className="px-5 py-3 text-slate-700">{formatCurrency(inv.amount)}</td>
                    <td className="px-5 py-3">
                      <Badge tone={meta.tone}>{meta.label}</Badge>
                      {inv.status === 'paid' && inv.paidOn && (
                        <span className="ml-2 text-xs text-slate-400">{formatDate(inv.paidOn)}</span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-right">
                      {inv.status === 'due' && !isAef && (
                        <Button size="sm" onClick={() => payInvoice(inv)} disabled={payingId === inv.id}>
                          <CreditCard size={14} /> {payingId === inv.id ? 'Redirecting…' : 'Pay now'}
                        </Button>
                      )}
                    </td>
                  </tr>
                )
              })}
              {invoices.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-5 py-10 text-center text-sm text-slate-400">
                    No invoices yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {!isAef && (
          <p className="border-t border-slate-100 px-5 py-3 text-xs text-slate-400">
            Payments are processed securely by Stripe. You'll be redirected to complete checkout.
          </p>
        )}
      </Card>
    </div>
  )
}

/** '2026-09' -> 'September 2026'. */
function formatPeriod(period: string): string {
  const [y, m] = period.split('-').map(Number)
  if (!y || !m) return period
  return new Date(y, m - 1, 1).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })
}
