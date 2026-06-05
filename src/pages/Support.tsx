import {
  Megaphone,
  MonitorSmartphone,
  Plus,
  Printer,
  Sparkles,
  Globe,
} from 'lucide-react'
import { Card, CardHeader } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { useAppState } from '../state/AppState'
import { useSupportModal } from '../state/SupportModal'
import { priorityMeta, ticketStatusMeta } from '../lib/status'
import { formatDate } from '../lib/format'
import { currentAdvisor } from '../data/mockData'
import type { SupportType } from '../types'

const quickActions: { type: SupportType; label: string; icon: React.ReactNode; blurb: string }[] = [
  {
    type: 'Digital',
    label: 'Digital',
    icon: <MonitorSmartphone size={20} />,
    blurb: 'Landing pages, ads, email campaigns, social',
  },
  {
    type: 'Print',
    label: 'Print',
    icon: <Printer size={20} />,
    blurb: 'Cards, brochures, flyers, banners & reprints',
  },
  {
    type: 'Marketing Strategy',
    label: 'Marketing',
    icon: <Megaphone size={20} />,
    blurb: 'Campaign ideas, planning & growth strategy',
  },
  {
    type: 'Website',
    label: 'Website',
    icon: <Globe size={20} />,
    blurb: 'Edits, new pages, fixes & content updates',
  },
]

export function Support() {
  const { tickets } = useAppState()
  const openSupport = useSupportModal()

  return (
    <div className="space-y-6">
      {/* Hero / quick request */}
      <Card className="overflow-hidden">
        <div className="flex flex-col gap-4 bg-gradient-to-br from-brand-600 to-brand-800 p-6 text-white sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/15">
              <Sparkles size={22} />
            </div>
            <div>
              <h3 className="text-lg font-semibold">Need help with anything?</h3>
              <p className="mt-0.5 max-w-md text-sm text-brand-100">
                {currentAdvisor.accountManager} and the OneStop team handle your digital,
                print, and marketing needs. Send a request and we'll take it from here.
              </p>
            </div>
          </div>
          <Button
            variant="secondary"
            onClick={() => openSupport()}
            className="shrink-0"
          >
            <Plus size={16} /> New request
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-px bg-slate-100 sm:grid-cols-2 lg:grid-cols-4">
          {quickActions.map((a) => (
            <button
              key={a.type}
              onClick={() => openSupport(a.type)}
              className="group flex flex-col items-start gap-2 bg-white p-5 text-left transition-colors hover:bg-brand-50"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600 group-hover:bg-white">
                {a.icon}
              </div>
              <p className="text-sm font-semibold text-slate-900">{a.label}</p>
              <p className="text-xs text-slate-500">{a.blurb}</p>
            </button>
          ))}
        </div>
      </Card>

      {/* Tickets */}
      <Card>
        <CardHeader
          title="Your support requests"
          subtitle="Everything you've asked us to handle"
          action={
            <Button size="sm" variant="secondary" onClick={() => openSupport()}>
              <Plus size={14} /> New
            </Button>
          }
        />
        <div className="divide-y divide-slate-100">
          {tickets.map((ticket) => (
            <div key={ticket.id} className="flex flex-col gap-2 px-5 py-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-semibold text-slate-900">{ticket.subject}</p>
                  <Badge tone="gray">{ticket.type}</Badge>
                </div>
                <p className="mt-1 text-sm text-slate-600">{ticket.description}</p>
                <p className="mt-1 text-xs text-slate-400">
                  {ticket.id} · Opened {formatDate(ticket.createdOn)}
                  {ticket.assignedTo ? ` · Assigned to ${ticket.assignedTo}` : ''}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <Badge tone={priorityMeta[ticket.priority].tone}>
                  {priorityMeta[ticket.priority].label}
                </Badge>
                <Badge tone={ticketStatusMeta[ticket.status].tone}>
                  {ticketStatusMeta[ticket.status].label}
                </Badge>
              </div>
            </div>
          ))}
          {tickets.length === 0 && (
            <p className="px-5 py-10 text-center text-sm text-slate-400">
              No support requests yet.
            </p>
          )}
        </div>
      </Card>
    </div>
  )
}
