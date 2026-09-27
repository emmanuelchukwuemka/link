'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  BarChart3, ChevronRight, Calendar, Download, Users, Building2, Crown, MessageSquareText,
  LayoutGrid, TrendingUp, TrendingDown, Wallet,
} from 'lucide-react'

type Stat = { value: number; change: number; newThisPeriod: number }
type Source = { label: string; value: number; color: string }
type PlanRow = { label: string; value: number }

type Analytics = {
  range: { from: string; to: string }
  stats: { totalUsers: Stat; businessUsers: Stat; activeSubscriptions: Stat; totalLeads: Stat }
  dates: string[]
  newUsersSeries: number[]
  leadsSeries: number[]
  subscriptionsSeries: number[]
  revenueSeries: number[]
  topLeadSources: Source[]
  subscriptionPlans: PlanRow[]
  revenueBreakdown: { productSales: number; subscriptions: number; total: number }
  growth: { individuals: number[]; businesses: number[]; employees: number[]; cumulativeTotal: number[] }
}

type Tab = 'overview' | 'revenue' | 'growth'

function toISODate(d: Date): string {
  return d.toISOString().slice(0, 10)
}
function firstOfMonth(): string {
  const n = new Date()
  return toISODate(new Date(n.getFullYear(), n.getMonth(), 1))
}
function lastOfMonth(): string {
  const n = new Date()
  return toISODate(new Date(n.getFullYear(), n.getMonth() + 1, 0))
}
function formatShort(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

function LineChart({ dates, series, color }: { dates: string[]; series: number[]; color: string }) {
  const max = Math.max(...series, 1)
  const w = 300, h = 130
  const points = series.map((v, i) => `${(i / Math.max(series.length - 1, 1)) * w},${h - (v / max) * (h - 10) - 5}`)
  const line = `M${points.join(' L')}`
  const area = `${line} L${w},${h} L0,${h} Z`
  const step = Math.max(Math.floor(dates.length / 6), 1)
  return (
    <div>
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-36" preserveAspectRatio="none">
        <defs>
          <linearGradient id={`grad-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.2" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={area} fill={`url(#grad-${color.replace('#', '')})`} stroke="none" />
        <path d={line} fill="none" stroke={color} strokeWidth="2" vectorEffect="non-scaling-stroke" />
        {series.map((v, i) => {
          if (i % Math.max(Math.floor(series.length / 10), 1) !== 0) return null
          const x = (i / Math.max(series.length - 1, 1)) * w
          const y = h - (v / max) * (h - 10) - 5
          return <circle key={i} cx={x} cy={y} r="2.5" fill={color} />
        })}
      </svg>
      <div className="flex justify-between text-[11px] text-gray-600 mt-1">
        {dates.filter((_, i) => i % step === 0).map((d) => <span key={d}>{formatShort(d)}</span>)}
      </div>
    </div>
  )
}

function BarChartSingle({ dates, series, color }: { dates: string[]; series: number[]; color: string }) {
  const max = Math.max(...series, 1)
  const step = Math.max(Math.floor(dates.length / 6), 1)
  return (
    <div>
      <div className="flex items-end gap-[2px] h-36">
        {series.map((v, i) => (
          <div key={i} className="flex-1 rounded-t-sm" style={{ height: `${(v / max) * 100}%`, backgroundColor: color, minHeight: v > 0 ? 2 : 0 }} />
        ))}
      </div>
      <div className="flex justify-between text-[11px] text-gray-600 mt-1">
        {dates.filter((_, i) => i % step === 0).map((d) => <span key={d}>{formatShort(d)}</span>)}
      </div>
    </div>
  )
}

function StackedGrowthChart({ dates, individuals, businesses, employees }: { dates: string[]; individuals: number[]; businesses: number[]; employees: number[] }) {
  const totals = dates.map((_, i) => individuals[i] + businesses[i] + employees[i])
  const max = Math.max(...totals, 1)
  const step = Math.max(Math.floor(dates.length / 8), 1)
  return (
    <div>
      <div className="flex items-center gap-4 mb-3 text-xs font-medium text-gray-700 flex-wrap">
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-blue-500" /> Individuals</span>
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-green-500" /> Businesses</span>
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-purple-500" /> Employees</span>
      </div>
      <div className="flex items-end gap-[2px] h-40">
        {dates.map((d, i) => {
          const h = 150
          const iH = max ? (individuals[i] / max) * h : 0
          const bH = max ? (businesses[i] / max) * h : 0
          const eH = max ? (employees[i] / max) * h : 0
          return (
            <div key={d} className="flex-1 flex flex-col-reverse" style={{ height: h }}>
              <div style={{ height: iH }} className="w-full bg-blue-500" />
              <div style={{ height: bH }} className="w-full bg-green-500" />
              <div style={{ height: eH }} className="w-full bg-purple-500" />
            </div>
          )
        })}
      </div>
      <div className="flex justify-between text-[11px] text-gray-600 mt-1">
        {dates.filter((_, i) => i % step === 0).map((d) => <span key={d}>{formatShort(d)}</span>)}
      </div>
    </div>
  )
}

function Donut({ segments, total }: { segments: Source[]; total: number }) {
  const size = 120, stroke = 16, r = (size - stroke) / 2, c = 2 * Math.PI * r
  const arcs = segments.reduce<Array<Source & { dash: number; offset: number }>>((acc, s) => {
    const dash = (total > 0 ? s.value / total : 0) * c
    const offset = acc.length > 0 ? acc[acc.length - 1].offset + acc[acc.length - 1].dash : 0
    return [...acc, { ...s, dash, offset }]
  }, [])
  return (
    <div className="flex items-center gap-5">
      <div className="relative shrink-0" style={{ width: size, height: size }}>
        <svg viewBox={`0 0 ${size} ${size}`} className="w-full h-full -rotate-90">
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#f3f4f6" strokeWidth={stroke} />
          {arcs.map((s) => (
            <circle key={s.label} cx={size / 2} cy={size / 2} r={r} fill="none" stroke={s.color} strokeWidth={stroke}
              strokeDasharray={`${s.dash} ${c - s.dash}`} strokeDashoffset={-s.offset} strokeLinecap="butt" />
          ))}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xl font-bold text-black">{total.toLocaleString()}</span>
          <span className="text-[10px] text-gray-600">Total Leads</span>
        </div>
      </div>
      <div className="space-y-1.5 min-w-0">
        {segments.map((s) => (
          <div key={s.label} className="flex items-center gap-2 text-xs">
            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: s.color }} />
            <span className="text-gray-700 truncate">{s.label}</span>
            <span className="font-semibold text-black ml-auto">{total > 0 ? Math.round((s.value / total) * 100) : 0}%</span>
          </div>
        ))}
        {segments.length === 0 && <p className="text-xs text-gray-500">No leads in this period.</p>}
      </div>
    </div>
  )
}

const PLAN_BAR_COLORS = ['bg-blue-500', 'bg-green-500', 'bg-amber-500', 'bg-purple-500', 'bg-indigo-500', 'bg-pink-500']

export default function AdminAnalyticsPage() {
  const [data, setData] = useState<Analytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<Tab>('overview')
  const [from, setFrom] = useState(firstOfMonth())
  const [to, setTo] = useState(lastOfMonth())
  const [showRange, setShowRange] = useState(false)

  useEffect(() => {
    setLoading(true)
    fetch(`/api/admin/analytics?from=${from}&to=${to}`).then((r) => r.json()).then((d) => { setData(d); setLoading(false) })
  }, [from, to])

  const handleExport = () => {
    if (!data) return
    const rows = [
      ['Metric', 'Value', 'Change %', `New in ${from} to ${to}`],
      ['Total Users', data.stats.totalUsers.value, data.stats.totalUsers.change, data.stats.totalUsers.newThisPeriod],
      ['Business Users', data.stats.businessUsers.value, data.stats.businessUsers.change, data.stats.businessUsers.newThisPeriod],
      ['Active Subscriptions', data.stats.activeSubscriptions.value, data.stats.activeSubscriptions.change, data.stats.activeSubscriptions.newThisPeriod],
      ['Total Leads', data.stats.totalLeads.value, data.stats.totalLeads.change, data.stats.totalLeads.newThisPeriod],
      [],
      ['Revenue Breakdown', '', '', ''],
      ['Product Sales', data.revenueBreakdown.productSales, '', ''],
      ['Subscriptions', data.revenueBreakdown.subscriptions, '', ''],
      ['Total', data.revenueBreakdown.total, '', ''],
    ]
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `analytics-${from}-to-${to}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (loading || !data) return <div className="text-center py-20 text-black">Loading...</div>

  const statCards = [
    { key: 'totalUsers', label: 'Total Users', stat: data.stats.totalUsers, icon: Users, iconBg: 'bg-blue-50', iconColor: 'text-blue-600' },
    { key: 'businessUsers', label: 'Business Users', stat: data.stats.businessUsers, icon: Building2, iconBg: 'bg-green-50', iconColor: 'text-green-600' },
    { key: 'activeSubscriptions', label: 'Active Subscriptions', stat: data.stats.activeSubscriptions, icon: Crown, iconBg: 'bg-amber-50', iconColor: 'text-amber-600' },
    { key: 'totalLeads', label: 'Total Leads', stat: data.stats.totalLeads, icon: MessageSquareText, iconBg: 'bg-purple-50', iconColor: 'text-purple-600' },
  ] as const

  const maxPlan = Math.max(...data.subscriptionPlans.map((p) => p.value), 1)
  const totalPlans = data.subscriptionPlans.reduce((s, p) => s + p.value, 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-1.5 text-xs text-gray-600">
        <Link href="/admin" className="hover:text-black">Home</Link>
        <ChevronRight size={12} />
        <span className="text-black font-semibold">Analytics</span>
      </div>

      <div className="flex flex-wrap justify-between items-start gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-black flex items-center gap-2"><BarChart3 size={26} className="text-green-600" /> Analytics</h1>
          <p className="text-gray-600 text-sm mt-1">Get insights into your platform performance, users, subscriptions, leads and revenue.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <button onClick={() => setShowRange(!showRange)} className="flex items-center gap-2 text-sm font-semibold px-4 py-2.5 rounded-full bg-white shadow-sm text-black border border-gray-200">
              <Calendar size={14} /> {new Date(from).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })} - {new Date(to).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
            </button>
            {showRange && (
              <div className="absolute right-0 mt-2 bg-white rounded-xl shadow-xl border border-gray-100 p-4 z-20 flex items-center gap-2">
                <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="text-sm px-2 py-1.5 rounded-lg bg-gray-100 outline-none text-black" />
                <span className="text-gray-400 text-sm">to</span>
                <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="text-sm px-2 py-1.5 rounded-lg bg-gray-100 outline-none text-black" />
                <button onClick={() => setShowRange(false)} className="text-xs font-semibold bg-black text-white px-3 py-1.5 rounded-full ml-1">Done</button>
              </div>
            )}
          </div>
          <button onClick={handleExport} className="flex items-center gap-2 text-sm font-semibold px-4 py-2.5 rounded-full bg-white border border-gray-200 text-black hover:bg-gray-50 whitespace-nowrap">
            <Download size={14} /> Export Report
          </button>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {statCards.map(({ key, label, stat, icon: Icon, iconBg, iconColor }) => {
          const positive = stat.change >= 0
          return (
            <div key={key} className="bg-white p-5 rounded-3xl shadow-sm">
              <div className="flex items-center gap-3 mb-2">
                <span className={`w-11 h-11 rounded-full flex items-center justify-center shrink-0 ${iconBg}`}><Icon size={19} className={iconColor} /></span>
                <div className="min-w-0">
                  <p className="text-xs font-medium text-gray-700 truncate">{label}</p>
                  <p className="text-xl font-bold text-black">{stat.value.toLocaleString()}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-xs font-semibold flex items-center gap-1 ${positive ? 'text-green-600' : 'text-red-500'}`}>
                  {positive ? <TrendingUp size={12} /> : <TrendingDown size={12} />} {Math.abs(stat.change)}%
                </span>
              </div>
              <p className="text-xs text-gray-600 mt-1">+{stat.newThisPeriod} new this period</p>
            </div>
          )
        })}
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2">
        <button onClick={() => setTab('overview')} className={`flex items-center gap-2 px-4 py-2.5 rounded-full font-semibold text-sm ${tab === 'overview' ? 'bg-black text-white' : 'bg-white text-black border border-gray-200 hover:bg-gray-50'}`}>
          <LayoutGrid size={15} /> Overview
        </button>
        <Link href="/admin/users" className="flex items-center gap-2 px-4 py-2.5 rounded-full font-semibold text-sm bg-white text-black border border-gray-200 hover:bg-gray-50">
          <Users size={15} /> Users
        </Link>
        <Link href="/admin/subscriptions" className="flex items-center gap-2 px-4 py-2.5 rounded-full font-semibold text-sm bg-white text-black border border-gray-200 hover:bg-gray-50">
          <Crown size={15} /> Subscriptions
        </Link>
        <Link href="/admin/leads" className="flex items-center gap-2 px-4 py-2.5 rounded-full font-semibold text-sm bg-white text-black border border-gray-200 hover:bg-gray-50">
          <MessageSquareText size={15} /> Leads
        </Link>
        <button onClick={() => setTab('revenue')} className={`flex items-center gap-2 px-4 py-2.5 rounded-full font-semibold text-sm ${tab === 'revenue' ? 'bg-black text-white' : 'bg-white text-black border border-gray-200 hover:bg-gray-50'}`}>
          <Wallet size={15} /> Revenue
        </button>
        <button onClick={() => setTab('growth')} className={`flex items-center gap-2 px-4 py-2.5 rounded-full font-semibold text-sm ${tab === 'growth' ? 'bg-black text-white' : 'bg-white text-black border border-gray-200 hover:bg-gray-50'}`}>
          <TrendingUp size={15} /> Growth
        </button>
      </div>

      {tab === 'overview' && (
        <>
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="bg-white p-5 rounded-3xl shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold text-black flex items-center gap-2"><Users size={16} className="text-blue-600" /> New Users</h2>
              </div>
              <p className="text-2xl font-bold text-black mb-0.5">{data.stats.totalUsers.newThisPeriod.toLocaleString()}</p>
              <p className={`text-xs font-semibold mb-3 ${data.stats.totalUsers.change >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                {data.stats.totalUsers.change >= 0 ? '↑' : '↓'} {Math.abs(data.stats.totalUsers.change)}%
              </p>
              <LineChart dates={data.dates} series={data.newUsersSeries} color="#3b82f6" />
            </div>
            <div className="bg-white p-5 rounded-3xl shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold text-black flex items-center gap-2"><MessageSquareText size={16} className="text-green-600" /> Leads Overview</h2>
              </div>
              <p className="text-2xl font-bold text-black mb-0.5">{data.stats.totalLeads.newThisPeriod.toLocaleString()}</p>
              <p className={`text-xs font-semibold mb-3 ${data.stats.totalLeads.change >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                {data.stats.totalLeads.change >= 0 ? '↑' : '↓'} {Math.abs(data.stats.totalLeads.change)}%
              </p>
              <BarChartSingle dates={data.dates} series={data.leadsSeries} color="#16a34a" />
            </div>
            <div className="bg-white p-5 rounded-3xl shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold text-black flex items-center gap-2"><Crown size={16} className="text-purple-600" /> Subscriptions</h2>
              </div>
              <p className="text-2xl font-bold text-black mb-0.5">{data.stats.activeSubscriptions.newThisPeriod.toLocaleString()}</p>
              <p className={`text-xs font-semibold mb-3 ${data.stats.activeSubscriptions.change >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                {data.stats.activeSubscriptions.change >= 0 ? '↑' : '↓'} {Math.abs(data.stats.activeSubscriptions.change)}%
              </p>
              <BarChartSingle dates={data.dates} series={data.subscriptionsSeries} color="#a855f7" />
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            <div className="bg-white p-5 rounded-3xl shadow-sm">
              <h2 className="font-bold text-black mb-4">Top Lead Sources</h2>
              <Donut segments={data.topLeadSources} total={data.topLeadSources.reduce((s, x) => s + x.value, 0)} />
            </div>
            <div className="bg-white p-5 rounded-3xl shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold text-black">Subscription Plans</h2>
                <span className="text-xs text-gray-600">Total: {totalPlans} Active</span>
              </div>
              <div className="space-y-3">
                {data.subscriptionPlans.length === 0 && <p className="text-sm text-gray-500">No active subscriptions yet.</p>}
                {data.subscriptionPlans.map((p, i) => (
                  <div key={p.label}>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-black font-medium">{p.label}</span>
                      <span className="text-gray-600">{p.value} ({totalPlans > 0 ? Math.round((p.value / totalPlans) * 100) : 0}%)</span>
                    </div>
                    <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                      <div className={`h-full rounded-full ${PLAN_BAR_COLORS[i % PLAN_BAR_COLORS.length]}`} style={{ width: `${(p.value / maxPlan) * 100}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-white p-5 rounded-3xl shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold text-black flex items-center gap-2"><Wallet size={16} className="text-emerald-600" /> Revenue Overview</h2>
              </div>
              <p className="text-2xl font-bold text-black mb-0.5">₦{data.revenueBreakdown.total.toLocaleString()}</p>
              <LineChart dates={data.dates} series={data.revenueSeries} color="#16a34a" />
            </div>
          </div>
        </>
      )}

      {tab === 'revenue' && (
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white p-5 rounded-3xl shadow-sm">
            <h2 className="font-bold text-black mb-1">Revenue Over Time</h2>
            <p className="text-2xl font-bold text-black mb-4">₦{data.revenueBreakdown.total.toLocaleString()}</p>
            <LineChart dates={data.dates} series={data.revenueSeries} color="#16a34a" />
          </div>
          <div className="bg-white p-5 rounded-3xl shadow-sm space-y-4">
            <h2 className="font-bold text-black">Breakdown</h2>
            <div>
              <div className="flex justify-between text-sm mb-1"><span className="text-black font-medium">Product Sales</span><span className="text-gray-600">₦{data.revenueBreakdown.productSales.toLocaleString()}</span></div>
              <div className="h-2 rounded-full bg-gray-100 overflow-hidden"><div className="h-full bg-green-500 rounded-full" style={{ width: `${data.revenueBreakdown.total > 0 ? (data.revenueBreakdown.productSales / data.revenueBreakdown.total) * 100 : 0}%` }} /></div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1"><span className="text-black font-medium">Subscriptions</span><span className="text-gray-600">₦{data.revenueBreakdown.subscriptions.toLocaleString()}</span></div>
              <div className="h-2 rounded-full bg-gray-100 overflow-hidden"><div className="h-full bg-blue-500 rounded-full" style={{ width: `${data.revenueBreakdown.total > 0 ? (data.revenueBreakdown.subscriptions / data.revenueBreakdown.total) * 100 : 0}%` }} /></div>
            </div>
            <div className="pt-2 border-t border-gray-100">
              <div className="flex justify-between text-sm font-bold"><span className="text-black">Total</span><span className="text-black">₦{data.revenueBreakdown.total.toLocaleString()}</span></div>
            </div>
          </div>
        </div>
      )}

      {tab === 'growth' && (
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white p-5 rounded-3xl shadow-sm">
            <h2 className="font-bold text-black mb-1">User Growth by Type</h2>
            <p className="text-xs text-gray-600 mb-4">New signups per day across the selected period</p>
            <StackedGrowthChart dates={data.dates} individuals={data.growth.individuals} businesses={data.growth.businesses} employees={data.growth.employees} />
          </div>
          <div className="bg-white p-5 rounded-3xl shadow-sm">
            <h2 className="font-bold text-black mb-1">Cumulative Total Users</h2>
            <p className="text-2xl font-bold text-black mb-4">{data.stats.totalUsers.value.toLocaleString()}</p>
            <LineChart dates={data.dates} series={data.growth.cumulativeTotal} color="#111827" />
          </div>
        </div>
      )}
    </div>
  )
}
