'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  Crown, ChevronRight, ChevronDown, UserPlus, Building2, Users, Wallet, Clock,
  Search, Download, X, User as UserIcon,
} from 'lucide-react'
import { BUSINESS_PLANS, BusinessPlanName } from '@/lib/subscription'

type ProUser = { id: string; username: string; displayName: string | null; email: string; planExpiresAt: string | null; active: boolean; startDate: string | null }
type BusinessSub = { id: string; name: string; email: string | null; plan: string; planExpiresAt: string | null; active: boolean; startDate: string | null }
type Payment = {
  id: string; plan: string; amount: number; reference: string; status: string; createdAt: string
  user: { username: string } | null
  business: { name: string } | null
}
type PickerUser = { id: string; username: string; displayName: string | null; email: string; plan: string }
type PickerBusiness = { id: string; name: string; plan: string }

type Tab = 'individual' | 'business' | 'history'

function extendByOneYear(current: string | null): string {
  const base = current && new Date(current) > new Date() ? new Date(current) : new Date()
  base.setFullYear(base.getFullYear() + 1)
  return base.toISOString()
}

function toCsv(rows: (string | number)[][]): string {
  return rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n')
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

function GrantModal({
  mode, individuals, businesses, onClose, onGranted,
}: {
  mode: 'individual' | 'business'
  individuals: PickerUser[]
  businesses: PickerBusiness[]
  onClose: () => void
  onGranted: () => void
}) {
  const [targetId, setTargetId] = useState('')
  const [plan, setPlan] = useState<BusinessPlanName>('tier10')
  const [expiresAt, setExpiresAt] = useState(() => extendByOneYear(null).slice(0, 10))
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!targetId) { setError('Please choose a target'); return }
    setSaving(true)
    setError('')
    const url = mode === 'individual' ? `/api/admin/subscriptions/individual/${targetId}` : `/api/admin/subscriptions/business/${targetId}`
    const body = mode === 'individual'
      ? { plan: 'pro', planExpiresAt: new Date(expiresAt).toISOString() }
      : { plan, planExpiresAt: new Date(expiresAt).toISOString() }
    const res = await fetch(url, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    setSaving(false)
    if (!res.ok) { const data = await res.json(); setError(data.error || 'Could not grant subscription'); return }
    onGranted()
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-3xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 pt-6 pb-4">
          <h2 className="text-lg font-bold text-black">{mode === 'individual' ? 'Add Individual Pro Subscriber' : 'Add Business Subscription'}</h2>
          <button onClick={onClose} className="p-1.5 text-gray-500 hover:text-black rounded-lg hover:bg-gray-100"><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit} className="px-6 pb-6 space-y-4">
          {error && <div className="bg-red-50 text-red-500 p-3 rounded-lg text-sm">{error}</div>}

          <div>
            <label className="block text-xs font-semibold text-black mb-1.5">{mode === 'individual' ? 'User' : 'Business'}</label>
            <select required value={targetId} onChange={(e) => setTargetId(e.target.value)} className="w-full px-3 py-2.5 rounded-lg bg-gray-100 outline-none text-sm text-black">
              <option value="">Select...</option>
              {mode === 'individual'
                ? individuals.map((u) => <option key={u.id} value={u.id}>{u.displayName || u.username} ({u.email}){u.plan === 'pro' ? ' — already Pro' : ''}</option>)
                : businesses.map((b) => <option key={b.id} value={b.id}>{b.name}{b.plan !== 'free' ? ` — currently ${BUSINESS_PLANS[b.plan as BusinessPlanName]?.label || b.plan}` : ''}</option>)}
            </select>
          </div>

          {mode === 'business' && (
            <div>
              <label className="block text-xs font-semibold text-black mb-1.5">Plan Tier</label>
              <select value={plan} onChange={(e) => setPlan(e.target.value as BusinessPlanName)} className="w-full px-3 py-2.5 rounded-lg bg-gray-100 outline-none text-sm text-black">
                {(Object.keys(BUSINESS_PLANS) as BusinessPlanName[]).filter((p) => p !== 'free').map((p) => (
                  <option key={p} value={p}>{BUSINESS_PLANS[p].label}{BUSINESS_PLANS[p].priceNaira !== null ? ` — ₦${BUSINESS_PLANS[p].priceNaira!.toLocaleString()}/yr` : ' — Contact pricing'}</option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-black mb-1.5">Expires On</label>
            <input required type="date" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} className="w-full px-3 py-2.5 rounded-lg bg-gray-100 outline-none text-sm text-black" />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 bg-gray-100 text-black py-2.5 rounded-full font-semibold text-sm hover:bg-gray-200">Cancel</button>
            <button type="submit" disabled={saving} className="flex-1 bg-green-600 text-white py-2.5 rounded-full font-semibold text-sm hover:bg-green-700 disabled:opacity-60">
              {saving ? 'Saving...' : 'Grant Subscription'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function AdminSubscriptionsPage() {
  const [proUsers, setProUsers] = useState<ProUser[]>([])
  const [businessSubs, setBusinessSubs] = useState<BusinessSub[]>([])
  const [payments, setPayments] = useState<Payment[]>([])
  const [totalRevenue, setTotalRevenue] = useState(0)
  const [individuals, setIndividuals] = useState<PickerUser[]>([])
  const [businesses, setBusinesses] = useState<PickerBusiness[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<Tab>('individual')
  const [addMenuOpen, setAddMenuOpen] = useState(false)
  const [grantMode, setGrantMode] = useState<'individual' | 'business' | null>(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [busyId, setBusyId] = useState<string | null>(null)

  const load = () => {
    Promise.all([
      fetch('/api/admin/subscriptions').then((r) => r.json()),
      fetch('/api/admin/users?type=individual').then((r) => r.json()),
      fetch('/api/admin/businesses').then((r) => r.json()),
    ]).then(([subs, users, biz]) => {
      if (subs.proUsers) setProUsers(subs.proUsers)
      if (subs.businessSubs) setBusinessSubs(subs.businessSubs)
      if (subs.payments) setPayments(subs.payments)
      if (typeof subs.totalRevenue === 'number') setTotalRevenue(subs.totalRevenue)
      if (users.users) setIndividuals(users.users)
      if (biz.businesses) setBusinesses(biz.businesses)
      setLoading(false)
    })
  }

  useEffect(() => { load() }, [])
  useEffect(() => { setSearch(''); setStatusFilter('all') }, [tab])

  const in30Days = new Date()
  in30Days.setDate(in30Days.getDate() + 30)
  const countExpiringSoon = (list: { active: boolean; planExpiresAt: string | null }[]) =>
    list.filter((i) => i.active && i.planExpiresAt && new Date(i.planExpiresAt) <= in30Days).length
  const expiringSoonCount = countExpiringSoon(proUsers) + countExpiringSoon(businessSubs)

  const activeIndividualCount = proUsers.filter((u) => u.active).length
  const activeBusinessCount = businessSubs.filter((b) => b.active).length

  const handleExtendIndividual = async (u: ProUser) => {
    setBusyId(u.id)
    const res = await fetch(`/api/admin/subscriptions/individual/${u.id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ plan: 'pro', planExpiresAt: extendByOneYear(u.planExpiresAt) }),
    })
    setBusyId(null)
    if (res.ok) load()
  }
  const handleRevokeIndividual = async (u: ProUser) => {
    if (!confirm(`Revoke Pro from ${u.displayName || u.username}?`)) return
    setBusyId(u.id)
    const res = await fetch(`/api/admin/subscriptions/individual/${u.id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ plan: 'free' }),
    })
    setBusyId(null)
    if (res.ok) load()
  }
  const handleExtendBusiness = async (b: BusinessSub) => {
    setBusyId(b.id)
    const res = await fetch(`/api/admin/subscriptions/business/${b.id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ plan: b.plan, planExpiresAt: extendByOneYear(b.planExpiresAt) }),
    })
    setBusyId(null)
    if (res.ok) load()
  }
  const handleRevokeBusiness = async (b: BusinessSub) => {
    if (!confirm(`Revoke the paid plan for ${b.name}?`)) return
    setBusyId(b.id)
    const res = await fetch(`/api/admin/subscriptions/business/${b.id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ plan: 'free' }),
    })
    setBusyId(null)
    if (res.ok) load()
  }

  if (loading) return <div className="text-center py-20 text-black">Loading...</div>

  const q = search.trim().toLowerCase()

  const filteredIndividuals = proUsers.filter((u) => {
    if (statusFilter === 'active' && !u.active) return false
    if (statusFilter === 'expired' && u.active) return false
    if (!q) return true
    return (u.displayName || '').toLowerCase().includes(q) || u.username.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
  })
  const filteredBusinesses = businessSubs.filter((b) => {
    if (statusFilter === 'active' && !b.active) return false
    if (statusFilter === 'expired' && b.active) return false
    if (!q) return true
    return b.name.toLowerCase().includes(q) || (b.email || '').toLowerCase().includes(q)
  })
  const filteredPayments = payments.filter((p) => {
    if (statusFilter !== 'all' && p.status !== statusFilter) return false
    if (!q) return true
    return p.reference.toLowerCase().includes(q) || p.plan.toLowerCase().includes(q) || (p.user?.username || '').toLowerCase().includes(q) || (p.business?.name || '').toLowerCase().includes(q)
  })

  const exportIndividuals = () => downloadCsv(toCsv([
    ['User', 'Email', 'Status', 'Start Date', 'Expires'],
    ...filteredIndividuals.map((u) => [u.displayName || u.username, u.email, u.active ? 'Active' : 'Expired', u.startDate ? new Date(u.startDate).toLocaleDateString() : '—', u.planExpiresAt ? new Date(u.planExpiresAt).toLocaleDateString() : '—']),
  ]), 'individual-pro-subscribers.csv')
  const exportBusinesses = () => downloadCsv(toCsv([
    ['Business', 'Email', 'Plan', 'Status', 'Start Date', 'Expires'],
    ...filteredBusinesses.map((b) => [b.name, b.email || '', BUSINESS_PLANS[b.plan as BusinessPlanName]?.label || b.plan, b.active ? 'Active' : 'Expired', b.startDate ? new Date(b.startDate).toLocaleDateString() : '—', b.planExpiresAt ? new Date(b.planExpiresAt).toLocaleDateString() : '—']),
  ]), 'business-subscriptions.csv')
  const exportPayments = () => downloadCsv(toCsv([
    ['Reference', 'For', 'Plan', 'Amount', 'Status', 'Date'],
    ...filteredPayments.map((p) => [p.reference, p.user ? `@${p.user.username}` : p.business?.name || '—', p.plan, p.amount, p.status, new Date(p.createdAt).toLocaleDateString()]),
  ]), 'subscription-payments.csv')

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-1.5 text-xs text-gray-600">
        <Link href="/admin" className="hover:text-black">Home</Link>
        <ChevronRight size={12} />
        <span className="text-black font-semibold">Subscriptions</span>
      </div>

      <div className="flex flex-wrap justify-between items-start gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-black flex items-center gap-2"><Crown size={26} className="text-amber-500" /> Subscriptions</h1>
          <p className="text-gray-600 text-sm mt-1">Manage individual and business subscriptions, track payments and renewals.</p>
        </div>
        <div className="relative">
          <button onClick={() => setAddMenuOpen(!addMenuOpen)} className="bg-green-600 text-white px-4 py-2.5 rounded-full font-semibold flex items-center gap-2 hover:bg-green-700 whitespace-nowrap">
            <UserPlus size={16} /> Add Subscription <ChevronDown size={14} />
          </button>
          {addMenuOpen && (
            <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-gray-100 py-1 z-20">
              <button onClick={() => { setGrantMode('individual'); setAddMenuOpen(false) }} className="w-full text-left flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-black hover:bg-gray-50">
                <UserIcon size={14} /> Individual Pro Subscriber
              </button>
              <button onClick={() => { setGrantMode('business'); setAddMenuOpen(false) }} className="w-full text-left flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-black hover:bg-gray-50">
                <Building2 size={14} /> Business Subscription
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-3xl shadow-sm flex items-center gap-3">
          <span className="w-11 h-11 rounded-full bg-blue-50 flex items-center justify-center shrink-0"><UserIcon size={19} className="text-blue-600" /></span>
          <div className="min-w-0"><p className="text-xl font-bold text-black">{activeIndividualCount}</p><p className="text-xs text-gray-600">Individual Pro</p></div>
        </div>
        <div className="bg-white p-5 rounded-3xl shadow-sm flex items-center gap-3">
          <span className="w-11 h-11 rounded-full bg-green-50 flex items-center justify-center shrink-0"><Building2 size={19} className="text-green-600" /></span>
          <div className="min-w-0"><p className="text-xl font-bold text-black">{activeBusinessCount}</p><p className="text-xs text-gray-600">Business Plans</p></div>
        </div>
        <div className="bg-white p-5 rounded-3xl shadow-sm flex items-center gap-3">
          <span className="w-11 h-11 rounded-full bg-amber-50 flex items-center justify-center shrink-0"><Wallet size={19} className="text-amber-600" /></span>
          <div className="min-w-0"><p className="text-xl font-bold text-black">₦{totalRevenue.toLocaleString()}</p><p className="text-xs text-gray-600">Total Revenue</p></div>
        </div>
        <div className="bg-white p-5 rounded-3xl shadow-sm flex items-center gap-3">
          <span className="w-11 h-11 rounded-full bg-purple-50 flex items-center justify-center shrink-0"><Clock size={19} className="text-purple-600" /></span>
          <div className="min-w-0"><p className="text-xl font-bold text-black">{expiringSoonCount}</p><p className="text-xs text-gray-600">Expiring Soon</p></div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2">
        {[
          { key: 'individual' as Tab, label: 'Individual Pro', icon: UserIcon },
          { key: 'business' as Tab, label: 'Business Plans', icon: Building2 },
          { key: 'history' as Tab, label: 'Payment History', icon: Wallet },
        ].map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-full font-semibold text-sm transition-colors ${tab === key ? 'bg-green-600 text-white' : 'bg-white text-black border border-gray-200 hover:bg-gray-50'}`}
          >
            <Icon size={15} /> {label}
          </button>
        ))}
      </div>

      {/* Toolbar */}
      <div className="bg-white rounded-3xl p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <span className={`w-10 h-10 rounded-full flex items-center justify-center ${tab === 'individual' ? 'bg-blue-100' : tab === 'business' ? 'bg-green-100' : 'bg-amber-100'}`}>
              {tab === 'individual' ? <UserIcon size={17} className="text-blue-600" /> : tab === 'business' ? <Building2 size={17} className="text-green-600" /> : <Wallet size={17} className="text-amber-600" />}
            </span>
            <div>
              <p className="font-bold text-black">{tab === 'individual' ? 'Individual Pro Subscribers' : tab === 'business' ? 'Business Plan Subscriptions' : 'Payment History'}</p>
              <p className="text-xs text-gray-600">
                {tab === 'individual' ? 'Users with active Individual Pro subscriptions' : tab === 'business' ? 'Businesses with active paid plans' : 'All subscription payment attempts, successful or not'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-2 bg-gray-100 rounded-full px-3 py-2">
              <Search size={14} className="text-gray-400 shrink-0" />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search..." className="outline-none text-sm bg-transparent text-black placeholder:text-gray-400 w-36" />
            </div>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="text-sm px-3 py-2 rounded-full bg-gray-100 outline-none text-black">
              {tab === 'history' ? (
                <>
                  <option value="all">All Status</option>
                  <option value="success">Success</option>
                  <option value="pending">Pending</option>
                  <option value="failed">Failed</option>
                </>
              ) : (
                <>
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="expired">Expired</option>
                </>
              )}
            </select>
            <button
              onClick={tab === 'individual' ? exportIndividuals : tab === 'business' ? exportBusinesses : exportPayments}
              className="flex items-center gap-1.5 text-sm font-semibold px-3 py-2 rounded-full border border-gray-200 text-black hover:bg-gray-50 whitespace-nowrap"
            >
              <Download size={14} /> Export
            </button>
          </div>
        </div>

        {/* Individual Pro table */}
        {tab === 'individual' && (
          filteredIndividuals.length === 0 ? (
            <div className="text-center py-10">
              <Users size={40} className="text-blue-400 mx-auto mb-3" />
              <p className="font-bold text-black">No Pro subscribers yet</p>
              <p className="text-sm text-gray-600 mt-1 mb-4">Individual users with Pro subscriptions will appear here.</p>
              <button onClick={() => setGrantMode('individual')} className="bg-blue-600 text-white px-4 py-2.5 rounded-full font-semibold text-sm inline-flex items-center gap-2 hover:bg-blue-700">
                <UserPlus size={15} /> Add Individual Pro Subscriber
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-black border-b border-gray-100">
                    <th className="p-3 font-semibold">#</th>
                    <th className="p-3 font-semibold">User</th>
                    <th className="p-3 font-semibold">Email</th>
                    <th className="p-3 font-semibold">Status</th>
                    <th className="p-3 font-semibold">Start Date</th>
                    <th className="p-3 font-semibold">Expires</th>
                    <th className="p-3 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredIndividuals.map((u, i) => (
                    <tr key={u.id} className="border-b border-gray-50 last:border-0">
                      <td className="p-3 text-gray-600">{i + 1}</td>
                      <td className="p-3">
                        <p className="font-medium text-black">{u.displayName || u.username}</p>
                        <p className="text-xs text-gray-600">@{u.username}</p>
                      </td>
                      <td className="p-3 text-black">{u.email}</td>
                      <td className="p-3"><span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${u.active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>{u.active ? 'Active' : 'Expired'}</span></td>
                      <td className="p-3 text-black whitespace-nowrap">{u.startDate ? new Date(u.startDate).toLocaleDateString() : '—'}</td>
                      <td className="p-3 text-black whitespace-nowrap">{u.planExpiresAt ? new Date(u.planExpiresAt).toLocaleDateString() : '—'}</td>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <button disabled={busyId === u.id} onClick={() => handleExtendIndividual(u)} className="text-xs font-semibold px-3 py-1.5 rounded-full border border-gray-200 text-black hover:bg-gray-50 disabled:opacity-50 whitespace-nowrap">Extend</button>
                          <button disabled={busyId === u.id} onClick={() => handleRevokeIndividual(u)} className="text-xs font-semibold px-3 py-1.5 rounded-full bg-red-50 text-red-600 hover:bg-red-100 disabled:opacity-50 whitespace-nowrap">Revoke</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        )}

        {/* Business table */}
        {tab === 'business' && (
          filteredBusinesses.length === 0 ? (
            <div className="text-center py-10">
              <Building2 size={40} className="text-green-400 mx-auto mb-3" />
              <p className="font-bold text-black">No paid business plans yet</p>
              <p className="text-sm text-gray-600 mt-1 mb-4">Business subscriptions will appear here.</p>
              <button onClick={() => setGrantMode('business')} className="bg-green-600 text-white px-4 py-2.5 rounded-full font-semibold text-sm inline-flex items-center gap-2 hover:bg-green-700">
                <Building2 size={15} /> Add Business Subscription
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-black border-b border-gray-100">
                    <th className="p-3 font-semibold">#</th>
                    <th className="p-3 font-semibold">Business</th>
                    <th className="p-3 font-semibold">Email</th>
                    <th className="p-3 font-semibold">Plan</th>
                    <th className="p-3 font-semibold">Status</th>
                    <th className="p-3 font-semibold">Start Date</th>
                    <th className="p-3 font-semibold">Expires</th>
                    <th className="p-3 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBusinesses.map((b, i) => (
                    <tr key={b.id} className="border-b border-gray-50 last:border-0">
                      <td className="p-3 text-gray-600">{i + 1}</td>
                      <td className="p-3 font-medium text-black">{b.name}</td>
                      <td className="p-3 text-black">{b.email || '—'}</td>
                      <td className="p-3 text-black">{BUSINESS_PLANS[b.plan as BusinessPlanName]?.label || b.plan}</td>
                      <td className="p-3"><span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${b.active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>{b.active ? 'Active' : 'Expired'}</span></td>
                      <td className="p-3 text-black whitespace-nowrap">{b.startDate ? new Date(b.startDate).toLocaleDateString() : '—'}</td>
                      <td className="p-3 text-black whitespace-nowrap">{b.planExpiresAt ? new Date(b.planExpiresAt).toLocaleDateString() : '—'}</td>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <button disabled={busyId === b.id} onClick={() => handleExtendBusiness(b)} className="text-xs font-semibold px-3 py-1.5 rounded-full border border-gray-200 text-black hover:bg-gray-50 disabled:opacity-50 whitespace-nowrap">Extend</button>
                          <button disabled={busyId === b.id} onClick={() => handleRevokeBusiness(b)} className="text-xs font-semibold px-3 py-1.5 rounded-full bg-red-50 text-red-600 hover:bg-red-100 disabled:opacity-50 whitespace-nowrap">Revoke</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        )}

        {/* Payment history table */}
        {tab === 'history' && (
          filteredPayments.length === 0 ? (
            <div className="text-center py-10">
              <Wallet size={40} className="text-amber-400 mx-auto mb-3" />
              <p className="font-bold text-black">No subscription payments yet</p>
              <p className="text-sm text-gray-600 mt-1">Payment attempts for Pro and business plans will appear here.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-black border-b border-gray-100">
                    <th className="p-3 font-semibold">Reference</th>
                    <th className="p-3 font-semibold">For</th>
                    <th className="p-3 font-semibold">Plan</th>
                    <th className="p-3 font-semibold">Amount</th>
                    <th className="p-3 font-semibold">Status</th>
                    <th className="p-3 font-semibold">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPayments.map((p) => (
                    <tr key={p.id} className="border-b border-gray-50 last:border-0">
                      <td className="p-3 font-mono text-xs text-black">{p.reference}</td>
                      <td className="p-3 text-black">{p.user ? `@${p.user.username}` : p.business?.name || '—'}</td>
                      <td className="p-3 capitalize text-black">{p.plan}</td>
                      <td className="p-3 font-semibold text-black whitespace-nowrap">₦{p.amount.toLocaleString()}</td>
                      <td className="p-3"><span className={`text-xs font-semibold px-2.5 py-1 rounded-full capitalize ${p.status === 'success' ? 'bg-green-100 text-green-700' : p.status === 'failed' ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-700'}`}>{p.status}</span></td>
                      <td className="p-3 text-black whitespace-nowrap">{new Date(p.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        )}
      </div>

      {grantMode && (
        <GrantModal
          mode={grantMode}
          individuals={individuals}
          businesses={businesses}
          onClose={() => setGrantMode(null)}
          onGranted={load}
        />
      )}
    </div>
  )
}
