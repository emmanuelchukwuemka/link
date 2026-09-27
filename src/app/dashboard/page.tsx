'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  Pencil, ExternalLink, Eye, Smartphone, Link as LinkIcon, MessageSquareText,
  CreditCard, ShoppingBag, BarChart3, Crown, TrendingUp, TrendingDown,
  ArrowUpRight, Clock, Package,
} from 'lucide-react'

type Me = {
  username: string
  displayName: string | null
  bio: string | null
  avatarUrl: string | null
  accountType: string
  plan: string
  planExpiresAt: string | null
  links: { id: string; title: string; url: string }[]
  socialLinks: { id: string; platform: string }[]
}

type Overview = {
  stats: {
    views: { value: number; change: number }
    nfcTaps: { value: number; change: number }
    linkClicks: { value: number; change: number }
    leads: { value: number; change: number }
  }
  series: {
    views: number[]
    nfcTaps: number[]
    linkClicks: number[]
    leads: number[]
    dates: string[]
  }
  topLinks: { label: string; value: number }[]
  activity: { id: string; label: string; createdAt: string }[]
  orders: { id: string; orderNumber: string; status: string; createdAt: string; items: { name: string; quantity: number }[] }[]
  cardCount: number
}

const STATUS_COLORS: Record<string, string> = {
  order_placed: 'bg-gray-100 text-gray-600',
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

function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diffMs / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  return new Date(iso).toLocaleDateString()
}

function Sparkline({ data, positive }: { data: number[]; positive: boolean }) {
  const max = Math.max(...data, 1)
  const points = data
    .map((v, i) => `${(i / (data.length - 1)) * 100},${28 - (v / max) * 24}`)
    .join(' ')
  return (
    <svg viewBox="0 0 100 28" className="w-full h-7" preserveAspectRatio="none">
      <polyline
        points={points}
        fill="none"
        stroke={positive ? '#16a34a' : '#dc2626'}
        strokeWidth="2"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  )
}

