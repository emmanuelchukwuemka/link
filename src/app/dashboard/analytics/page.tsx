'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Eye, MousePointerClick, Activity, Smartphone, QrCode,
  MessageSquareText, Phone, Mail, Globe, Share2, Package
} from 'lucide-react'

type Summary = {
  views: number
  nfcTaps: number
  qrScans: number
  clicks: number
  contactSaves: number
  whatsappClicks: number
  phoneClicks: number
  emailClicks: number
  websiteClicks: number
  socialClicks: number
  productViews: number
  addToCart: number
  leads: number
  ctr: number
}

const EMPTY: Summary = {
  views: 0, nfcTaps: 0, qrScans: 0, clicks: 0, contactSaves: 0,
  whatsappClicks: 0, phoneClicks: 0, emailClicks: 0, websiteClicks: 0,
  socialClicks: 0, productViews: 0, addToCart: 0, leads: 0, ctr: 0,
}

export default function AnalyticsPage() {
  const [range, setRange] = useState('lifetime')
  const [stats, setStats] = useState<Summary>(EMPTY)
  const [loading, setLoading] = useState(true)

  const fetchStats = useCallback(async (r: string) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/analytics/summary?range=${r}`)
      const data = await res.json()
      if (res.ok) setStats(data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchStats(range)
  }, [range, fetchStats])

  const cards = [
    { label: 'Profile Views', value: stats.views, icon: Eye },
    { label: 'NFC Taps', value: stats.nfcTaps, icon: Smartphone },
    { label: 'QR Scans', value: stats.qrScans, icon: QrCode },
    { label: 'Total Clicks', value: stats.clicks, icon: MousePointerClick },
    { label: 'CTR', value: `${stats.ctr}%`, icon: Activity },
    { label: 'Leads', value: stats.leads, icon: MessageSquareText },
  ]

  const breakdown = [
    { label: 'Contact Saves', value: stats.contactSaves, icon: MessageSquareText },
    { label: 'WhatsApp Clicks', value: stats.whatsappClicks, icon: MessageSquareText },
    { label: 'Phone Clicks', value: stats.phoneClicks, icon: Phone },
    { label: 'Email Clicks', value: stats.emailClicks, icon: Mail },
    { label: 'Website Clicks', value: stats.websiteClicks, icon: Globe },
    { label: 'Social Clicks', value: stats.socialClicks, icon: Share2 },
    { label: 'Product Views', value: stats.productViews, icon: Package },
    { label: 'Add to Cart', value: stats.addToCart, icon: Package },
  ]

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <h1 className="text-2xl font-bold">Analytics</h1>
        <select
          value={range}
          onChange={(e) => setRange(e.target.value)}
          className="bg-white border border-gray-200 rounded-lg px-4 py-2 font-medium"
        >
          <option value="lifetime">Lifetime</option>
          <option value="30d">Last 30 Days</option>
          <option value="7d">Last 7 Days</option>
          <option value="today">Today</option>
        </select>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {cards.map(({ label, value, icon: Icon }) => (
          <div key={label} className="bg-white p-6 rounded-3xl shadow-sm">
            <div className="flex items-center gap-2 text-black font-medium mb-4">
              <Icon size={20} />
              {label}
            </div>
            <div className="text-4xl font-bold text-gray-900">{loading ? '—' : value.toLocaleString()}</div>
          </div>
        ))}
      </div>

      <div className="bg-white p-6 rounded-3xl shadow-sm">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Engagement Breakdown</h3>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {breakdown.map(({ label, value, icon: Icon }) => (
            <div key={label} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50">
              <Icon size={18} className="text-gray-400" />
              <div>
                <div className="text-lg font-bold text-gray-900">{loading ? '—' : value.toLocaleString()}</div>
                <div className="text-xs text-black">{label}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {!loading && stats.views === 0 && (
        <div className="bg-white p-8 rounded-3xl shadow-sm text-center text-black">
          No activity recorded yet for this period. Share your profile link, QR code, or tap your TapConnect card to start generating data.
        </div>
      )}
    </div>
  )
}
