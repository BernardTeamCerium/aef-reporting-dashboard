import { useState } from 'react'
import { useAppState } from '../../state/AppState'
import { useToast } from '../ui/Toast'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'
import type { SupportPriority, SupportType } from '../../types'

interface SupportRequestModalProps {
  open: boolean
  onClose: () => void
  /** Pre-select a request type when opened from a specific context. */
  defaultType?: SupportType
}

const types: SupportType[] = ['Digital', 'Print', 'Marketing Strategy', 'Website', 'Other']
const priorities: SupportPriority[] = ['low', 'normal', 'high', 'urgent']

export function SupportRequestModal({
  open,
  onClose,
  defaultType = 'Digital',
}: SupportRequestModalProps) {
  const { addTicket } = useAppState()
  const notify = useToast()

  const [subject, setSubject] = useState('')
  const [type, setType] = useState<SupportType>(defaultType)
  const [priority, setPriority] = useState<SupportPriority>('normal')
  const [description, setDescription] = useState('')

  const reset = () => {
    setSubject('')
    setType(defaultType)
    setPriority('normal')
    setDescription('')
  }

  const canSubmit = subject.trim().length > 2 && description.trim().length > 4

  const submit = () => {
    if (!canSubmit) return
    const ticket = addTicket({ subject: subject.trim(), type, priority, description: description.trim() })
    notify(`Support request ${ticket.id} submitted — your team will reach out shortly.`)
    reset()
    onClose()
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Request Support"
      subtitle="Digital, print, website, or marketing strategy — your team is on it."
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={!canSubmit}>
            Submit request
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            What do you need help with?
          </label>
          <div className="flex flex-wrap gap-2">
            {types.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setType(t)}
                className={
                  'rounded-lg px-3 py-1.5 text-sm font-medium ring-1 ring-inset transition-colors ' +
                  (type === t
                    ? 'bg-brand-600 text-white ring-brand-600'
                    : 'bg-white text-slate-600 ring-slate-300 hover:bg-slate-50')
                }
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label htmlFor="subject" className="mb-1 block text-sm font-medium text-slate-700">
            Subject
          </label>
          <input
            id="subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="e.g. Need a landing page for July webinar"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Priority</label>
          <div className="flex flex-wrap gap-2">
            {priorities.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPriority(p)}
                className={
                  'rounded-lg px-3 py-1.5 text-sm font-medium capitalize ring-1 ring-inset transition-colors ' +
                  (priority === p
                    ? 'bg-slate-900 text-white ring-slate-900'
                    : 'bg-white text-slate-600 ring-slate-300 hover:bg-slate-50')
                }
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label htmlFor="desc" className="mb-1 block text-sm font-medium text-slate-700">
            Details
          </label>
          <textarea
            id="desc"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            placeholder="Share as much detail as you can — deadlines, links, assets, goals…"
            className="w-full resize-none rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
          />
        </div>
      </div>
    </Modal>
  )
}