function StatCard({
  label, value, change, series, icon: Icon,
}: {
  label: string
  value: number
  change: number
  series: number[]
  icon: React.ElementType
}) {
  const positive = change >= 0
  return (
    <div className="bg-white p-5 rounded-3xl shadow-sm">
      <div className="flex items-start justify-between mb-3">
        <span className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
          <Icon size={18} className="text-black" />
        </span>
        <span className={`text-xs font-semibold flex items-center gap-1 ${positive ? 'text-green-600' : 'text-red-500'}`}>
          {positive ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
          {Math.abs(change)}%
        </span>
      </div>
      <p className="text-2xl font-bold leading-tight text-black">{value.toLocaleString()}</p>
      <p className="text-sm text-gray-700 mb-3">{label}</p>
      <Sparkline data={series} positive={positive} />
    </div>
  )
}

export default function DashboardOverviewPage() {
  const [me, setMe] = useState<Me | null>(null)
  const [data, setData] = useState<Overview | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch('/api/auth/me').then((res) => res.json()),
      fetch('/api/dashboard/overview').then((res) => res.json()),
    ]).then(([meData, overviewData]) => {
      if (meData.user) setMe(meData.user)
      setData(overviewData)
      setLoading(false)
    })
  }, [])

  if (loading || !me || !data) return <div className="text-center py-20 text-black">Loading...</div>

  const isPro = me.plan === 'pro' && (!me.planExpiresAt || new Date(me.planExpiresAt) > new Date())
  const profileUrl = `/${me.username}`
  const maxTopLink = Math.max(...data.topLinks.map((l) => l.value), 1)

  const quickActions = [
    { name: 'Edit Profile', href: '/dashboard/appearance', icon: Pencil },
    { name: 'Order NFC Card', href: '/dashboard/cards', icon: CreditCard },
    { name: 'Add Product', href: '/dashboard/store', icon: ShoppingBag },
    { name: 'Manage Links', href: '/dashboard/links', icon: LinkIcon },
    { name: 'View Analytics', href: '/dashboard/analytics', icon: BarChart3 },
    { name: isPro ? 'Manage Plan' : 'Upgrade Plan', href: '/dashboard/subscription', icon: Crown },
  ]

  return (
    <div className="space-y-6">
      {/* Welcome banner */}
      <div className="relative bg-[#0A0A0A] rounded-3xl overflow-hidden px-6 sm:px-10 py-10 sm:py-12">
        <div className="relative z-10 max-w-lg">
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">
            Welcome back, {me.displayName || me.username} 👋
          </h1>
          <p className="text-white/60 mb-6">
            Here&apos;s what&apos;s happening with your digital profile today.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link href="/dashboard/appearance" className="bg-white text-black px-5 py-2.5 rounded-full font-semibold text-sm hover:bg-white/90 transition-colors">
              Edit My Profile
            </Link>
            <a href={profileUrl} target="_blank" rel="noopener noreferrer" className="border border-white/20 text-white px-5 py-2.5 rounded-full font-semibold text-sm hover:bg-white/10 transition-colors inline-flex items-center gap-1.5">
              View Public Profile <ExternalLink size={14} />
            </a>
          </div>
        </div>
        <div className="hidden md:block absolute right-6 top-1/2 -translate-y-1/2 w-40 h-40 opacity-90">
          <Image src="/phone-mock.png" alt="" fill className="object-contain" />
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Profile Views" value={data.stats.views.value} change={data.stats.views.change} series={data.series.views} icon={Eye} />
        <StatCard label="NFC Taps" value={data.stats.nfcTaps.value} change={data.stats.nfcTaps.change} series={data.series.nfcTaps} icon={Smartphone} />
        <StatCard label="Link Clicks" value={data.stats.linkClicks.value} change={data.stats.linkClicks.change} series={data.series.linkClicks} icon={LinkIcon} />
        <StatCard label="Leads" value={data.stats.leads.value} change={data.stats.leads.change} series={data.series.leads} icon={MessageSquareText} />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Quick actions */}
          <div className="bg-white p-5 rounded-3xl shadow-sm">
            <h2 className="font-bold mb-4">Quick Actions</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {quickActions.map(({ name, href, icon: Icon }) => (
                <Link key={name} href={href} className="flex flex-col items-center text-center gap-2 p-4 rounded-2xl border border-gray-100 hover:border-gray-200 hover:bg-gray-50 transition-colors">
                  <span className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                    <Icon size={18} />
                  </span>
                  <span className="text-xs font-semibold">{name}</span>
                </Link>
              ))}
            </div>
          </div>

          {/* Performance chart */}
          <div className="bg-white p-5 rounded-3xl shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold">Profile Performance</h2>
              <span className="text-xs font-semibold text-black bg-gray-100 px-3 py-1.5 rounded-full">Last 7 Days</span>
            </div>
            <PerformanceChart series={data.series} />
          </div>

          {/* Recent activity */}
          <div className="bg-white p-5 rounded-3xl shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold">Recent Activity</h2>
              <Link href="/dashboard/analytics" className="text-xs font-semibold hover:underline">View all</Link>
            </div>
            {data.activity.length === 0 ? (
              <p className="text-sm text-gray-600 py-6 text-center">No activity yet. Share your profile to get started.</p>
            ) : (
              <div className="space-y-3">
                {data.activity.map((a) => (
                  <div key={a.id} className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
                      <Clock size={14} className="text-black" />
                    </span>
                    <p className="text-sm flex-1 text-black">{a.label}</p>
                    <span className="text-xs text-gray-600 shrink-0">{timeAgo(a.createdAt)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-6">
          {/* Profile preview */}
          <div className="bg-white p-5 rounded-3xl shadow-sm">
            <h2 className="font-bold mb-4">Profile Preview</h2>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-14 h-14 rounded-full bg-black overflow-hidden flex items-center justify-center text-lg font-bold text-white shrink-0">
                {me.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={me.avatarUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  (me.displayName || me.username).charAt(0).toUpperCase()
                )}
              </div>
              <div className="min-w-0">
                <p className="font-semibold truncate text-black">{me.displayName || me.username}</p>
                <p className="text-sm text-gray-600 truncate">@{me.username}</p>
              </div>
            </div>
            {me.bio && <p className="text-sm text-gray-700 mb-4 line-clamp-2">{me.bio}</p>}
            <div className="flex items-center gap-2 text-xs text-gray-700 mb-4">
              <LinkIcon size={13} /> {me.links.length} links &middot; <Package size={13} /> {data.cardCount} card{data.cardCount === 1 ? '' : 's'}
            </div>
            <a href={profileUrl} target="_blank" rel="noopener noreferrer" className="w-full flex items-center justify-center gap-1.5 bg-gray-100 hover:bg-gray-200 transition-colors rounded-full py-2.5 text-sm font-semibold text-black">
              Preview Profile <ArrowUpRight size={14} />
            </a>
          </div>

          {/* Recent orders */}
          <div className="bg-white p-5 rounded-3xl shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold">Recent Orders</h2>
              <Link href="/dashboard/orders" className="text-xs font-semibold hover:underline">View all</Link>
            </div>
            {data.orders.length === 0 ? (
              <p className="text-sm text-gray-600 py-6 text-center">No orders yet.</p>
            ) : (
              <div className="space-y-3">
                {data.orders.map((o) => (
                  <Link key={o.id} href={`/orders/${o.orderNumber}`} className="block p-3 rounded-2xl border border-gray-100 hover:border-gray-200 transition-colors">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-semibold text-black">#{o.orderNumber}</span>
                      <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full capitalize ${STATUS_COLORS[o.status] || 'bg-gray-100 text-gray-700'}`}>
                        {o.status.replace(/_/g, ' ')}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 truncate">
                      {o.items.map((i) => `${i.quantity}× ${i.name}`).join(', ')}
                    </p>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Top links */}
          <div className="bg-white p-5 rounded-3xl shadow-sm">
            <h2 className="font-bold mb-4">Top Links</h2>
            {data.topLinks.length === 0 ? (
              <p className="text-sm text-gray-600 py-6 text-center">No clicks yet.</p>
            ) : (
              <div className="space-y-3">
                {data.topLinks.map((l) => (
                  <div key={l.label}>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="font-medium truncate text-black">{l.label}</span>
                      <span className="text-black font-semibold shrink-0">{l.value}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
                      <div className="h-full bg-black rounded-full" style={{ width: `${(l.value / maxTopLink) * 100}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function PerformanceChart({ series }: { series: Overview['series'] }) {
  const combined = series.dates.map((_, i) =>
    series.views[i] + series.nfcTaps[i] + series.linkClicks[i] + series.leads[i]
  )
  const max = Math.max(...combined, 1)
  const w = 100
  const h = 40
  const points = combined.map((v, i) => {
    const x = (i / (combined.length - 1)) * w
    const y = h - (v / max) * (h - 4) - 2
    return `${x},${y}`
  })
  const linePath = `M${points.join(' L')}`
  const areaPath = `${linePath} L${w},${h} L0,${h} Z`

  return (
    <div>
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-40" preserveAspectRatio="none">
        <defs>
          <linearGradient id="perfGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#000000" stopOpacity="0.12" />
            <stop offset="100%" stopColor="#000000" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={areaPath} fill="url(#perfGradient)" stroke="none" />
        <path d={linePath} fill="none" stroke="#000000" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
      </svg>
      <div className="flex justify-between text-xs text-gray-600 mt-2">
        {series.dates.map((d) => (
          <span key={d}>{new Date(d).toLocaleDateString(undefined, { weekday: 'short' })}</span>
        ))}
      </div>
    </div>
  )
}
