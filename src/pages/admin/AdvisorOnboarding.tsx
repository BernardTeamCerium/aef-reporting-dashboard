import { useState } from 'react'
import {
  Activity,
  CalendarClock,
  CheckCircle2,
  ClipboardList,
  ExternalLink,
  FileSignature,
  Loader2,
  MessageSquare,
  Rocket,
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

const siteMeta: Record<'operational' | 'degraded' | 'down', { label: string; tone: BadgeTone }> = {
  operational: { label: 'Operational', tone: 'green' },
  degraded: { label: 'Degraded', tone: 'amber' },
  down: { label: 'Down', tone: 'red' },
}

type Onboarding = NonNullable<AdvisorAccount['onboarding']>

export function AdvisorOnboarding({ advisor }: { advisor: AdvisorAccount }) {
  const { updateAdvisor, setFeature } = useAdvisors()
  const { demoMode, getAccessToken } = useAuth()
  const notify = useToast()
  const [busy, setBusy] = useState<string | null>(null)
  const [link, setLink] = useState(advisor.onboarding?.meetingLink ?? '')
  const [bio, setBio] = useState(advisor.onboarding?.bio ?? '')

  const ob: Onboarding = { agreementStatus: 'not_sent', ...advisor.onboarding }
  const site = advisor.siteStatus ?? 'operational'

  const patch = (p: Partial<Onboarding>) =>
    updateAdvisor(advisor.id, { onboarding: { ...ob, ...p } })

  // Route an onboarding message through GoHighLevel (welcome text / questionnaire /
  // agreement); demo-safe. Returns true if the step should be marked as sent.
  const route = async (endpoint: string, body: Record<string, unknown>): Promise<boolean> => {
    if (demoMode) {
      notify('Demo: in production this sends via GoHighLevel.')
      return true
    }
    const token = await getAccessToken()
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'content-type': 'application/json', ...(token ? { authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify({ name: advisor.name, email: advisor.email, phone: advisor.phone, firm: advisor.firm, ...body }),
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) throw new Error(data.error ?? 'Send failed.')
    if (!data.ok) { notify(data.reason ?? 'GoHighLevel not connected yet.'); return false }
    return true
  }

  const run = async (id: string, fn: () => Promise<void>) => {
    setBusy(id)
    try { await fn() } catch (e) { notify(e instanceof Error ? e.message : 'Something went wrong.') } finally { setBusy(null) }
  }

  const sendWelcome = () => run('welcome', async () => {
    const ok = await route('/api/ghl/send-onboarding', { step: 'welcome' })
    if (!ok) return
    patch({ welcomeSentOn: new Date().toISOString().slice(0, 10) })
    notify(demoMode ? 'Welcome text queued (demo).' : `Welcome text sent to ${advisor.name}.`)
  })

  const sendQuestionnaire = () => run('questionnaire', async () => {
    const ok = await route('/api/ghl/send-onboarding', { step: 'questionnaire' })
    if (!ok) return
    patch({ questionnaireStatus: 'sent', questionnaireSentOn: new Date().toISOString().slice(0, 10) })
    notify(demoMode ? 'Questionnaire sent (demo).' : `Bio questionnaire sent to ${advisor.name}.`)
  })

  const saveBio = () => {
    patch({ bio: bio.trim() || undefined, questionnaireStatus: 'completed' })
    notify('Bio saved & questionnaire marked complete.')
  }

  const sendAgreement = () => run('agreement', async () => {
    const ok = await route('/api/ghl/send-agreement', {})
    if (!ok) return
    patch({ agreementStatus: 'sent', agreementSentOn: new Date().toISOString().slice(0, 10) })
    notify(demoMode ? 'Agreement sent (demo).' : `Agreement sent to ${advisor.name}.`)
  })

  // ─── Step definitions ───
  const steps = [
    { key: 'welcome', title: 'Welcome text', done: Boolean(ob.welcomeSentOn) },
    { key: 'questionnaire', title: 'Bio questionnaire', done: ob.questionnaireStatus === 'completed' },
    { key: 'agreement', title: 'Sign agreement', done: ob.agreementStatus === 'signed' },
    { key: 'meeting', title: 'Kickoff meeting', done: Boolean(ob.meetingBooked) },
    { key: 'activate', title: 'Activate & go live', done: Boolean(ob.activatedOn) },
  ]
  const completed = steps.filter((s) => s.done).length
  const allPriorDone = steps.slice(0, 4).every((s) => s.done)

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">
        A guided onboarding sequence — welcome text, bio questionnaire, service agreement, kickoff
        meeting, then go live. Messaging & agreements route through your{' '}
        <span className="font-semibold text-slate-800">GoHighLevel</span> account.
      </div>

      {/* Progress */}
      <Card className="p-5">
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-900">Onboarding progress</h3>
          <span className="text-sm font-medium text-slate-500">{completed} of {steps.length} complete</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-slate-100">
          <div className="h-2 rounded-full bg-brand-500 transition-all" style={{ width: `${(completed / steps.length) * 100}%` }} />
        </div>
      </Card>

      {/* Stepper */}
      <div className="space-y-3">
        {/* 1 — Welcome text */}
        <StepCard n={1} icon={<MessageSquare size={17} />} title="Welcome text" done={steps[0].done}
          subtitle="Send a warm welcome from OneStop to kick things off"
          meta={ob.welcomeSentOn ? `Sent ${formatDate(ob.welcomeSentOn)}` : undefined}>
          <Button size="sm" onClick={sendWelcome} disabled={busy === 'welcome'}>
            {busy === 'welcome' ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
            {ob.welcomeSentOn ? 'Resend welcome' : 'Send welcome text'}
          </Button>
        </StepCard>

        {/* 2 — Bio questionnaire */}
        <StepCard n={2} icon={<ClipboardList size={17} />} title="Bio questionnaire" done={steps[1].done}
          subtitle="Collect the advisor's bio and profile details"
          meta={
            ob.questionnaireStatus === 'completed' ? 'Completed'
            : ob.questionnaireStatus === 'sent' ? `Sent ${ob.questionnaireSentOn ? formatDate(ob.questionnaireSentOn) : ''} — awaiting reply`
            : undefined
          }>
          <div className="w-full space-y-3">
            <div className="flex flex-wrap gap-2">
              <Button size="sm" onClick={sendQuestionnaire} disabled={busy === 'questionnaire'}>
                {busy === 'questionnaire' ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
                {ob.questionnaireStatus === 'not_sent' ? 'Send questionnaire' : 'Resend questionnaire'}
              </Button>
            </div>
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-slate-500">Advisor bio (from their questionnaire)</span>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={3}
                placeholder="Paste or type the advisor's bio once they return the questionnaire…"
                className={cx(inputCls, 'resize-none')}
              />
            </label>
            <Button size="sm" variant="secondary" onClick={saveBio} disabled={!bio.trim()}>
              <CheckCircle2 size={15} /> Save bio & mark complete
            </Button>
          </div>
        </StepCard>

        {/* 3 — Agreement */}
        <StepCard n={3} icon={<FileSignature size={17} />} title="Sign agreement" done={steps[2].done}
          subtitle="Send the service agreement to e-sign"
          meta={
            ob.agreementStatus === 'signed' ? 'Signed'
            : ob.agreementStatus === 'sent' ? `Sent ${ob.agreementSentOn ? formatDate(ob.agreementSentOn) : ''} — awaiting signature`
            : undefined
          }>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" onClick={sendAgreement} disabled={busy === 'agreement' || ob.agreementStatus === 'signed'}>
              {busy === 'agreement' ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
              {ob.agreementStatus === 'not_sent' ? 'Send agreement' : 'Resend'}
            </Button>
            {ob.agreementStatus !== 'signed' && (
              <Button size="sm" variant="secondary" onClick={() => { patch({ agreementStatus: 'signed' }); notify('Marked as signed.') }}>
                <CheckCircle2 size={15} /> Mark signed
              </Button>
            )}
          </div>
        </StepCard>

        {/* 4 — Kickoff meeting */}
        <StepCard n={4} icon={<CalendarClock size={17} />} title="Kickoff meeting" done={steps[3].done}
          subtitle="Book the kickoff call (Zoom via a GoHighLevel calendar)">
          <div className="w-full space-y-3">
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-slate-500">Booking link</span>
              <div className="flex gap-2">
                <input value={link} onChange={(e) => setLink(e.target.value)} placeholder="https://cal.gohighlevel.com/…" className={inputCls} />
                <Button size="sm" variant="secondary" onClick={() => { patch({ meetingLink: link.trim() || undefined }); notify('Booking link saved.') }}>Save</Button>
              </div>
            </label>
            <div className="flex flex-wrap gap-2">
              {ob.meetingLink && (
                <a href={ob.meetingLink} target="_blank" rel="noreferrer">
                  <Button size="sm" variant="secondary"><ExternalLink size={15} /> Open booking page</Button>
                </a>
              )}
              <Button size="sm" onClick={() => { patch({ meetingBooked: !ob.meetingBooked }); notify(ob.meetingBooked ? 'Meeting unmarked.' : 'Kickoff meeting marked as booked.') }}>
                <CheckCircle2 size={15} /> {ob.meetingBooked ? 'Booked' : 'Mark booked'}
              </Button>
            </div>
          </div>
        </StepCard>

        {/* 5 — Activate */}
        <StepCard n={5} icon={<Rocket size={17} />} title="Activate & go live" done={steps[4].done}
          subtitle="Finish onboarding and switch the advisor to active"
          meta={ob.activatedOn ? `Activated ${formatDate(ob.activatedOn)}` : undefined}>
          {ob.activatedOn ? (
            <Badge tone="green"><CheckCircle2 size={12} /> Live</Badge>
          ) : (
            <Button
              size="sm"
              onClick={() => {
                patch({ activatedOn: new Date().toISOString().slice(0, 10) })
                updateAdvisor(advisor.id, { status: 'active' })
                notify(`${advisor.firm} is now live! 🎉`)
              }}
              disabled={!allPriorDone}
              title={allPriorDone ? undefined : 'Complete the earlier steps first'}
            >
              <Rocket size={15} /> Activate advisor
            </Button>
          )}
        </StepCard>
      </div>

      {/* Operational health */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
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

function StepCard({
  n, icon, title, subtitle, meta, done, children,
}: {
  n: number
  icon: React.ReactNode
  title: string
  subtitle: string
  meta?: string
  done: boolean
  children: React.ReactNode
}) {
  return (
    <Card className="p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
        <div className="flex items-center gap-3">
          <span className={cx(
            'flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold',
            done ? 'bg-emerald-100 text-emerald-700' : 'bg-brand-50 text-brand-600',
          )}>
            {done ? <CheckCircle2 size={18} /> : n}
          </span>
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-50 text-slate-400 sm:hidden">{icon}</span>
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h4 className="text-sm font-semibold text-slate-900">{title}</h4>
            {done && <Badge tone="green">Done</Badge>}
            {!done && meta && <Badge tone="amber">In progress</Badge>}
          </div>
          <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p>
          {meta && <p className="mt-0.5 text-xs text-slate-400">{meta}</p>}
          <div className="mt-3 flex flex-wrap items-center gap-2">{children}</div>
        </div>
      </div>
    </Card>
  )
}
