'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { getCart, cartTotal, clearCart, type CartItem } from '@/lib/cart'
import { ShopHeader } from '@/components/ShopHeader'

type DeliveryZone = { id: string; name: string; fee: number }

export default function CheckoutPage() {
  const router = useRouter()
  const [items, setItems] = useState<CartItem[]>([])
  const [zones, setZones] = useState<DeliveryZone[]>([])
  const [form, setForm] = useState({
    customerName: '', customerEmail: '', customerPhone: '',
    state: '', city: '', address: '', deliveryInstructions: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    setItems(getCart())
    fetch('/api/delivery-zones').then(res => res.json()).then(data => {
      if (data.zones) setZones(data.zones)
    })
    fetch('/api/auth/me').then(res => res.json()).then(data => {
      if (data.user) {
        setForm((f) => ({
          ...f,
          customerName: f.customerName || data.user.displayName || '',
          customerEmail: f.customerEmail || data.user.email || '',
          customerPhone: f.customerPhone || data.user.phone || '',
        }))
      }
    }).catch(() => {})
  }, [])

  const subtotal = cartTotal(items)
  const zone = zones.find(z => z.name.toLowerCase() === form.city.trim().toLowerCase())
  const deliveryFee = zone?.fee ?? zones.find(z => z.name === 'Other')?.fee ?? 0
  const total = subtotal + deliveryFee

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: items.map(i => ({
            productId: i.productId, color: i.color, customization: i.customization, quantity: i.quantity,
            customizationNotes: i.customizationNotes, customizationFileUrl: i.customizationFileUrl,
          })),
          ...form,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Could not place order')

      clearCart()

      if (data.authorizationUrl) {
        window.location.href = data.authorizationUrl
      } else {
        router.push(`/orders/${data.order.orderNumber}`)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setLoading(false)
    }
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-[#E8E5E0]">
        <ShopHeader />
        <div className="pt-24 px-4 text-center">
          <h1 className="text-2xl font-bold text-[#181818] mb-3">Your cart is empty</h1>
          <div className="flex items-center justify-center gap-4 text-sm">
            <Link href="/" className="text-[#66635F] font-semibold hover:text-black hover:underline">Go home</Link>
            <span className="text-[#D4D0C9]">&middot;</span>
            <Link href="/marketplace" className="text-black font-semibold hover:underline">Browse the marketplace</Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#E8E5E0]">
      <ShopHeader />
      <div className="max-w-3xl mx-auto pt-16 pb-20 px-4 grid md:grid-cols-[1fr_320px] gap-8 items-start">
        <form onSubmit={handleSubmit} className="bg-white rounded-3xl p-6 shadow-sm space-y-4 min-w-0">
          <h1 className="text-2xl font-bold mb-2">Checkout</h1>

          {error && <div className="bg-red-50 text-red-500 p-3 rounded-lg text-sm">{error}</div>}

          <div className="grid sm:grid-cols-2 gap-3">
            <input required placeholder="Full name" value={form.customerName} onChange={(e) => setForm({ ...form, customerName: e.target.value })} className="px-4 py-3 rounded-lg bg-[#E8E5E0] outline-none" />
            <input required type="tel" placeholder="Phone number" value={form.customerPhone} onChange={(e) => setForm({ ...form, customerPhone: e.target.value })} className="px-4 py-3 rounded-lg bg-[#E8E5E0] outline-none" />
          </div>
          <input required type="email" placeholder="Email" value={form.customerEmail} onChange={(e) => setForm({ ...form, customerEmail: e.target.value })} className="w-full px-4 py-3 rounded-lg bg-[#E8E5E0] outline-none" />

          <div className="grid sm:grid-cols-2 gap-3">
            <input required placeholder="State" value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} className="px-4 py-3 rounded-lg bg-[#E8E5E0] outline-none" />
            <input
              required
              list="city-zones"
              placeholder="City"
              value={form.city}
              onChange={(e) => setForm({ ...form, city: e.target.value })}
              className="px-4 py-3 rounded-lg bg-[#E8E5E0] outline-none"
            />
            <datalist id="city-zones">
              {zones.map(z => <option key={z.id} value={z.name} />)}
            </datalist>
          </div>

          <textarea required placeholder="Delivery address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="w-full px-4 py-3 rounded-lg bg-[#E8E5E0] outline-none min-h-[80px]" />
          <textarea placeholder="Additional delivery instructions (optional)" value={form.deliveryInstructions} onChange={(e) => setForm({ ...form, deliveryInstructions: e.target.value })} className="w-full px-4 py-3 rounded-lg bg-[#E8E5E0] outline-none min-h-[60px]" />

          <button type="submit" disabled={loading} className="w-full bg-[#181818] text-white py-4 rounded-full font-semibold text-lg hover:bg-[#181818]/90 disabled:opacity-60">
            {loading ? 'Placing order...' : `Pay ₦${total.toLocaleString()}`}
          </button>
        </form>

        <div className="bg-white rounded-3xl p-6 shadow-sm space-y-3">
          <h2 className="font-bold text-lg mb-2">Order Summary</h2>
          {items.map((item, i) => (
            <div key={i} className="flex justify-between text-sm">
              <span className="text-[#66635F]">{item.name} &times;{item.quantity}</span>
              <span className="font-medium">&#8358;{((item.unitPrice + (item.customization ? item.customizationPrice : 0)) * item.quantity).toLocaleString()}</span>
            </div>
          ))}
          <div className="border-t border-[#D4D0C9] pt-3 flex justify-between text-sm">
            <span className="text-[#66635F]">Delivery</span>
            <span className="font-medium">&#8358;{deliveryFee.toLocaleString()}</span>
          </div>
          <div className="flex justify-between font-bold text-lg pt-2 border-t border-[#D4D0C9]">
            <span>Total</span>
            <span>&#8358;{total.toLocaleString()}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
