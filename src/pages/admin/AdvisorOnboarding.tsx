import { useState } from 'react'
import {
  Activity,
  CalendarClock,
  CheckCircle2,
  ExternalLink,
  FileSignature,
  Loader2,
  Send,
  Signal,
} from 'lucide-react'
import { Card, CardHeader } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import type { BadgeTone } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { useToast } from '../../components/ui/Toast'
import { useAdvisors, type AdvisorAccount } from '../../state/Advisors'
import { useAuth } from '../../state/Auth'
import { GATED_FEATURES, hasFeature } from '../../data/features'
import { formatCurrency, formatDate, cx } from '../../lib/format'

const inputCls =
  'w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100'

const agreeMeta: Record<'not_sent' | 'sent' | 'signed', { label: string; tone: BadgeTone }> = {
  not_sent: { label: 'Not sent', tone: 'gray' },
  sent: { label: 'Sent — awaiting signature', tone: 'amber' },
  signed: { label: 'Signed', tone: 'green' },
}
const siteMeta: Record<'operational' | 'degraded' | 'down', { label: string; tone: BadgeTone }> = {
  operational: { label: 'Operational', tone: 'green' },
  degraded: { label: 'Degraded', tone: 'amber' },
  down: { label: 'Down', tone: 'red' },
}

export function AdvisorOnboarding({ advisor }: { advisor: AdvisorAccount }) {
  const { updateAdvisor, setFeature } = useAdvisors()
  const { demoMode, getAccessToken } = useAuth()
  const notify = useToast()
  const [sending, setSending] = useState(false)
  const [link, setLink] = useState(advisor.onboarding?.meetingLink ?? '')

  const agreement = advisor.onboarding?.agreementStatus ?? 'not_sent'
  const site = advisor.siteStatus ?? 'operational'

  const setOnboarding = (patch: Partial<NonNullable<AdvisorAccount['onboarding']>>) =>
    updateAdvisor(advisor.id, { onboarding: { agreementStatus: agreement, ...advisor.onboarding, ...patch } })

  const sendAgreement = async () => {
    setSending(true)
    try {
      if (!demoMode) {
        const token = await getAccessToken()
        const res = await fetch('/api/ghl/send-agreement', {
          method: 'POST',
          headers: { 'content-type': 'application/json', ...(token ? { authorization: `Bearer ${token}` } : {}) },
          body: JSON.stringify({ name: advisor.name, email: advisor.email, phone: advisor.phone, firm: advisor.firm }),
        })
        const data = await res.json().catch(() => ({}))
        if (!res.ok) throw new Error(data.error ?? 'Send failed.')
        if (!data.ok) { notify(data.reason ?? 'GoHighLevel not connected yet.'); setSending(false); return }
      }
      setOnboarding({ agreementStatus: 'sent', agreementSentOn: new Date().toISOString().slice(0, 10) })
      notify(demoMode ? 'Demo: in production this sends the agreement via GoHighLevel.' : `Agreement sent to ${advisor.name}.`)
    } catch (e) {
      notify(e instanceof Error ? e.message : 'Send failed.')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">
        Agreements, meetings, and client messaging route through your{' '}
        <span className="font-semibold text-slate-800">GoHighLevel</span> account. These controls are
        the branded front-end over GHL.
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Agreement */}
        <Card>
          <CardHeader title="Onboarding agreement" subtitle="Send the service agreement to e-sign" icon={<FileSignature size={18} />} />
          <div className="space-y-3 p-5">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600">Status</span>
              <Badge tone={agreeMeta[agreement].tone}>{agreeMeta[agreement].label}</Badge>
            </div>
            {advisor.onboarding?.agreementSentOn && (
              <p className="text-xs text-slate-400">Sent {formatDate(advisor.onboarding.agreementSentOn)}</p>
            )}
            <div className="flex flex-wrap gap-2 pt-1">
              <Button size="sm" onClick={sendAgreement} disabled={sending || agreement === 'signed'}>
                {sending ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
                {agreement === 'not_sent' ? 'Send agreement' : 'Resend'}
              </Button>
              {agreement !== 'signed' && (
                <Button size="sm" variant="secondary" onClick={() => { setOnboarding({ agreementStatus: 'signed' }); notify('Marked as signed.') }}>
                  <CheckCircle2 size={15} /> Mark signed
                </Button>
              )}
            </div>
          </div>
        </Card>

        {/* Meeting / Zoom */}
        <Card>
          <CardHeader title="Book a meeting" subtitle="Zoom scheduling via a GoHighLevel calendar" icon={<CalendarClock size={18} />} />
          <div className="space-y-3 p-5">
            {advisor.onboarding?.meetingLink ? (
              <a href={advisor.onboarding.meetingLink} target="_blank" rel="noreferrer">
                <Button size="sm"><ExternalLink size={15} /> Open booking page</Button>
              </a>
            ) : (
              <p className="text-sm text-slate-500">No booking link set yet.</p>
            )}
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-slate-500">GoHighLevel / Zoom booking link</span>
              <div className="flex gap-2">
                <input value={link} onChange={(e) => setLink(e.target.value)} placeholder="https://cal.gohighlevel.com/…" className={inputCls} />
                <Button size="sm" variant="secondary" onClick={() => { setOnboarding({ meetingLink: link.trim() || undefined }); notify('Booking link saved.') }}>Save</Button>
              </div>
            </label>
          </div>
        </Card>

        {/* Site / SEO health */}
        <Card>
          <CardHeader title="Site & SEO health" subtitle="Is their site up and optimized" icon={<Signal size={18} />} />
          <div className="space-y-3 p-5">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600">Website status</span>
              <Badge tone={siteMeta[site].tone}>{siteMeta[site].label}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600">SEO score</span>
              <span className="text-sm font-medium text-slate-800">{advisor.metrics.seoScore}/100</span>
            </div>
            {advisor.siteCheckedAt && <p className="text-xs text-slate-400">Last checked {formatDate(advisor.siteCheckedAt)}</p>}
          </div>
        </Card>

        {/* Messaging volume */}
        <Card>
          <CardHeader title="Messaging volume" subtitle="Emails & texts sent for this advisor" icon={<Activity size={18} />} />
          <div className="p-5">
            <p className="text-3xl font-bold tracking-tight text-slate-900">{(advisor.messagesSent ?? 0).toLocaleString()}</p>
            <p className="text-xs text-slate-500">messages sent to date</p>
          </div>
        </Card>
      </div>

      {/* Feature access — admin toggles */}
      <Card>
        <CardHeader title="Feature access" subtitle="Turn premium features on or off for this advisor" icon={<Signal size={18} />} />
        <div className="divide-y divide-slate-100">
          {GATED_FEATURES.map((f) => {
            const on = hasFeature(advisor, f.id)
            return (
              <div key={f.id} className="flex items-center justify-between gap-3 px-5 py-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-800">{f.name}</p>
                  <p className="text-xs text-slate-500">{formatCurrency(f.monthlyCost)}/mo · {f.description}</p>
                </div>
                <button
                  role="switch"
                  aria-checked={on}
                  aria-label={`${on ? 'Disable' : 'Enable'} ${f.name}`}
                  onClick={() => setFeature(advisor.id, f.id, !on)}
                  className={cx('relative h-6 w-11 shrink-0 rounded-full transition-colors', on ? 'bg-brand-600' : 'bg-slate-300')}
                >
                  <span className={cx('absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform', on && 'translate-x-5')} />
                </button>
              </div>
            )
          })}
        </div>
      </Card>
    </div>
  )
}
