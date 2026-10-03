'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Truck } from 'lucide-react'
import { ShopHeader } from '@/components/ShopHeader'

export default function TrackOrderPage() {
  const router = useRouter()
  const [orderNumber, setOrderNumber] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const value = orderNumber.trim()
    if (!value) return

    setLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/orders/${encodeURIComponent(value)}`)
      if (!res.ok) {
        setError("We couldn't find an order with that number.")
        setLoading(false)
        return
      }
      router.push(`/orders/${encodeURIComponent(value)}`)
    } catch {
      setError('Something went wrong. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <ShopHeader />

      <div className="max-w-md mx-auto pt-20 pb-24 px-4 sm:px-6 text-center">
        <span className="inline-flex w-14 h-14 rounded-full bg-black text-white items-center justify-center mb-5">
          <Truck size={24} />
        </span>
        <h1 className="text-2xl font-bold text-[#111111] mb-2">Track Your Order</h1>
        <p className="text-gray-500 text-sm mb-8">Enter your order number to see its current status.</p>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm p-6 space-y-4 text-left">
          <div>
            <label htmlFor="orderNumber" className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
              Order Number
            </label>
            <input
              id="orderNumber"
              required
              value={orderNumber}
              onChange={(e) => setOrderNumber(e.target.value)}
              placeholder="e.g. TC-00123"
              className="w-full px-4 py-3 rounded-lg bg-gray-100 outline-none focus:ring-2 focus:ring-[#22C55E] transition-shadow"
            />
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#22C55E] text-white py-3 rounded-full font-semibold hover:bg-[#1ea34c] transition-colors disabled:opacity-60"
          >
            {loading ? 'Searching...' : 'Track Order'}
          </button>
        </form>
      </div>
    </div>
  )
}
