import { useMemo, useState } from 'react'
import { Loader2, Mail, Send, Users } from 'lucide-react'
import { Card, CardHeader } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { useToast } from '../components/ui/Toast'
import { useClients } from '../state/Clients'
import { useAuth } from '../state/Auth'
import { cx } from '../lib/format'

const inputCls =
  'w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100'

type Audience = 'all' | 'reviewed'

export function Newsletter() {
  const { clients, settings } = useClients()
  const { demoMode, getAccessToken } = useAuth()
  const notify = useToast()
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [audience, setAudience] = useState<Audience>('all')
  const [sending, setSending] = useState(false)

  const recipients = useMemo(() => {
    const withEmail = clients.filter((c) => c.email)
    return audience === 'reviewed' ? withEmail.filter((c) => c.reviewStatus === 'reviewed') : withEmail
  }, [clients, audience])

  const canSend = subject.trim().length > 2 && body.trim().length > 10 && recipients.length > 0

  const send = async () => {
    if (!canSend) return
    setSending(true)
    try {
      if (!demoMode) {
        const token = await getAccessToken()
        // One send per recipient through the configured channel (Zapier/GHL).
        await Promise.allSettled(
          recipients.map((c) =>
            fetch('/api/me/send', {
              method: 'POST',
              headers: { 'content-type': 'application/json', ...(token ? { authorization: `Bearer ${token}` } : {}) },
              body: JSON.stringify({ to: c.email, channel: 'email', subject: subject.trim(), body: body.trim(), name: c.name, purpose: 'newsletter' }),
            }),
          ),
        )
      }
      notify(
        demoMode
          ? `Demo: this would email ${recipients.length} client${recipients.length === 1 ? '' : 's'} via your connected email.`
          : `Newsletter sent to ${recipients.length} client${recipients.length === 1 ? '' : 's'}.`,
      )
      setSubject('')
      setBody('')
    } catch {
      notify('Something went wrong sending the newsletter.')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="space-y-6">
      <p className="text-sm text-slate-500">
        Send a mass email update to your clients — market commentary, announcements, or a seasonal
        note. It sends from {settings.firmName} through your connected email.
      </p>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title="Compose newsletter" subtitle="Write once, send to your whole list" icon={<Mail size={18} />} />
          <div className="space-y-4 p-5">
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-slate-700">Subject</span>
              <input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="e.g. Your Q3 market update" className={inputCls} />
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-slate-700">Message</span>
              <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={9} placeholder="Write your update to clients…" className={cx(inputCls, 'resize-none')} />
            </label>
          </div>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader title="Audience" subtitle="Who receives it" icon={<Users size={18} />} />
            <div className="space-y-2 p-5">
              {([['all', 'All clients'], ['reviewed', 'Clients who left a review']] as [Audience, string][]).map(([val, label]) => (
                <button
                  key={val}
                  onClick={() => setAudience(val)}
                  className={cx(
                    'flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium ring-1 ring-inset transition-colors',
                    audience === val ? 'bg-brand-50 text-brand-700 ring-brand-200' : 'bg-white text-slate-600 ring-slate-200 hover:bg-slate-50',
                  )}
                >
                  {label}
                </button>
              ))}
              <div className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2.5">
                <span className="text-sm text-slate-500">Recipients</span>
                <Badge tone="blue">{recipients.length}</Badge>
              </div>
            </div>
          </Card>
          <Button className="w-full" onClick={send} disabled={!canSend || sending}>
            {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
            Send to {recipients.length} {recipients.length === 1 ? 'client' : 'clients'}
          </Button>
          {recipients.length === 0 && (
            <p className="text-center text-xs text-slate-400">Add clients with email addresses on the Clients page first.</p>
          )}
        </div>
      </div>
    </div>
  )
}
