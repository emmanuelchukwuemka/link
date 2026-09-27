'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  MessageSquareText, ChevronRight, UserPlus, Search, Download, X,
  Pencil, MoreVertical, Trash2, Mail, Phone, Calendar, Users, Clock, CheckCircle2,
  ArrowRightLeft, RefreshCw, UserCheck, Building2,
} from 'lucide-react'

type Lead = {
  id: string; name: string; phone: string | null; email: string | null
  message: string | null; notes: string | null; source: string; status: string; createdAt: string
  owner: { username: string; displayName: string | null }
}
type OwnerOption = { id: string; username: string; displayName: string | null; email: string }

const STATUSES = ['new', 'contacted', 'interested', 'converted', 'lost']
const STATUS_LABELS: Record<string, string> = { new: 'New', contacted: 'Contacted', interested: 'Interested', converted: 'Converted', lost: 'Lost' }
const STATUS_COLORS: Record<string, string> = {
  new: 'bg-blue-100 text-blue-700',
  contacted: 'bg-amber-100 text-amber-700',
  interested: 'bg-purple-100 text-purple-700',
  converted: 'bg-green-100 text-green-700',
  lost: 'bg-red-100 text-red-600',
}
const SOURCES = ['Website', 'Referral', 'Social Media', 'Advertisement', 'Other']
const SOURCE_COLORS: Record<string, string> = {
  Website: 'bg-blue-100 text-blue-700',
  Referral: 'bg-green-100 text-green-700',
  'Social Media': 'bg-pink-100 text-pink-700',
  Advertisement: 'bg-purple-100 text-purple-700',
  Other: 'bg-gray-100 text-gray-700',
}
const PAGE_SIZE = 8

function pctChange(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0
  return Math.round(((current - previous) / previous) * 1000) / 10
}

function dayKey(d: Date): string {
  return d.toISOString().slice(0, 10)
}

function Sparkline({ data, positive }: { data: number[]; positive: boolean }) {
  const max = Math.max(...data, 1)
  const points = data.map((v, i) => `${(i / (data.length - 1)) * 100},${24 - (v / max) * 20}`).join(' ')
  return (
    <svg viewBox="0 0 100 24" className="w-full h-6" preserveAspectRatio="none">
      <polyline points={points} fill="none" stroke={positive ? '#16a34a' : '#dc2626'} strokeWidth="2" vectorEffect="non-scaling-stroke" />
    </svg>
  )
}

function statBucket(leads: Lead[], status: string | null) {
  const relevant = status ? leads.filter((l) => l.status === status) : leads
  const now = new Date()
  const d30 = new Date(now); d30.setDate(d30.getDate() - 30)
  const d60 = new Date(now); d60.setDate(d60.getDate() - 60)
  const curr = relevant.filter((l) => new Date(l.createdAt) >= d30).length
  const prev = relevant.filter((l) => { const t = new Date(l.createdAt); return t >= d60 && t < d30 }).length

  const buckets: Record<string, number> = {}
  for (let i = 6; i >= 0; i--) { const d = new Date(now); d.setDate(d.getDate() - i); buckets[dayKey(d)] = 0 }
  for (const l of relevant) { const key = dayKey(new Date(l.createdAt)); if (key in buckets) buckets[key]++ }

  return { value: relevant.length, change: pctChange(curr, prev), series: Object.values(buckets) }
}

