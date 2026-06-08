import { useState } from 'react'
import {
  CreditCard,
  FileText,
  Files,
  Flag,
  Folder,
  Mail,
  Package,
  Plus,
} from 'lucide-react'
import { Card, CardHeader } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Modal } from '../components/ui/Modal'
import { useAppState } from '../state/AppState'
import { useToast } from '../components/ui/Toast'
import { currentAdvisor, printCatalog } from '../data/mockData'
import { orderStatusMeta } from '../lib/status'
import { formatCurrency, formatDate } from '../lib/format'
import type { PrintProduct } from '../types'

const productIcon: Record<string, React.ReactNode> = {
  card: <CreditCard size={22} />,
  brochure: <FileText size={22} />,
  flyer: <Files size={22} />,
  postcard: <Mail size={22} />,
  banner: <Flag size={22} />,
  folder: <Folder size={22} />,
}

const orderSteps = ['submitted', 'in_review', 'in_production', 'shipped', 'delivered'] as const

export function PrintOrders() {
  const { orders, addOrder } = useAppState()
  const notify = useToast()
  const [selected, setSelected] = useState<PrintProduct | null>(null)
  const [quantity, setQuantity] = useState(250)
  const [shipTo, setShipTo] = useState(
    `${currentAdvisor.firm}, 220 Market St, Suite 400`,
  )
  const [notes, setNotes] = useState('')

  const openOrder = (product: PrintProduct) => {
    setSelected(product)
    setQuantity(250)
    setNotes('')
  }

  // Simple prototype pricing: base price scales with quantity over a 250 baseline.
  const estimatedCost = selected
    ? Math.round(selected.basePrice * Math.max(1, quantity / 250) * 100) / 100
    : 0

  const submit = () => {
    if (!selected) return
    const order = addOrder({
      productName: selected.name,
      category: selected.category,
      quantity,
      estimatedCost,
      shipTo,
      notes: notes.trim() || undefined,
    })
    notify(`Order ${order.id} submitted for ${quantity.toLocaleString()} × ${selected.name}.`)
    setSelected(null)
  }

  return (
    <div className="space-y-6">
      <p className="text-sm text-slate-500">
        Order professionally designed, brand-consistent print materials. Submit a request
        and your OneStop team handles production and shipping.
      </p>

      {/* Catalog */}
      <div>
        <h3 className="mb-3 text-sm font-semibold text-slate-900">Order print material</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {printCatalog.map((product) => (
            <Card key={product.id} className="flex flex-col p-5">
              <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                {productIcon[product.imageUrl ?? ''] ?? <Package size={22} />}
              </div>
              <div className="mb-1 flex items-center justify-between gap-2">
                <h4 className="text-sm font-semibold text-slate-900">{product.name}</h4>
              </div>
              <p className="flex-1 text-sm text-slate-500">{product.description}</p>
              <div className="mt-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    {formatCurrency(product.basePrice)}{' '}
                    <span className="text-xs font-normal text-slate-400">
                      {product.unitLabel}
                    </span>
                  </p>
                  <p className="text-xs text-slate-400">{product.turnaround}</p>
                </div>
                <Button size="sm" onClick={() => openOrder(product)}>
                  <Plus size={15} /> Request
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Existing orders */}
      <Card>
        <CardHeader
          title="Your orders"
          subtitle="Track every job from submission to delivery"
          icon={<Package size={18} />}
        />
        <div className="divide-y divide-slate-100">
          {orders.map((order) => {
            const stepIndex = orderSteps.indexOf(order.status)
            return (
              <div key={order.id} className="px-5 py-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      {order.productName}
                    </p>
                    <p className="text-xs text-slate-500">
                      {order.id} · {order.quantity.toLocaleString()} units · Ordered{' '}
                      {formatDate(order.submittedOn)}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-slate-700">
                      {formatCurrency(order.estimatedCost)}
                    </span>
                    <Badge tone={orderStatusMeta[order.status].tone}>
                      {orderStatusMeta[order.status].label}
                    </Badge>
                  </div>
                </div>

                {/* Progress tracker */}
                <div className="mt-3 flex items-center gap-1">
                  {orderSteps.map((step, i) => (
                    <div key={step} className="flex flex-1 items-center gap-1">
                      <div
                        className={
                          'h-1.5 flex-1 rounded-full ' +
                          (i <= stepIndex ? 'bg-brand-500' : 'bg-slate-200')
                        }
                      />
                    </div>
                  ))}
                </div>
                <div className="mt-1 flex justify-between text-[10px] uppercase tracking-wide text-slate-400">
                  <span>Submitted</span>
                  <span>In production</span>
                  <span>Delivered</span>
                </div>
                {order.notes && (
                  <p className="mt-2 text-xs text-slate-500">Note: {order.notes}</p>
                )}
              </div>
            )
          })}
        </div>
      </Card>

      {/* Order request modal */}
      <Modal
        open={selected !== null}
        onClose={() => setSelected(null)}
        title={selected ? `Order: ${selected.name}` : 'Order'}
        subtitle={selected?.description}
        footer={
          <>
            <Button variant="secondary" onClick={() => setSelected(null)}>
              Cancel
            </Button>
            <Button onClick={submit}>Submit order request</Button>
          </>
        }
      >
        {selected && (
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Quantity
              </label>
              <div className="flex flex-wrap gap-2">
                {[100, 250, 500, 1000, 2500].map((q) => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => setQuantity(q)}
                    className={
                      'rounded-lg px-3 py-1.5 text-sm font-medium ring-1 ring-inset transition-colors ' +
                      (quantity === q
                        ? 'bg-brand-600 text-white ring-brand-600'
                        : 'bg-white text-slate-600 ring-slate-300 hover:bg-slate-50')
                    }
                  >
                    {q.toLocaleString()}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label htmlFor="shipto" className="mb-1 block text-sm font-medium text-slate-700">
                Ship to
              </label>
              <input
                id="shipto"
                value={shipTo}
                onChange={(e) => setShipTo(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
              />
            </div>

            <div>
              <label htmlFor="notes" className="mb-1 block text-sm font-medium text-slate-700">
                Notes (optional)
              </label>
              <textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                placeholder="Any customization, event date, or special instructions…"
                className="w-full resize-none rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
              />
            </div>

            <div className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
              <div>
                <p className="text-xs text-slate-500">Estimated cost</p>
                <p className="text-lg font-bold text-slate-900">
                  {formatCurrency(estimatedCost)}
                </p>
              </div>
              <p className="text-xs text-slate-400">
                Final quote confirmed by your team · {selected.turnaround}
              </p>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
