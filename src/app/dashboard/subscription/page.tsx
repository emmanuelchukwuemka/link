'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { Crown, Check } from 'lucide-react'
import { PRO_PLAN_PRICE_NAIRA } from '@/lib/subscription'

const PRO_FEATURES = [
  'Advanced customization & templates',
  'Custom backgrounds & button styles',
  'More fonts',
  'Lead capture form',
  'Advanced analytics',
  'Product & service sections',
  'Portfolio & testimonials',
  'Remove TapConnect branding',
]

function SubscriptionInner() {
  const searchParams = useSearchParams()
  const [plan, setPlan] = useState('free')
  const [expiresAt, setExpiresAt] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [upgrading, setUpgrading] = useState(false)
  const [devMode, setDevMode] = useState(false)

  const load = async () => {
    const res = await fetch('/api/auth/me')
    const data = await res.json()
    if (data.user) {
      setPlan(data.user.plan)
      setExpiresAt(data.user.planExpiresAt)
    }
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const handleUpgrade = async () => {
    setUpgrading(true)
    const res = await fetch('/api/subscriptions/checkout', { method: 'POST' })
    const data = await res.json()
    if (data.authorizationUrl) {
      window.location.href = data.authorizationUrl
    } else if (data.devMode) {
      setDevMode(true)
    }
    setUpgrading(false)
  }

  const handleSimulate = async () => {
    setUpgrading(true)
    await fetch('/api/subscriptions/simulate', { method: 'POST' })
    await load()
    setUpgrading(false)
  }

  const isPro = plan === 'pro' && (!expiresAt || new Date(expiresAt) > new Date())

  if (loading) return <div className="text-center py-20 text-black">Loading...</div>

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold">Subscription</h1>

      {searchParams.get('upgraded') === '1' && (
        <div className="bg-green-50 text-green-700 p-4 rounded-lg text-sm">You&apos;re now on Pro. Welcome!</div>
      )}
      {searchParams.get('failed') === '1' && (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg text-sm">Payment could not be verified. Please try again.</div>
      )}

      <div className="bg-white rounded-3xl p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Crown size={22} className={isPro ? 'text-amber-500' : 'text-gray-300'} />
          <h2 className="text-xl font-bold capitalize">{isPro ? 'Pro plan' : 'Free plan'}</h2>
        </div>

        {isPro ? (
          <p className="text-gray-600">
            {expiresAt ? `Renews/expires on ${new Date(expiresAt).toLocaleDateString()}.` : 'Active.'}
          </p>
        ) : (
          <>
            <p className="text-gray-600 mb-4">
              &#8358;{PRO_PLAN_PRICE_NAIRA.toLocaleString()} / year. Your basic profile, NFC and QR code stay free and active forever &mdash; Pro just unlocks more.
            </p>
            <ul className="space-y-2 mb-6">
              {PRO_FEATURES.map((f) => (
                <li key={f} className="flex items-center gap-2 text-sm text-gray-700">
                  <Check size={16} className="text-green-500 shrink-0" /> {f}
                </li>
              ))}
            </ul>

            {devMode ? (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                <p className="text-sm text-amber-800 mb-3">Paystack isn&apos;t configured yet (dev mode). Simulate an upgrade to test Pro features.</p>
                <button onClick={handleSimulate} disabled={upgrading} className="bg-amber-600 text-white px-5 py-2.5 rounded-full font-semibold hover:bg-amber-700 disabled:opacity-60">
                  {upgrading ? 'Simulating...' : 'Simulate Upgrade'}
                </button>
              </div>
            ) : (
              <button onClick={handleUpgrade} disabled={upgrading} className="bg-black text-white px-6 py-3 rounded-full font-semibold hover:bg-gray-800 disabled:opacity-60">
                {upgrading ? 'Redirecting...' : 'Upgrade to Pro'}
              </button>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default function SubscriptionPage() {
  return (
    <Suspense fallback={null}>
      <SubscriptionInner />
    </Suspense>
  )
}