function AddLeadModal({ owners, onClose, onCreated }: { owners: OwnerOption[]; onClose: () => void; onCreated: () => void }) {
  const [values, setValues] = useState({ ownerId: '', name: '', email: '', phone: '', message: '', source: 'Website', status: 'new' })
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    const res = await fetch('/api/admin/leads', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(values) })
    setSaving(false)
    if (!res.ok) { const data = await res.json(); setError(data.error || 'Could not create lead'); return }
    onCreated()
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-3xl w-full max-w-md max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 pt-6 pb-4">
          <h2 className="text-lg font-bold text-black">Add Lead</h2>
          <button onClick={onClose} className="p-1.5 text-gray-500 hover:text-black rounded-lg hover:bg-gray-100"><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit} className="px-6 pb-6 space-y-3">
          {error && <div className="bg-red-50 text-red-500 p-3 rounded-lg text-sm">{error}</div>}
          <div>
            <label className="block text-xs font-semibold text-black mb-1.5">For Profile</label>
            <select required value={values.ownerId} onChange={(e) => setValues({ ...values, ownerId: e.target.value })} className="w-full px-3 py-2.5 rounded-lg bg-gray-100 outline-none text-sm text-black">
              <option value="">Select a profile owner...</option>
              {owners.map((o) => <option key={o.id} value={o.id}>{o.displayName || o.username} (@{o.username})</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-black mb-1.5">Name</label>
            <input required value={values.name} onChange={(e) => setValues({ ...values, name: e.target.value })} className="w-full px-3 py-2.5 rounded-lg bg-gray-100 outline-none text-sm text-black" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-black mb-1.5">Email</label>
              <input type="email" value={values.email} onChange={(e) => setValues({ ...values, email: e.target.value })} className="w-full px-3 py-2.5 rounded-lg bg-gray-100 outline-none text-sm text-black" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-black mb-1.5">Phone</label>
              <input value={values.phone} onChange={(e) => setValues({ ...values, phone: e.target.value })} className="w-full px-3 py-2.5 rounded-lg bg-gray-100 outline-none text-sm text-black" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-black mb-1.5">Message</label>
            <textarea value={values.message} onChange={(e) => setValues({ ...values, message: e.target.value })} rows={2} className="w-full px-3 py-2.5 rounded-lg bg-gray-100 outline-none text-sm text-black resize-none" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-black mb-1.5">Source</label>
              <select value={values.source} onChange={(e) => setValues({ ...values, source: e.target.value })} className="w-full px-3 py-2.5 rounded-lg bg-gray-100 outline-none text-sm text-black">
                {SOURCES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-black mb-1.5">Status</label>
              <select value={values.status} onChange={(e) => setValues({ ...values, status: e.target.value })} className="w-full px-3 py-2.5 rounded-lg bg-gray-100 outline-none text-sm text-black">
                {STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
              </select>
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 bg-gray-100 text-black py-2.5 rounded-full font-semibold text-sm hover:bg-gray-200">Cancel</button>
            <button type="submit" disabled={saving} className="flex-1 bg-green-600 text-white py-2.5 rounded-full font-semibold text-sm hover:bg-green-700 disabled:opacity-60">{saving ? 'Saving...' : 'Add Lead'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}

function EditLeadModal({ lead, onClose, onSaved }: { lead: Lead; onClose: () => void; onSaved: (l: Lead) => void }) {
  const [values, setValues] = useState({ name: lead.name, email: lead.email || '', phone: lead.phone || '', source: lead.source, status: lead.status, notes: lead.notes || '' })
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    const res = await fetch(`/api/admin/leads/${lead.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(values) })
    const data = await res.json()
    setSaving(false)
    if (!res.ok) { setError(data.error || 'Could not save lead'); return }
    onSaved(data.lead)
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-3xl w-full max-w-md max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 pt-6 pb-4">
          <h2 className="text-lg font-bold text-black">Edit Lead</h2>
          <button onClick={onClose} className="p-1.5 text-gray-500 hover:text-black rounded-lg hover:bg-gray-100"><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit} className="px-6 pb-6 space-y-3">
          {error && <div className="bg-red-50 text-red-500 p-3 rounded-lg text-sm">{error}</div>}
          {lead.message && (
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs font-semibold text-gray-600 mb-1">Original message</p>
              <p className="text-sm text-black">&ldquo;{lead.message}&rdquo;</p>
            </div>
          )}
          <div>
            <label className="block text-xs font-semibold text-black mb-1.5">Name</label>
            <input required value={values.name} onChange={(e) => setValues({ ...values, name: e.target.value })} className="w-full px-3 py-2.5 rounded-lg bg-gray-100 outline-none text-sm text-black" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-black mb-1.5">Email</label>
              <input type="email" value={values.email} onChange={(e) => setValues({ ...values, email: e.target.value })} className="w-full px-3 py-2.5 rounded-lg bg-gray-100 outline-none text-sm text-black" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-black mb-1.5">Phone</label>
              <input value={values.phone} onChange={(e) => setValues({ ...values, phone: e.target.value })} className="w-full px-3 py-2.5 rounded-lg bg-gray-100 outline-none text-sm text-black" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-black mb-1.5">Source</label>
              <select value={values.source} onChange={(e) => setValues({ ...values, source: e.target.value })} className="w-full px-3 py-2.5 rounded-lg bg-gray-100 outline-none text-sm text-black">
                {SOURCES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-black mb-1.5">Status</label>
              <select value={values.status} onChange={(e) => setValues({ ...values, status: e.target.value })} className="w-full px-3 py-2.5 rounded-lg bg-gray-100 outline-none text-sm text-black">
                {STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-black mb-1.5">Your Notes</label>
            <textarea value={values.notes} onChange={(e) => setValues({ ...values, notes: e.target.value })} rows={3} placeholder="Follow-up notes for your team..." className="w-full px-3 py-2.5 rounded-lg bg-gray-100 outline-none text-sm text-black resize-none" />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 bg-gray-100 text-black py-2.5 rounded-full font-semibold text-sm hover:bg-gray-200">Cancel</button>
            <button type="submit" disabled={saving} className="flex-1 bg-green-600 text-white py-2.5 rounded-full font-semibold text-sm hover:bg-green-700 disabled:opacity-60">{saving ? 'Saving...' : 'Save Changes'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}

function generatePassword(): string {
  return Math.random().toString(36).slice(-6) + Math.random().toString(36).slice(-2).toUpperCase()
}

function ConvertModal({ lead, onClose, onConverted }: { lead: Lead; onClose: () => void; onConverted: (l: Lead) => void }) {
  const [type, setType] = useState<'individual' | 'business'>('individual')
  const [username, setUsername] = useState(lead.name.toLowerCase().replace(/[^a-z0-9]+/g, ''))
  const [password, setPassword] = useState(generatePassword())
  const [businessName, setBusinessName] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [result, setResult] = useState<{ username: string; password: string } | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    const res = await fetch(`/api/admin/leads/${lead.id}/convert`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, username, password, businessName }),
    })
    const data = await res.json()
    setSaving(false)
    if (!res.ok) { setError(data.error || 'Could not convert this lead'); return }
    onConverted(data.lead)
    setResult({ username, password })
  }

  if (result) {
    return (
      <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={onClose}>
        <div className="bg-white rounded-3xl w-full max-w-sm p-6 text-center" onClick={(e) => e.stopPropagation()}>
          <CheckCircle2 size={40} className="text-green-600 mx-auto mb-3" />
          <p className="font-bold text-black mb-1">Account created</p>
          <p className="text-sm text-gray-600 mb-4">Share these temporary credentials with {lead.name}:</p>
          <div className="bg-gray-50 rounded-lg p-3 text-sm text-left space-y-1 mb-4">
            <p><span className="text-gray-600">Username:</span> <span className="font-mono font-semibold text-black">{result.username}</span></p>
            <p><span className="text-gray-600">Password:</span> <span className="font-mono font-semibold text-black">{result.password}</span></p>
          </div>
          <button onClick={onClose} className="w-full bg-black text-white py-2.5 rounded-full font-semibold text-sm hover:bg-gray-800">Done</button>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-3xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 pt-6 pb-4">
          <h2 className="text-lg font-bold text-black">Convert {lead.name} to an Account</h2>
          <button onClick={onClose} className="p-1.5 text-gray-500 hover:text-black rounded-lg hover:bg-gray-100"><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit} className="px-6 pb-6 space-y-3">
          {error && <div className="bg-red-50 text-red-500 p-3 rounded-lg text-sm">{error}</div>}
          {!lead.email && <div className="bg-amber-50 text-amber-800 p-3 rounded-lg text-sm">This lead has no email on file — add one via Edit first.</div>}
          <div className="grid grid-cols-2 gap-3">
            <button type="button" onClick={() => setType('individual')} className={`flex items-center justify-center gap-2 py-2.5 rounded-full font-semibold text-sm ${type === 'individual' ? 'bg-black text-white' : 'bg-gray-100 text-black'}`}>
              <UserCheck size={15} /> Individual
            </button>
            <button type="button" onClick={() => setType('business')} className={`flex items-center justify-center gap-2 py-2.5 rounded-full font-semibold text-sm ${type === 'business' ? 'bg-black text-white' : 'bg-gray-100 text-black'}`}>
              <Building2 size={15} /> Business
            </button>
          </div>
          {type === 'business' && (
            <div>
              <label className="block text-xs font-semibold text-black mb-1.5">Business Name</label>
              <input required value={businessName} onChange={(e) => setBusinessName(e.target.value)} className="w-full px-3 py-2.5 rounded-lg bg-gray-100 outline-none text-sm text-black" />
            </div>
          )}
          <div>
            <label className="block text-xs font-semibold text-black mb-1.5">Username</label>
            <input required value={username} onChange={(e) => setUsername(e.target.value)} className="w-full px-3 py-2.5 rounded-lg bg-gray-100 outline-none text-sm text-black" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-black mb-1.5">Temporary Password</label>
            <div className="flex gap-2">
              <input required value={password} onChange={(e) => setPassword(e.target.value)} className="flex-1 px-3 py-2.5 rounded-lg bg-gray-100 outline-none text-sm text-black font-mono" />
              <button type="button" onClick={() => setPassword(generatePassword())} className="px-3 rounded-lg bg-gray-100 text-black hover:bg-gray-200"><RefreshCw size={14} /></button>
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 bg-gray-100 text-black py-2.5 rounded-full font-semibold text-sm hover:bg-gray-200">Cancel</button>
            <button type="submit" disabled={saving || !lead.email} className="flex-1 bg-green-600 text-white py-2.5 rounded-full font-semibold text-sm hover:bg-green-700 disabled:opacity-60">{saving ? 'Converting...' : 'Convert'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function AdminLeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [owners, setOwners] = useState<OwnerOption[]>([])
  const [loading, setLoading] = useState(true)
  const [statusTab, setStatusTab] = useState('all')
  const [search, setSearch] = useState('')
  const [sourceFilter, setSourceFilter] = useState('all')
  const [showDateRange, setShowDateRange] = useState(false)
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [page, setPage] = useState(1)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null)
  const [addOpen, setAddOpen] = useState(false)
  const [editLead, setEditLead] = useState<Lead | null>(null)
  const [convertLead, setConvertLead] = useState<Lead | null>(null)

  const load = () => {
    Promise.all([
      fetch('/api/admin/leads').then((r) => r.json()),
      fetch('/api/admin/users').then((r) => r.json()),
    ]).then(([leadData, userData]) => {
      if (leadData.leads) setLeads(leadData.leads)
      if (userData.users) setOwners(userData.users)
      setLoading(false)
    })
  }
  useEffect(() => { load() }, [])
  useEffect(() => { setPage(1) }, [statusTab, search, sourceFilter, dateFrom, dateTo])

  if (loading) return <div className="text-center py-20 text-black">Loading...</div>

  const statusCounts = STATUSES.reduce<Record<string, number>>((acc, s) => { acc[s] = leads.filter((l) => l.status === s).length; return acc }, {})

  const q = search.trim().toLowerCase()
  const filtered = leads.filter((l) => {
    if (statusTab !== 'all' && l.status !== statusTab) return false
    if (sourceFilter !== 'all' && l.source !== sourceFilter) return false
    if (dateFrom && new Date(l.createdAt) < new Date(dateFrom)) return false
    if (dateTo && new Date(l.createdAt) > new Date(`${dateTo}T23:59:59`)) return false
    if (!q) return true
    return l.name.toLowerCase().includes(q) || (l.email || '').toLowerCase().includes(q) || (l.phone || '').toLowerCase().includes(q)
  })

  const totalPages = Math.max(Math.ceil(filtered.length / PAGE_SIZE), 1)
  const currentPage = Math.min(page, totalPages)
  const pageItems = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)

  const toggleSelectAll = () => {
    if (pageItems.every((l) => selected.has(l.id))) setSelected((s) => { const n = new Set(s); pageItems.forEach((l) => n.delete(l.id)); return n })
    else setSelected((s) => { const n = new Set(s); pageItems.forEach((l) => n.add(l.id)); return n })
  }
  const toggleSelect = (id: string) => setSelected((s) => { const n = new Set(s); if (n.has(id)) n.delete(id); else n.add(id); return n })

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this lead? This cannot be undone.')) return
    setMenuOpenId(null)
    const res = await fetch(`/api/admin/leads/${id}`, { method: 'DELETE' })
    if (res.ok) { setLeads(leads.filter((l) => l.id !== id)); setSelected((s) => { const n = new Set(s); n.delete(id); return n }) }
  }
  const handleBulkDelete = async () => {
    if (!confirm(`Delete ${selected.size} lead(s)? This cannot be undone.`)) return
    const ids = Array.from(selected)
    await Promise.all(ids.map((id) => fetch(`/api/admin/leads/${id}`, { method: 'DELETE' })))
    setLeads(leads.filter((l) => !ids.includes(l.id)))
    setSelected(new Set())
  }

  const handleExport = () => {
    const rows = [
      ['Name', 'Email', 'Phone', 'Source', 'Status', 'Owner Profile', 'Notes', 'Created At'],
      ...filtered.map((l) => [l.name, l.email || '', l.phone || '', l.source, STATUS_LABELS[l.status], `@${l.owner.username}`, l.notes || '', new Date(l.createdAt).toLocaleString()]),
    ]
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `leads-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const totalStat = statBucket(leads, null)
  const newStat = statBucket(leads, 'new')
  const contactedStat = statBucket(leads, 'contacted')
  const convertedStat = statBucket(leads, 'converted')

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-1.5 text-xs text-gray-600">
        <Link href="/admin" className="hover:text-black">Home</Link>
        <ChevronRight size={12} />
        <span className="text-black font-semibold">Leads</span>
      </div>

      <div className="flex flex-wrap justify-between items-start gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-black flex items-center gap-2"><MessageSquareText size={26} className="text-green-600" /> Leads</h1>
          <p className="text-gray-600 text-sm mt-1">Manage and track potential customers, convert them to users or businesses.</p>
        </div>
        <button onClick={() => setAddOpen(true)} className="bg-green-600 text-white px-4 py-2.5 rounded-full font-semibold flex items-center gap-2 hover:bg-green-700 whitespace-nowrap">
          <UserPlus size={16} /> Add Lead
        </button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Leads', sub: 'All time leads', stat: totalStat, icon: Users, iconBg: 'bg-blue-50', iconColor: 'text-blue-600' },
          { label: 'New Leads', sub: 'Awaiting first contact', stat: newStat, icon: Users, iconBg: 'bg-green-50', iconColor: 'text-green-600' },
          { label: 'Contacted', sub: 'In progress', stat: contactedStat, icon: Clock, iconBg: 'bg-amber-50', iconColor: 'text-amber-600' },
          { label: 'Converted', sub: 'Became customers', stat: convertedStat, icon: CheckCircle2, iconBg: 'bg-purple-50', iconColor: 'text-purple-600' },
        ].map(({ label, sub, stat, icon: Icon, iconBg, iconColor }) => {
          const positive = stat.change >= 0
          return (
            <div key={label} className="bg-white p-5 rounded-3xl shadow-sm">
              <div className="flex items-center gap-3 mb-2">
                <span className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${iconBg}`}><Icon size={18} className={iconColor} /></span>
                <div className="min-w-0">
                  <p className="text-xs font-medium text-gray-700 truncate">{label}</p>
                  <p className="text-xl font-bold text-black">{stat.value}</p>
                </div>
              </div>
              <div className="flex items-center justify-between gap-2 mb-1">
                <span className={`text-xs font-semibold ${positive ? 'text-green-600' : 'text-red-500'}`}>{positive ? '↑' : '↓'} {Math.abs(stat.change)}%</span>
                <p className="text-xs text-gray-600 truncate">{sub}</p>
              </div>
              <Sparkline data={stat.series} positive={positive} />
            </div>
          )
        })}
      </div>

      {/* Status tabs */}
      <div className="flex flex-wrap gap-2">
        <button onClick={() => setStatusTab('all')} className={`flex items-center gap-2 px-4 py-2.5 rounded-full font-semibold text-sm ${statusTab === 'all' ? 'bg-black text-white' : 'bg-white text-black border border-gray-200 hover:bg-gray-50'}`}>
          All Leads <span className={`text-xs px-1.5 py-0.5 rounded-full ${statusTab === 'all' ? 'bg-white/20' : 'bg-gray-100'}`}>{leads.length}</span>
        </button>
        {STATUSES.map((s) => (
          <button key={s} onClick={() => setStatusTab(s)} className={`flex items-center gap-2 px-4 py-2.5 rounded-full font-semibold text-sm ${statusTab === s ? 'bg-black text-white' : 'bg-white text-black border border-gray-200 hover:bg-gray-50'}`}>
            {STATUS_LABELS[s]} <span className={`text-xs px-1.5 py-0.5 rounded-full ${statusTab === s ? 'bg-white/20' : 'bg-gray-100'}`}>{statusCounts[s]}</span>
          </button>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-2 bg-white rounded-full px-4 py-2.5 shadow-sm flex-1 min-w-[220px]">
          <Search size={15} className="text-gray-400 shrink-0" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search leads by name, email or phone..." className="outline-none text-sm bg-transparent text-black placeholder:text-gray-400 w-full" />
        </div>
        <select value={sourceFilter} onChange={(e) => setSourceFilter(e.target.value)} className="text-sm px-3 py-2.5 rounded-full bg-white shadow-sm outline-none text-black">
          <option value="all">All Source</option>
          {SOURCES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <div className="relative">
          <button onClick={() => setShowDateRange(!showDateRange)} className="flex items-center gap-2 text-sm px-3 py-2.5 rounded-full bg-white shadow-sm text-black">
            <Calendar size={14} /> {dateFrom || dateTo ? `${dateFrom || '…'} → ${dateTo || '…'}` : 'Select Date Range'}
          </button>
          {showDateRange && (
            <div className="absolute right-0 mt-2 bg-white rounded-xl shadow-xl border border-gray-100 p-4 z-20 flex items-center gap-2">
              <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="text-sm px-2 py-1.5 rounded-lg bg-gray-100 outline-none text-black" />
              <span className="text-gray-400 text-sm">to</span>
              <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="text-sm px-2 py-1.5 rounded-lg bg-gray-100 outline-none text-black" />
              {(dateFrom || dateTo) && <button onClick={() => { setDateFrom(''); setDateTo('') }} className="text-xs text-gray-500 hover:text-black ml-1">Clear</button>}
            </div>
          )}
        </div>
        <button onClick={handleExport} className="flex items-center gap-2 text-sm font-semibold px-4 py-2.5 rounded-full bg-white shadow-sm text-black hover:bg-gray-50 whitespace-nowrap">
          <Download size={14} /> Export
        </button>
      </div>

      {selected.size > 0 && (
        <div className="bg-black rounded-2xl px-5 py-3 flex items-center justify-between gap-3">
          <span className="text-white text-sm font-semibold">{selected.size} selected</span>
          <div className="flex items-center gap-2">
            <button onClick={() => setSelected(new Set())} className="text-white/70 hover:text-white text-sm font-semibold px-3 py-1.5">Clear</button>
            <button onClick={handleBulkDelete} className="bg-red-600 text-white text-sm font-semibold px-4 py-1.5 rounded-full hover:bg-red-700 flex items-center gap-1.5"><Trash2 size={14} /> Delete Selected</button>
          </div>
        </div>
      )}

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-3xl p-8 text-center text-black shadow-sm">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4"><MessageSquareText size={32} className="text-gray-400" /></div>
          No leads match this view.
        </div>
      ) : (
        <div className="bg-white rounded-3xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-black border-b border-gray-100">
                  <th className="p-3 w-10"><input type="checkbox" checked={pageItems.length > 0 && pageItems.every((l) => selected.has(l.id))} onChange={toggleSelectAll} className="w-4 h-4 rounded accent-black" /></th>
                  <th className="p-3 font-semibold">#</th>
                  <th className="p-3 font-semibold">Name</th>
                  <th className="p-3 font-semibold">Email / Phone</th>
                  <th className="p-3 font-semibold">Source</th>
                  <th className="p-3 font-semibold">Status</th>
                  <th className="p-3 font-semibold">Created At</th>
                  <th className="p-3 font-semibold">Notes</th>
                  <th className="p-3 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {pageItems.map((l, i) => (
                  <tr key={l.id} className="border-b border-gray-50 last:border-0">
                    <td className="p-3"><input type="checkbox" checked={selected.has(l.id)} onChange={() => toggleSelect(l.id)} className="w-4 h-4 rounded accent-black" /></td>
                    <td className="p-3 text-gray-600">{(currentPage - 1) * PAGE_SIZE + i + 1}</td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <span className="w-8 h-8 rounded-full bg-black text-white flex items-center justify-center text-xs font-bold shrink-0">{l.name.charAt(0).toUpperCase()}</span>
                        <span className="font-medium text-black whitespace-nowrap">{l.name}</span>
                      </div>
                    </td>
                    <td className="p-3 text-xs text-gray-600 whitespace-nowrap">
                      {l.email && <p>{l.email}</p>}
                      {l.phone && <p>{l.phone}</p>}
                      {!l.email && !l.phone && '—'}
                    </td>
                    <td className="p-3"><span className={`text-xs font-semibold px-2.5 py-1 rounded-full whitespace-nowrap ${SOURCE_COLORS[l.source] || 'bg-gray-100 text-gray-700'}`}>{l.source}</span></td>
                    <td className="p-3"><span className={`text-xs font-semibold px-2.5 py-1 rounded-full whitespace-nowrap ${STATUS_COLORS[l.status]}`}>{STATUS_LABELS[l.status]}</span></td>
                    <td className="p-3 text-xs text-gray-600 whitespace-nowrap">{new Date(l.createdAt).toLocaleDateString()} <br />{new Date(l.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                    <td className="p-3 text-xs text-gray-600 max-w-[160px] truncate">{l.notes || '—'}</td>
                    <td className="p-3">
                      <div className="flex items-center gap-1.5">
                        {l.email ? (
                          <a href={`mailto:${l.email}`} className="p-1.5 rounded-lg border border-gray-200 text-black hover:bg-gray-50"><Mail size={13} /></a>
                        ) : l.phone ? (
                          <a href={`https://wa.me/${l.phone.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="p-1.5 rounded-lg border border-gray-200 text-black hover:bg-gray-50"><Phone size={13} /></a>
                        ) : (
                          <span className="p-1.5 rounded-lg border border-gray-100 text-gray-300"><Mail size={13} /></span>
                        )}
                        <button onClick={() => setEditLead(l)} className="p-1.5 rounded-lg border border-gray-200 text-black hover:bg-gray-50"><Pencil size={13} /></button>
                        <div className="relative">
                          <button onClick={() => setMenuOpenId(menuOpenId === l.id ? null : l.id)} className="p-1.5 rounded-lg border border-gray-200 text-black hover:bg-gray-50"><MoreVertical size={13} /></button>
                          {menuOpenId === l.id && (
                            <div className="absolute right-0 mt-1 w-44 bg-white rounded-xl shadow-xl border border-gray-100 py-1 z-20">
                              <button onClick={() => { setConvertLead(l); setMenuOpenId(null) }} className="w-full text-left flex items-center gap-2 px-3 py-2 text-xs font-semibold text-black hover:bg-gray-50"><ArrowRightLeft size={12} /> Convert to Account</button>
                              <button onClick={() => handleDelete(l.id)} className="w-full text-left flex items-center gap-2 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50"><Trash2 size={12} /> Delete</button>
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 p-4 border-t border-gray-100">
            <p className="text-xs text-gray-600">Showing {(currentPage - 1) * PAGE_SIZE + 1} to {Math.min(currentPage * PAGE_SIZE, filtered.length)} of {filtered.length} leads</p>
            <div className="flex items-center gap-1.5">
              <button onClick={() => setPage(Math.max(currentPage - 1, 1))} disabled={currentPage === 1} className="px-2.5 py-1 rounded-lg border border-gray-200 text-black disabled:opacity-40 hover:bg-gray-50 text-xs font-semibold">Prev</button>
              {Array.from({ length: totalPages }, (_, idx) => idx + 1).map((n) => (
                <button key={n} onClick={() => setPage(n)} className={`w-7 h-7 rounded-lg text-xs font-semibold ${n === currentPage ? 'bg-green-600 text-white' : 'text-black hover:bg-gray-50 border border-gray-200'}`}>{n}</button>
              ))}
              <button onClick={() => setPage(Math.min(currentPage + 1, totalPages))} disabled={currentPage === totalPages} className="px-2.5 py-1 rounded-lg border border-gray-200 text-black disabled:opacity-40 hover:bg-gray-50 text-xs font-semibold">Next</button>
            </div>
          </div>
        </div>
      )}

      {addOpen && <AddLeadModal owners={owners} onClose={() => setAddOpen(false)} onCreated={load} />}
      {editLead && <EditLeadModal lead={editLead} onClose={() => setEditLead(null)} onSaved={(updated) => setLeads(leads.map((l) => (l.id === updated.id ? updated : l)))} />}
      {convertLead && <ConvertModal lead={convertLead} onClose={() => setConvertLead(null)} onConverted={(updated) => setLeads(leads.map((l) => (l.id === updated.id ? updated : l)))} />}
    </div>
  )
}
