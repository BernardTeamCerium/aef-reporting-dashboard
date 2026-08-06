import { useMemo, useState } from 'react'
import { Copy, Link2, Loader2, Mail, MessageSquare, Send, Zap } from 'lucide-react'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'
import { useToast } from '../ui/Toast'
import { useClients, type Client, type ReviewChannel } from '../../state/Clients'
import { useAuth } from '../../state/Auth'
import { buildMessage, mailtoHref, publicReviewUrl, smsHref } from '../../lib/reviewsUtil'
import { cx } from '../../lib/format'

interface RequestReviewModalProps {
  open: boolean
  onClose: () => void
  client: Client | null
}

export function RequestReviewModal({ open, onClose, client }: RequestReviewModalProps) {
  const { settings, markRequested } = useClients()
  const { demoMode, getAccessToken } = useAuth()
  const notify = useToast()
  const [channel, setChannel] = useState<ReviewChannel>('sms')
  const [sending, setSending] = useState(false)

  const link = publicReviewUrl(settings)
  const message = useMemo(
    () =>
      buildMessage(settings.messageTemplate, {
        name: client?.name?.split(' ')[0] ?? 'there',
        firm: settings.firmName,
        link,
      }),
    [settings, client, link],
  )
  const [draft, setDraft] = useState(message)

  // Keep the draft in sync when the client/channel changes.
  const shownMessage = draft || message

  const subject = `Quick favor — a review for ${settings.firmName}`

  const send = () => {
    if (!client) return
    const href =
      channel === 'sms'
        ? smsHref(client.phone, shownMessage)
        : mailtoHref(client.email, subject, shownMessage)
    window.open(href, '_blank')
    markRequested(client.id, channel)
    notify(`Opened ${channel === 'sms' ? 'Messages' : 'email'} for ${client.name}.`)
    onClose()
  }

  // Server-side send via the configured Zapier webhook (no device needed).
  const sendNow = async () => {
    if (!client) return
    const to = channel === 'sms' ? client.phone : client.email
    if (!to) {
      notify(`No ${channel === 'sms' ? 'phone' : 'email'} on file for ${client.name}.`)
      return
    }
    setSending(true)
    try {
      const token = await getAccessToken()
      const res = await fetch('/api/me/send', {
        method: 'POST',
        headers: { 'content-type': 'application/json', ...(token ? { authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ to, channel, subject, body: shownMessage, name: client.name, purpose: 'review_request' }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error ?? 'Send failed.')
      if (data.sent) {
        markRequested(client.id, channel)
        notify(`Review request sent to ${client.name}.`)
        onClose()
      } else {
        notify(data.reason ?? 'No send channel configured yet.')
      }
    } catch (e) {
      notify(e instanceof Error ? e.message : 'Send failed.')
    } finally {
      setSending(false)
    }
  }

  const copy = async (value: string, label: string) => {
    try {
      await navigator.clipboard.writeText(value)
      notify(`${label} copied.`)
    } catch {
      notify('Copy failed — select and copy manually.')
    }
  }

  const canSms = client && client.phone
  const canEmail = client && client.email

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={client ? `Request a review from ${client.name}` : 'Request a review'}
      subtitle="Send a prefilled text or email — it opens your Messages or Mail app."
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
          <Button variant="secondary" onClick={send} disabled={!client || (channel === 'sms' ? !canSms : !canEmail)}>
            <Send size={15} /> Open {channel === 'sms' ? 'Messages' : 'Email'}
          </Button>
          {!demoMode && (
            <Button onClick={sendNow} disabled={sending || !client || (channel === 'sms' ? !canSms : !canEmail)}>
              {sending ? <Loader2 size={15} className="animate-spin" /> : <Zap size={15} />} Send now
            </Button>
          )}
        </>
      }
    >
      <div className="space-y-4">
        {/* Channel */}
        <div className="grid grid-cols-2 gap-2">
          <ChannelButton
            active={channel === 'sms'}
            disabled={!canSms}
            onClick={() => setChannel('sms')}
            icon={<MessageSquare size={16} />}
            label="Text message"
            sub={client?.phone || 'No phone on file'}
          />
          <ChannelButton
            active={channel === 'email'}
            disabled={!canEmail}
            onClick={() => setChannel('email')}
            icon={<Mail size={16} />}
            label="Email"
            sub={client?.email || 'No email on file'}
          />
        </div>

        {/* Message */}
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Message</label>
          <textarea
            value={shownMessage}
            onChange={(e) => setDraft(e.target.value)}
            rows={5}
            className="w-full resize-none rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
          />
          <div className="mt-2 flex flex-wrap gap-2">
            <Button size="sm" variant="secondary" onClick={() => copy(shownMessage, 'Message')}>
              <Copy size={13} /> Copy message
            </Button>
            <Button size="sm" variant="secondary" onClick={() => copy(link, 'Review link')}>
              <Link2 size={13} /> Copy link
            </Button>
          </div>
        </div>

        <div className="rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-500">
          Your review link: <span className="font-medium text-slate-700">{link}</span>
        </div>
      </div>
    </Modal>
  )
}

function ChannelButton({
  active,
  disabled,
  onClick,
  icon,
  label,
  sub,
}: {
  active: boolean
  disabled?: boolean
  onClick: () => void
  icon: React.ReactNode
  label: string
  sub: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cx(
        'flex items-center gap-2 rounded-lg border px-3 py-2.5 text-left transition-colors',
        active ? 'border-brand-500 bg-brand-50' : 'border-slate-200 hover:bg-slate-50',
        disabled && 'cursor-not-allowed opacity-50',
      )}
    >
      <span className={cx('flex h-8 w-8 items-center justify-center rounded-lg', active ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-500')}>
        {icon}
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-medium text-slate-800">{label}</span>
        <span className="block truncate text-xs text-slate-400">{sub}</span>
      </span>
    </button>
  )
}
