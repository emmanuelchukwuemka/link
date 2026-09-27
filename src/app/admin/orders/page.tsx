'use client'

import { useState, useEffect, useMemo } from 'react'
import {
  ClipboardList, Search, X, Eye, Download, Clock, Package, Truck, CheckCircle2, ChevronLeft, ChevronRight,
} from 'lucide-react'

type Payment = { id: string; provider: string; reference: string; amount: number; status: string; createdAt: string }
type OrderItem = {
  id: string; quantity: number; color: string | null; customization: boolean
  customizationNotes: string | null; customizationFileUrl: string | null
  product: { name: string }
}
type Order = {
  id: string; orderNumber: string
  customerName: string; customerEmail: string; customerPhone: string
  state: string; city: string; address: string; deliveryInstructions: string | null
  status: string; paymentStatus: string; total: number; subtotal: number; deliveryFee: number
  profileSetupRequired: boolean
  courierName: string | null; trackingNumber: string | null
  createdAt: string; shippedAt: string | null; deliveredAt: string | null
  items: OrderItem[]
  payments: Payment[]
}

const STATUSES = [
  'order_placed', 'payment_confirmed', 'profile_setup_required', 'profile_completed',
  'preparing', 'in_production', 'quality_check', 'shipped', 'out_for_delivery', 'delivered', 'activated',
]

const STATUS_GROUP: Record<string, 'pending' | 'processing' | 'shipped' | 'delivered'> = {
  order_placed: 'pending', payment_confirmed: 'pending', profile_setup_required: 'pending', profile_completed: 'pending',
  preparing: 'processing', in_production: 'processing', quality_check: 'processing',
  shipped: 'shipped', out_for_delivery: 'shipped',
  delivered: 'delivered', activated: 'delivered',
}

const GROUP_META = {
  pending: { label: 'Pending', icon: Clock, color: 'text-amber-600' },
  processing: { label: 'Processing', icon: Package, color: 'text-blue-600' },
  shipped: { label: 'Shipped', icon: Truck, color: 'text-indigo-600' },
  delivered: { label: 'Delivered', icon: CheckCircle2, color: 'text-green-600' },
} as const

const STATUS_COLORS: Record<string, string> = {
  order_placed: 'bg-gray-100 text-gray-700',
  payment_confirmed: 'bg-blue-100 text-blue-700',
  profile_setup_required: 'bg-amber-100 text-amber-700',
  profile_completed: 'bg-blue-100 text-blue-700',
  preparing: 'bg-blue-100 text-blue-700',
  in_production: 'bg-purple-100 text-purple-700',
  quality_check: 'bg-purple-100 text-purple-700',
  shipped: 'bg-indigo-100 text-indigo-700',
  out_for_delivery: 'bg-indigo-100 text-indigo-700',
  delivered: 'bg-green-100 text-green-700',
  activated: 'bg-green-100 text-green-700',
}

const PAGE_SIZE = 10

function toCsv(orders: Order[]): string {
  const header = ['Order Number', 'Customer', 'Email', 'Phone', 'Total', 'Payment Status', 'Order Status', 'Courier', 'Tracking Number', 'Created At']
  const rows = orders.map((o) => [
    o.orderNumber, o.customerName, o.customerEmail, o.customerPhone, o.total.toString(),
    o.paymentStatus, o.status, o.courierName || '', o.trackingNumber || '', new Date(o.createdAt).toISOString(),
  ])
  return [header, ...rows].map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n')
}

