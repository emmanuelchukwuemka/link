'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { CreditCard, Plus, Upload, Download, X } from 'lucide-react'

type CardRow = {
  id: string
  code: string
  status: string
  product: string
  color: string | null
  businessId: string | null
  batchLabel: string | null
  assignedAt: string | null
  user: { id: string; username: string; displayName: string | null; jobTitle: string | null } | null
  business: { id: string; name: string } | null
  order: { id: string; orderNumber: string } | null
  taps30d: number
  lastTap: string | null
  notActivated: boolean
}

type Stats = { all: number; unassigned: number; reserved: number; active: number; notActivated: number; deactivated: number }
type Business = { id: string; name: string }
type Employee = { id: string; displayName: string | null; username: string }

const PRODUCT_LABELS: Record<string, string> = { mini: 'Mini', standard: 'Standard', wristband: 'Wristband' }

const STATUS_BADGE: Record<string, string> = {
  unassigned: 'bg-gray-100 text-gray-600',
  reserved: 'bg-blue-50 text-blue-600',
  active: 'bg-green-50 text-green-700',
  deactivated: 'bg-red-50 text-red-600',
}

function relativeTime(iso: string | null): string {
  if (!iso) return 'Never'
  const diffMs = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diffMs / 60000)
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs} hrs ago`
  const days = Math.floor(hrs / 24)
  if (days === 1) return 'Yesterday'
  if (days < 7) return `${days}d ago`
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

function AssignModal({ card, businesses, onClose, onDone }: {
  card: CardRow
  businesses: Business[]
  onClose: () => void
  onDone: () => void
}) {
  const [mode, setMode] = useState<'business' | 'employee'>(card.businessId ? 'employee' : 'business')
  const [businessId, setBusinessId] = useState(card.businessId || '')
  const [employees, setEmployees] = useState<Employee[]>([])
  const [employeeId, setEmployeeId] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (mode === 'employee' && businessId) {
      fetch(`/api/admin/businesses/${businessId}/employees`).then((r) => r.json()).then((d) => setEmployees(d.employees || []))
    }
  }, [mode, businessId])

  const handleSave = async () => {
    setSaving(true)
    try {
      if (mode === 'employee' && employeeId) {
        await fetch(`/api/cards/${card.code}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'assign', userId: employeeId }),
        })
      } else if (mode === 'business' && businessId) {
        await fetch(`/api/cards/${card.code}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'reserve', businessId }),
        })
      }
      onDone()
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-sm p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-lg">Assign {card.code}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-black"><X size={18} /></button>
        </div>

        <div className="flex bg-gray-100 rounded-lg p-1 mb-4">
          <button onClick={() => setMode('business')} className={`flex-1 py-1.5 rounded-md text-xs font-semibold ${mode === 'business' ? 'bg-white shadow-sm' : 'text-gray-500'}`}>To business pool</button>
          <button onClick={() => setMode('employee')} className={`flex-1 py-1.5 rounded-md text-xs font-semibold ${mode === 'employee' ? 'bg-white shadow-sm' : 'text-gray-500'}`}>To a person</button>
        </div>

        {mode === 'business' ? (
          <select value={businessId} onChange={(e) => setBusinessId(e.target.value)} className="w-full px-3 py-2.5 rounded-lg bg-gray-100 outline-none text-sm mb-4">
            <option value="">Select a business&hellip;</option>
            {businesses.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
        ) : (
          <div className="space-y-3 mb-4">
            <select value={businessId} onChange={(e) => { setBusinessId(e.target.value); setEmployeeId('') }} className="w-full px-3 py-2.5 rounded-lg bg-gray-100 outline-none text-sm">
              <option value="">Select a business first&hellip;</option>
              {businesses.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
            {businessId && (
              <select value={employeeId} onChange={(e) => setEmployeeId(e.target.value)} className="w-full px-3 py-2.5 rounded-lg bg-gray-100 outline-none text-sm">
                <option value="">Select a team member&hellip;</option>
                {employees.map((e) => <option key={e.id} value={e.id}>{e.displayName || e.username}</option>)}
              </select>
            )}
          </div>
        )}

        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-gray-200 font-semibold text-sm hover:bg-gray-50">Cancel</button>
          <button
            onClick={handleSave}
            disabled={saving || (mode === 'business' ? !businessId : !employeeId)}
            className="flex-1 bg-black text-white py-2.5 rounded-xl font-semibold text-sm hover:bg-gray-800 disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function AdminCardsPage() {
  const [cards, setCards] = useState<CardRow[]>([])
  const [stats, setStats] = useState<Stats>({ all: 0, unassigned: 0, reserved: 0, active: 0, notActivated: 0, deactivated: 0 })
  const [businesses, setBusinesses] = useState<Business[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)

  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [product, setProduct] = useState('')
  const [color, setColor] = useState('')
  const [businessFilter, setBusinessFilter] = useState('')

  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [assignTarget, setAssignTarget] = useState<CardRow | null>(null)

  const load = useCallback(async () => {
    const params = new URLSearchParams()
    if (search) params.set('search', search)
    if (status) params.set('status', status)
    if (product) params.set('product', product)
    if (color) params.set('color', color)
    if (businessFilter) params.set('businessId', businessFilter)
    params.set('page', String(page))

    const res = await fetch(`/api/cards?${params.toString()}`)
    const data = await res.json()
    setCards(data.cards || [])
    setStats(data.stats || { all: 0, unassigned: 0, reserved: 0, active: 0, notActivated: 0, deactivated: 0 })
    setTotalPages(data.totalPages || 1)
    setTotal(data.total || 0)
    setLoading(false)
  }, [search, status, product, color, businessFilter, page])

  useEffect(() => { load() }, [load])
  useEffect(() => { fetch('/api/admin/businesses').then((r) => r.json()).then((d) => setBusinesses(d.businesses || [])) }, [])
  useEffect(() => { setPage(1) }, [search, status, product, color, businessFilter])

  const toggleSelect = (id: string) => setSelected((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n })
  const toggleSelectAll = () => {
    if (cards.every((c) => selected.has(c.id))) setSelected((s) => { const n = new Set(s); cards.forEach((c) => n.delete(c.id)); return n })
    else setSelected((s) => { const n = new Set(s); cards.forEach((c) => n.add(c.id)); return n })
  }

  const selectedCodes = cards.filter((c) => selected.has(c.id)).map((c) => c.code)

  const bulkAction = async (action: string, extra?: Record<string, unknown>) => {
    await fetch('/api/cards/bulk', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ codes: selectedCodes, action, ...extra }),
    })
    setSelected(new Set())
    load()
  }

  const bulkReserve = async () => {
    const id = prompt('Business ID to reserve these cards for:\n\n' + businesses.map((b) => `${b.name}: ${b.id}`).join('\n'))
    if (!id) return
    bulkAction('reserve', { businessId: id })
  }

  const downloadQrCsv = () => {
    const targets = selectedCodes.length ? selectedCodes : cards.map((c) => c.code)
    const rows = ['Card ID,Tap URL', ...targets.map((code) => `${code},https://tapconnect.ng/c/${code}`)]
    const blob = new Blob([rows.join('\n')], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `tapconnect-cards-${Date.now()}.csv`
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  }

  const exportAllCsv = async () => {
    const res = await fetch('/api/cards?page=1')
    const first = await res.json()
    const pages = first.totalPages || 1
    let all: CardRow[] = first.cards || []
    for (let p = 2; p <= pages; p++) {
      const r = await fetch(`/api/cards?page=${p}`)
      const d = await r.json()
      all = all.concat(d.cards || [])
    }
    const rows = [
      'Card ID,Product,Color,Status,Assigned To,Business Pool,Order,Taps 30d,Last Tap',
      ...all.map((c) => [
        c.code, PRODUCT_LABELS[c.product] || c.product, c.color || '', c.status,
        c.user ? `@${c.user.username}` : '', c.business?.name || '', c.order?.orderNumber || '',
        c.taps30d, c.lastTap || 'Never',
      ].map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',')),
    ]
    const blob = new Blob([rows.join('\n')], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `tapconnect-cards-export-${Date.now()}.csv`
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  }

  const rowAction = async (card: CardRow) => {
    if (card.status === 'deactivated') {
      await fetch(`/api/cards/${card.code}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'reactivate' }) })
      load()
      return
    }
    setAssignTarget(card)
  }

  if (loading && cards.length === 0) return <div className="text-center py-20 text-black">Loading...</div>

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap justify-between items-start gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-black flex items-center gap-2"><CreditCard size={26} /> TapConnect Cards</h1>
          <p className="text-gray-600 text-sm mt-1">Every physical card, what it&apos;s linked to, and whether it&apos;s live.</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={exportAllCsv} className="bg-white border border-gray-200 text-black px-4 py-2.5 rounded-full font-semibold text-sm hover:bg-gray-50 flex items-center gap-2">
            <Download size={15} /> Export CSV
          </button>
          <Link href="/admin/cards/generate" className="bg-white border border-gray-200 text-black px-4 py-2.5 rounded-full font-semibold text-sm hover:bg-gray-50 flex items-center gap-2">
            <Upload size={15} /> Import CSV
          </Link>
          <Link href="/admin/cards/generate" className="bg-black text-white px-4 py-2.5 rounded-full font-semibold text-sm hover:bg-gray-800 flex items-center gap-2">
            <Plus size={16} /> Generate cards
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {([
          ['', 'All cards', stats.all, null, 'text-black'],
          ['unassigned', 'Unassigned', stats.unassigned, 'Ready to assign', 'text-gray-500'],
          ['reserved', 'Reserved for business', stats.reserved, `In ${businesses.length} business pools`, 'text-blue-600'],
          ['active', 'Active', stats.active, `${stats.notActivated} awaiting activation`, 'text-green-600'],
          ['deactivated', 'Deactivated', stats.deactivated, 'Lost, replaced or reclaimed', 'text-red-600'],
        ] as const).map(([key, label, value, sub, dotColor]) => (
          <button
            key={label}
            onClick={() => setStatus(key)}
            className={`text-left p-4 rounded-2xl shadow-sm bg-white border-2 transition-colors ${status === key ? 'border-black' : 'border-transparent hover:border-gray-200'}`}
          >
            <p className={`text-xs font-semibold flex items-center gap-1.5 mb-2 ${dotColor}`}>
              {key && <span className="w-1.5 h-1.5 rounded-full bg-current" />} {label}
            </p>
            <p className="text-2xl font-bold text-black">{value.toLocaleString()}</p>
            {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-2xl shadow-sm p-4 flex flex-wrap gap-2">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search card ID, name or username"
          className="flex-1 min-w-[200px] px-3 py-2 rounded-lg bg-gray-100 outline-none text-sm"
        />
        <select value={product} onChange={(e) => setProduct(e.target.value)} className="px-3 py-2 rounded-lg bg-gray-100 outline-none text-sm">
          <option value="">Product: All</option>
          {Object.entries(PRODUCT_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <select value={color} onChange={(e) => setColor(e.target.value)} className="px-3 py-2 rounded-lg bg-gray-100 outline-none text-sm">
          <option value="">Color: All</option>
          <option value="Black">Black</option>
          <option value="White">White</option>
        </select>
        <select value={businessFilter} onChange={(e) => setBusinessFilter(e.target.value)} className="px-3 py-2 rounded-lg bg-gray-100 outline-none text-sm">
          <option value="">Business pool: All</option>
          {businesses.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
        </select>
      </div>

      {selected.size > 0 && (
        <div className="bg-black rounded-2xl px-5 py-3 flex flex-wrap items-center justify-between gap-3">
          <span className="text-white text-sm font-semibold">{selected.size} selected</span>
          <div className="flex items-center gap-2">
            <button onClick={bulkReserve} className="bg-white/10 hover:bg-white/20 text-white text-xs font-semibold px-3 py-1.5 rounded-full">Assign to business pool</button>
            <button onClick={downloadQrCsv} className="bg-white/10 hover:bg-white/20 text-white text-xs font-semibold px-3 py-1.5 rounded-full">Download QR codes</button>
            <button onClick={() => bulkAction('deactivate')} className="bg-red-500/20 hover:bg-red-500/30 text-red-200 text-xs font-semibold px-3 py-1.5 rounded-full">Deactivate</button>
            <button onClick={() => setSelected(new Set())} className="text-white/60 hover:text-white text-xs font-semibold px-2">Clear</button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-500 border-b border-gray-100">
              <th className="p-4 w-10"><input type="checkbox" checked={cards.length > 0 && cards.every((c) => selected.has(c.id))} onChange={toggleSelectAll} className="w-4 h-4 rounded accent-black" /></th>
              <th className="p-4 font-semibold">Card ID &amp; tap URL</th>
              <th className="p-4 font-semibold">Product</th>
              <th className="p-4 font-semibold">Status</th>
              <th className="p-4 font-semibold">Assigned to</th>
              <th className="p-4 font-semibold">Business pool</th>
              <th className="p-4 font-semibold">Order</th>
              <th className="p-4 font-semibold">Taps &middot; 30d</th>
              <th className="p-4 font-semibold">Last tap</th>
              <th className="p-4 font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {cards.map((c) => (
              <tr key={c.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50">
                <td className="p-4"><input type="checkbox" checked={selected.has(c.id)} onChange={() => toggleSelect(c.id)} className="w-4 h-4 rounded accent-black" /></td>
                <td className="p-4">
                  <p className="font-mono font-bold">{c.code}</p>
                  <p className="text-xs text-gray-400 font-mono">tapconnect.ng/c/{c.code}</p>
                </td>
                <td className="p-4 text-gray-700">{PRODUCT_LABELS[c.product] || c.product}{c.color ? ` · ${c.color}` : ''}</td>
                <td className="p-4">
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full whitespace-nowrap ${STATUS_BADGE[c.status] || 'bg-gray-100 text-gray-600'}`}>
                    {c.notActivated ? 'Not activated' : c.status === 'unassigned' ? 'Unassigned' : c.status === 'reserved' ? 'Reserved' : c.status === 'active' ? 'Active' : 'Deactivated'}
                  </span>
                </td>
                <td className="p-4">
                  {c.user ? (
                    <div>
                      <p className="font-semibold text-black">{c.user.displayName || `@${c.user.username}`}</p>
                      <p className="text-xs text-gray-400">@{c.user.username}{c.user.jobTitle ? ` · ${c.user.jobTitle}` : ''}</p>
                    </div>
                  ) : <span className="text-gray-400">Waiting for employee</span>}
                </td>
                <td className="p-4 text-gray-700">{c.business?.name || <span className="text-gray-300">&mdash;</span>}</td>
                <td className="p-4 text-gray-700">{c.order ? `#${c.order.orderNumber}` : <span className="text-gray-300">&mdash;</span>}</td>
                <td className="p-4 text-gray-700">{c.taps30d}</td>
                <td className="p-4 text-gray-500">{relativeTime(c.lastTap)}</td>
                <td className="p-4">
                  <button
                    onClick={() => rowAction(c)}
                    className={`text-xs font-semibold px-3 py-1.5 rounded-full whitespace-nowrap ${c.status === 'deactivated' ? 'bg-green-50 text-green-700 hover:bg-green-100' : 'bg-black text-white hover:bg-gray-800'}`}
                  >
                    {c.status === 'deactivated' ? 'Reactivate' : c.notActivated ? 'Activate' : c.user ? 'Reassign' : 'Assign'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {cards.length === 0 && (
          <div className="text-center text-gray-500 py-16">
            <CreditCard size={32} className="mx-auto mb-3 text-gray-300" />
            No cards match these filters.
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <p className="text-gray-500">Showing {(page - 1) * 10 + 1}&ndash;{Math.min(page * 10, total)} of {total}</p>
          <div className="flex items-center gap-1.5">
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1.5 rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50">&larr;</button>
            <span className="px-3 py-1.5 font-semibold">{page} / {totalPages}</span>
            <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="px-3 py-1.5 rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50">&rarr;</button>
          </div>
        </div>
      )}

      {assignTarget && (
        <AssignModal
          card={assignTarget}
          businesses={businesses}
          onClose={() => setAssignTarget(null)}
          onDone={() => { setAssignTarget(null); load() }}
        />
      )}
    </div>
  )
}
