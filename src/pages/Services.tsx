import { useMemo } from 'react'
import { Check, Plus, Sparkles } from 'lucide-react'
import { Card, CardHeader } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { useToast } from '../components/ui/Toast'
import { useNotify } from '../state/Notifications'
import { useAdvisors } from '../state/Advisors'
import { useAuth } from '../state/Auth'
import { addonCatalog } from '../data/addons'
import { addonStatusMeta } from '../lib/status'
import { formatDate } from '../lib/format'

export function Services() {
  const { advisors, addAddonRequestTo } = useAdvisors()
  const { user } = useAuth()
  const notify = useToast()
  const pushNotify = useNotify()

  const myRecord =
    advisors.find((a) => user?.email && a.email.toLowerCase() === user.email.toLowerCase()) ??
    advisors.find((a) => a.id === 'adv-frazier')

  const requests = myRecord?.addons ?? []
  const statusByService = useMemo(() => {
    const map = new Map<string, (typeof requests)[number]>()
    for (const r of requests) if (r.status !== 'declined') map.set(r.serviceId, r)
    return map
  }, [requests])

  const request = (serviceId: string, serviceName: string) => {
    if (!myRecord) return
    addAddonRequestTo(myRecord.id, { serviceId, serviceName })
    notify(`Requested ${serviceName} — your team will follow up with an invoice or coverage.`)
    pushNotify({
      audience: 'admin',
      type: 'addon_request',
      title: 'New add-on request',
      body: `${myRecord.firm} requested ${serviceName}.`,
      link: `/admin/advisors/${myRecord.id}`,
      email: true,
    })
  }

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden">
        <div className="flex flex-col gap-3 bg-gradient-to-br from-brand-600 to-brand-800 p-6 text-white sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/15">
              <Sparkles size={22} />
            </div>
            <div>
              <h3 className="text-lg font-semibold">Grow your practice</h3>
              <p className="mt-0.5 max-w-lg text-sm text-brand-100">
                Request any additional service below. Your OneStop team will follow up with an
                invoice, or confirm it's covered by your plan.
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* Catalog */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {addonCatalog.map((s) => {
          const existing = statusByService.get(s.id)
          const meta = existing ? addonStatusMeta[existing.status] : null
          return (
            <Card key={s.id} className="flex flex-col p-5">
              <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                <s.icon size={22} />
              </div>
              <h4 className="text-sm font-semibold text-slate-900">{s.name}</h4>
              <p className="mt-1 flex-1 text-sm text-slate-500">{s.description}</p>
              <div className="mt-4">
                {existing && meta ? (
                  <Badge tone={meta.tone}>
                    <Check size={12} /> {meta.label}
                  </Badge>
                ) : (
                  <Button size="sm" onClick={() => request(s.id, s.name)}>
                    <Plus size={15} /> Request
                  </Button>
                )}
              </div>
            </Card>
          )
        })}
      </div>

      {/* Your requests */}
      <Card>
        <CardHeader
          title="Your requests"
          subtitle="Track the status of each add-on you've requested"
          icon={<Sparkles size={18} />}
        />
        <div className="divide-y divide-slate-100">
          {requests.map((r) => {
            const meta = addonStatusMeta[r.status]
            return (
              <div key={r.id} className="flex flex-col gap-1 px-5 py-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-800">{r.serviceName}</p>
                  <p className="text-xs text-slate-500">
                    Requested {formatDate(r.requestedOn)}
                    {r.decisionNote ? ` · ${r.decisionNote}` : ''}
                  </p>
                </div>
                <Badge tone={meta.tone}>{meta.label}</Badge>
              </div>
            )
          })}
          {requests.length === 0 && (
            <p className="px-5 py-8 text-center text-sm text-slate-400">
              No requests yet — pick a service above to get started.
            </p>
          )}
        </div>
      </Card>
    </div>
  )
}