function downloadCsv(csv: string, filename: string) {
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

function OrderDetailModal({ order, onClose, onSaved }: { order: Order; onClose: () => void; onSaved: (o: Order) => void }) {
  const [status, setStatus] = useState(order.status)
  const [courierName, setCourierName] = useState(order.courierName || '')
  const [trackingNumber, setTrackingNumber] = useState(order.trackingNumber || '')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    setError('')
    const res = await fetch(`/api/admin/orders/${order.orderNumber}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, courierName, trackingNumber }),
    })
    const data = await res.json()
    setSaving(false)
    if (!res.ok) { setError(data.error || 'Could not update order'); return }
    onSaved({ ...order, status: data.order.status, courierName: data.order.courierName, trackingNumber: data.order.trackingNumber })
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 pt-6 pb-4 sticky top-0 bg-white z-10">
          <div>
            <h2 className="text-lg font-bold text-black">#{order.orderNumber}</h2>
            <p className="text-xs text-gray-600">{new Date(order.createdAt).toLocaleString()}</p>
          </div>
          <button onClick={onClose} className="p-1.5 text-gray-500 hover:text-black rounded-lg hover:bg-gray-100">
            <X size={18} />
          </button>
        </div>

        <div className="px-6 pb-6 space-y-5">
          {error && <div className="bg-red-50 text-red-500 p-3 rounded-lg text-sm">{error}</div>}

          <div className="bg-gray-50 rounded-2xl p-4">
            <p className="font-semibold text-black">{order.customerName}</p>
            <p className="text-sm text-gray-600">{order.customerEmail} &middot; {order.customerPhone}</p>
            <p className="text-sm text-gray-600 mt-1">{order.address}, {order.city}, {order.state}</p>
            {order.deliveryInstructions && <p className="text-xs text-gray-600 mt-1">Note: {order.deliveryInstructions}</p>}
          </div>

          <div>
            <p className="text-xs font-semibold text-black mb-2">Items</p>
            <div className="space-y-2">
              {order.items.map((item) => (
                <div key={item.id} className="bg-gray-50 rounded-xl p-3">
                  <p className="text-sm text-black">
                    {item.product.name} {item.color ? `(${item.color})` : ''} &times;{item.quantity}
                    {item.customization && (
                      <span className="ml-2 text-xs font-semibold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">Customization</span>
                    )}
                  </p>
                  {item.customization && (item.customizationNotes || item.customizationFileUrl) && (
                    <div className="mt-2 space-y-1">
                      {item.customizationNotes && <p className="text-xs text-gray-600">&ldquo;{item.customizationNotes}&rdquo;</p>}
                      {item.customizationFileUrl && (
                        <a href={item.customizationFileUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-black underline font-medium">
                          View uploaded design
                        </a>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 text-sm">
            <div><p className="text-xs text-gray-600">Subtotal</p><p className="font-semibold text-black">₦{order.subtotal.toLocaleString()}</p></div>
            <div><p className="text-xs text-gray-600">Delivery Fee</p><p className="font-semibold text-black">₦{order.deliveryFee.toLocaleString()}</p></div>
            <div><p className="text-xs text-gray-600">Total</p><p className="font-semibold text-black">₦{order.total.toLocaleString()}</p></div>
          </div>

          {order.payments.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-black mb-2">Payments</p>
              <div className="space-y-1.5">
                {order.payments.map((p) => (
                  <div key={p.id} className="flex items-center justify-between text-xs bg-gray-50 rounded-lg px-3 py-2">
                    <span className="text-gray-600 font-mono">{p.reference}</span>
                    <span className="text-black">{p.provider}</span>
                    <span className={`font-semibold ${p.status === 'success' ? 'text-green-600' : p.status === 'failed' ? 'text-red-600' : 'text-amber-600'}`}>{p.status}</span>
                    <span className="font-semibold text-black">₦{p.amount.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {order.profileSetupRequired && (
            <div className="bg-amber-50 text-amber-800 text-xs p-3 rounded-lg">
              This order can&apos;t move into production until the customer completes their profile setup.
            </div>
          )}

          <div className="grid sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-black mb-1.5">Status</label>
              <select value={status} onChange={(e) => setStatus(e.target.value)} className="w-full text-sm px-3 py-2.5 rounded-lg bg-gray-100 outline-none capitalize text-black">
                {STATUSES.map((s) => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-black mb-1.5">Courier</label>
              <input value={courierName} onChange={(e) => setCourierName(e.target.value)} className="w-full text-sm px-3 py-2.5 rounded-lg bg-gray-100 outline-none text-black" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-black mb-1.5">Tracking Number</label>
              <input value={trackingNumber} onChange={(e) => setTrackingNumber(e.target.value)} className="w-full text-sm px-3 py-2.5 rounded-lg bg-gray-100 outline-none text-black" />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <div className="flex-1" />
            <button onClick={onClose} className="px-5 py-2.5 rounded-full font-semibold text-sm bg-gray-100 text-black hover:bg-gray-200">Cancel</button>
            <button onClick={handleSave} disabled={saving} className="px-5 py-2.5 rounded-full font-semibold text-sm bg-green-600 text-white hover:bg-green-700 disabled:opacity-60">
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [group, setGroup] = useState<keyof typeof GROUP_META | null>(null)
  const [page, setPage] = useState(1)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [activeOrder, setActiveOrder] = useState<Order | null>(null)

  useEffect(() => {
    fetch('/api/admin/orders').then((res) => res.json()).then((data) => {
      if (data.orders) setOrders(data.orders)
      setLoading(false)
    })
  }, [])

  const counts = useMemo(() => {
    const c = { pending: 0, processing: 0, shipped: 0, delivered: 0 }
    for (const o of orders) c[STATUS_GROUP[o.status]]++
    return c
  }, [orders])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return orders.filter((o) => {
      if (group && STATUS_GROUP[o.status] !== group) return false
      if (!q) return true
      return (
        o.orderNumber.toLowerCase().includes(q) ||
        o.customerName.toLowerCase().includes(q) ||
        o.customerEmail.toLowerCase().includes(q)
      )
    })
  }, [orders, query, group])

  const totalPages = Math.max(Math.ceil(filtered.length / PAGE_SIZE), 1)
  const currentPage = Math.min(page, totalPages)
  const pageItems = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)

  if (loading) return <div className="text-center py-20 text-black">Loading...</div>

  const toggleSelectAll = () => {
    if (pageItems.every((o) => selected.has(o.id))) {
      setSelected((s) => { const next = new Set(s); pageItems.forEach((o) => next.delete(o.id)); return next })
    } else {
      setSelected((s) => { const next = new Set(s); pageItems.forEach((o) => next.add(o.id)); return next })
    }
  }
  const toggleSelect = (id: string) => {
    setSelected((s) => { const next = new Set(s); if (next.has(id)) next.delete(id); else next.add(id); return next })
  }

  const handleExport = () => {
    const toExport = selected.size > 0 ? filtered.filter((o) => selected.has(o.id)) : filtered
    downloadCsv(toCsv(toExport), `orders-${new Date().toISOString().slice(0, 10)}.csv`)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap justify-between items-start gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-black flex items-center gap-2"><ClipboardList size={26} /> Orders</h1>
          <p className="text-gray-600 text-sm mt-1">Track fulfillment, payments and delivery for every TapConnect order.</p>
        </div>
        <button onClick={handleExport} className="bg-white border border-gray-200 text-black px-4 py-2.5 rounded-full font-semibold text-sm flex items-center gap-2 hover:bg-gray-50 whitespace-nowrap">
          <Download size={16} /> Export {selected.size > 0 ? `(${selected.size})` : 'All'}
        </button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {(Object.keys(GROUP_META) as (keyof typeof GROUP_META)[]).map((key) => {
          const meta = GROUP_META[key]
          const Icon = meta.icon
          const active = group === key
          return (
            <button
              key={key}
              onClick={() => { setGroup(active ? null : key); setPage(1) }}
              className={`flex flex-col items-center text-center gap-1.5 p-4 rounded-2xl shadow-sm transition-colors ${active ? 'bg-black text-white' : 'bg-white text-black hover:bg-gray-50'}`}
            >
              <Icon size={20} className={active ? 'text-white' : meta.color} />
              <span className="text-xl font-bold">{counts[key]}</span>
              <span className={`text-xs ${active ? 'text-white/70' : 'text-gray-600'}`}>{meta.label}</span>
            </button>
          )
        })}
      </div>

      {/* Search */}
      <div className="flex items-center gap-2 bg-white rounded-full px-4 py-3 shadow-sm max-w-md">
        <Search size={16} className="text-gray-400 shrink-0" />
        <input
          value={query}
          onChange={(e) => { setQuery(e.target.value); setPage(1) }}
          placeholder="Search by order #, customer or email..."
          className="w-full outline-none text-sm text-black placeholder:text-gray-400"
        />
      </div>

      {selected.size > 0 && (
        <div className="bg-black rounded-2xl px-5 py-3 flex items-center justify-between gap-3">
          <span className="text-white text-sm font-semibold">{selected.size} selected</span>
          <button onClick={() => setSelected(new Set())} className="text-white/70 hover:text-white text-sm font-semibold px-3 py-1.5">Clear</button>
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="bg-white rounded-3xl p-8 text-center text-black shadow-sm">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <ClipboardList size={32} className="text-gray-400" />
          </div>
          No orders match this view.
        </div>
      ) : (
        <div className="bg-white rounded-3xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-black border-b border-gray-100">
                  <th className="p-4 w-10">
                    <input type="checkbox" checked={pageItems.length > 0 && pageItems.every((o) => selected.has(o.id))} onChange={toggleSelectAll} className="w-4 h-4 rounded accent-black" />
                  </th>
                  <th className="p-4 font-semibold">Order</th>
                  <th className="p-4 font-semibold">Items</th>
                  <th className="p-4 font-semibold">Amount</th>
                  <th className="p-4 font-semibold">Payment</th>
                  <th className="p-4 font-semibold">Status</th>
                  <th className="p-4 font-semibold">Date</th>
                  <th className="p-4 font-semibold"></th>
                </tr>
              </thead>
              <tbody>
                {pageItems.map((o) => (
                  <tr key={o.id} className="border-b border-gray-50 last:border-0">
                    <td className="p-4">
                      <input type="checkbox" checked={selected.has(o.id)} onChange={() => toggleSelect(o.id)} className="w-4 h-4 rounded accent-black" />
                    </td>
                    <td className="p-4">
                      <p className="font-semibold text-black whitespace-nowrap">#{o.orderNumber}</p>
                      <p className="text-xs text-gray-600 truncate max-w-[160px]">{o.customerName}</p>
                    </td>
                    <td className="p-4 text-xs text-gray-600 max-w-[180px] truncate">
                      {o.items.map((i) => `${i.quantity}× ${i.product.name}`).join(', ')}
                    </td>
                    <td className="p-4 font-semibold text-black whitespace-nowrap">₦{o.total.toLocaleString()}</td>
                    <td className="p-4">
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full whitespace-nowrap ${o.paymentStatus === 'paid' ? 'bg-green-100 text-green-700' : o.paymentStatus === 'failed' ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-700'}`}>
                        {o.paymentStatus}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full capitalize whitespace-nowrap ${STATUS_COLORS[o.status]}`}>{o.status.replace(/_/g, ' ')}</span>
                    </td>
                    <td className="p-4 text-xs text-gray-600 whitespace-nowrap">{new Date(o.createdAt).toLocaleDateString()}</td>
                    <td className="p-4">
                      <button onClick={() => setActiveOrder(o)} className="text-xs font-semibold px-3 py-1.5 rounded-full border border-gray-200 text-black hover:bg-gray-50 flex items-center gap-1.5 whitespace-nowrap">
                        <Eye size={12} /> View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 p-4 border-t border-gray-100">
            <p className="text-xs text-gray-600">
              Showing {(currentPage - 1) * PAGE_SIZE + 1} to {Math.min(currentPage * PAGE_SIZE, filtered.length)} of {filtered.length} orders
            </p>
            <div className="flex items-center gap-1.5">
              <button onClick={() => setPage(Math.max(currentPage - 1, 1))} disabled={currentPage === 1} className="p-1.5 rounded-lg border border-gray-200 text-black disabled:opacity-40 hover:bg-gray-50">
                <ChevronLeft size={14} />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
                <button key={n} onClick={() => setPage(n)} className={`w-7 h-7 rounded-lg text-xs font-semibold ${n === currentPage ? 'bg-green-600 text-white' : 'text-black hover:bg-gray-50 border border-gray-200'}`}>
                  {n}
                </button>
              ))}
              <button onClick={() => setPage(Math.min(currentPage + 1, totalPages))} disabled={currentPage === totalPages} className="p-1.5 rounded-lg border border-gray-200 text-black disabled:opacity-40 hover:bg-gray-50">
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </div>
      )}

      {activeOrder && (
        <OrderDetailModal
          order={activeOrder}
          onClose={() => setActiveOrder(null)}
          onSaved={(updated) => setOrders(orders.map((o) => (o.id === updated.id ? updated : o)))}
        />
      )}
    </div>
  )
}
