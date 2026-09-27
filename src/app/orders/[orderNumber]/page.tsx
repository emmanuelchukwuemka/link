'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { CheckCircle2, Circle, PackageCheck } from 'lucide-react'

type OrderItem = {
  id: string
  quantity: number
  unitPrice: number
  color: string | null
  customization: boolean
  product: { name: string }
}

type Order = {
  id: string
  orderNumber: string
  status: string
  paymentStatus: string
  profileSetupRequired: boolean
  total: number
  deliveryFee: number
  subtotal: number
  courierName: string | null
  trackingNumber: string | null
  customerName: string
  customerEmail: string
  items: OrderItem[]
}

const STEPS = [
  { key: 'order_placed', label: 'Order Placed' },
  { key: 'payment_confirmed', label: 'Payment Confirmed' },
  { key: 'profile_completed', label: 'Profile Completed' },
  { key: 'preparing', label: 'Preparing Your Card' },
  { key: 'in_production', label: 'In Production' },
  { key: 'quality_check', label: 'Quality Check' },
  { key: 'shipped', label: 'Shipped' },
  { key: 'out_for_delivery', label: 'Out for Delivery' },
  { key: 'delivered', label: 'Delivered' },
  { key: 'activated', label: 'Card Activated' },
]

const STATUS_ORDER = STEPS.map(s => s.key)

export default function OrderTrackingPage() {
  const params = useParams<{ orderNumber: string }>()
  const [order, setOrder] = useState<Order | null>(null)
  const [devMode, setDevMode] = useState(false)
  const [authed, setAuthed] = useState<boolean | null>(null)
  const [loading, setLoading] = useState(true)
  const [simulating, setSimulating] = useState(false)
  const [completing, setCompleting] = useState(false)

  const load = useCallback(async () => {
    const [orderRes, meRes] = await Promise.all([
      fetch(`/api/orders/${params.orderNumber}`),
      fetch('/api/auth/me'),
    ])
    const orderData = await orderRes.json()
    if (orderData.order) {
      setOrder(orderData.order)
      setDevMode(!!orderData.devMode)
    }
    setAuthed(meRes.ok)
    setLoading(false)
  }, [params.orderNumber])

  useEffect(() => { load() }, [load])

  const handleSimulate = async () => {
    setSimulating(true)
    await fetch('/api/payments/simulate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderNumber: params.orderNumber }),
    })
    await load()
    setSimulating(false)
  }

  const handleCompleteProfile = async () => {
    setCompleting(true)
    const res = await fetch(`/api/orders/${params.orderNumber}/complete-profile`, { method: 'PATCH' })
    if (res.ok) await load()
    setCompleting(false)
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center text-gray-500">Loading...</div>
  if (!order) return <div className="min-h-screen flex items-center justify-center text-gray-500">Order not found.</div>

  const currentIndex = order.paymentStatus !== 'paid' ? 0 : STATUS_ORDER.indexOf(order.status)

  return (
    <div className="min-h-screen bg-gray-50 pt-32 pb-20 px-4">
      <div className="max-w-2xl mx-auto space-y-8">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-sm text-gray-500">Order</p>
            <h1 className="text-2xl font-bold">#{order.orderNumber}</h1>
          </div>
          {order.paymentStatus === 'paid' && (
            <Link href={`/orders/${order.orderNumber}/receipt`} className="text-sm font-semibold text-black underline">
              View Receipt
            </Link>
          )}
        </div>

        {order.paymentStatus === 'pending' && devMode && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
            <p className="font-semibold text-amber-800 mb-1">Payment provider not configured (dev mode)</p>
            <p className="text-sm text-amber-700 mb-4">
              Paystack keys haven&apos;t been added to .env yet, so real payment can&apos;t run. Simulate a successful payment to continue testing the order pipeline.
            </p>
            <button
              onClick={handleSimulate}
              disabled={simulating}
              className="bg-amber-600 text-white px-5 py-2.5 rounded-full font-semibold hover:bg-amber-700 disabled:opacity-60"
            >
              {simulating ? 'Simulating...' : 'Simulate Payment Success'}
            </button>
          </div>
        )}

        {order.paymentStatus === 'pending' && !devMode && (
          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5 text-blue-800 text-sm">
            Waiting for payment confirmation. This page updates automatically once Paystack confirms your payment.
          </div>
        )}

        {order.paymentStatus === 'paid' && order.profileSetupRequired && (
          <div className="bg-black text-white rounded-2xl p-6">
            <h2 className="font-bold text-lg mb-1">Set up your TapConnect profile</h2>
            <p className="text-sm opacity-80 mb-4">
              Your card can&apos;t go into production until it&apos;s connected to a profile. This only takes a minute.
            </p>
            {authed === false ? (
              <div className="flex gap-3">
                <Link href={`/login?next=/orders/${order.orderNumber}`} className="bg-white text-black px-5 py-2.5 rounded-full font-semibold">Log in</Link>
                <Link href={`/register?next=/orders/${order.orderNumber}`} className="bg-white/10 px-5 py-2.5 rounded-full font-semibold">Create account</Link>
              </div>
            ) : (
              <div className="flex items-center gap-3 flex-wrap">
                <Link href="/dashboard/appearance" className="bg-white text-black px-5 py-2.5 rounded-full font-semibold">
                  Edit my profile
                </Link>
                <button
                  onClick={handleCompleteProfile}
                  disabled={completing}
                  className="bg-[#B8B8B8] text-[#000000] px-5 py-2.5 rounded-full font-semibold disabled:opacity-60"
                >
                  {completing ? 'Saving...' : 'My profile is ready — continue'}
                </button>
              </div>
            )}
          </div>
        )}

        <div className="bg-white rounded-3xl p-6 shadow-sm">
          <h2 className="font-bold text-lg mb-4 flex items-center gap-2"><PackageCheck size={18} /> Order Status</h2>
          <div className="space-y-3">
            {STEPS.map((step, i) => {
              const done = i < currentIndex || (i === currentIndex && order.paymentStatus === 'paid' && !order.profileSetupRequired)
              const current = i === currentIndex
              return (
                <div key={step.key} className={`flex items-center gap-3 ${done ? 'text-black' : current ? 'text-[#6B6B6B] font-semibold' : 'text-gray-300'}`}>
                  {done ? <CheckCircle2 size={18} className="text-green-500" /> : <Circle size={18} />}
                  {step.label}
                </div>
              )
            })}
          </div>
          {order.trackingNumber && (
            <p className="text-sm text-gray-500 mt-4 pt-4 border-t border-gray-100">
              {order.courierName}: <span className="font-mono">{order.trackingNumber}</span>
            </p>
          )}
        </div>

        <div className="bg-white rounded-3xl p-6 shadow-sm">
          <h2 className="font-bold text-lg mb-4">Items</h2>
          <div className="space-y-2">
            {order.items.map((item) => (
              <div key={item.id} className="flex justify-between text-sm">
                <span className="text-gray-600">{item.product.name} {item.color ? `(${item.color})` : ''} &times;{item.quantity}</span>
                <span className="font-medium">&#8358;{(item.unitPrice * item.quantity).toLocaleString()}</span>
              </div>
            ))}
            <div className="flex justify-between text-sm pt-2 border-t border-gray-100">
              <span className="text-gray-600">Delivery</span>
              <span className="font-medium">&#8358;{order.deliveryFee.toLocaleString()}</span>
            </div>
            <div className="flex justify-between font-bold pt-2 border-t border-gray-100">
              <span>Total</span>
              <span>&#8358;{order.total.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
