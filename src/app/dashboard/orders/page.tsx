'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Package } from 'lucide-react'

type Order = {
  id: string
  orderNumber: string
  status: string
  paymentStatus: string
  total: number
  createdAt: string
  items: { id: string; quantity: number; product: { name: string } }[]
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

export default function MyOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/orders/mine').then(res => res.json()).then(data => {
      if (data.orders) setOrders(data.orders)
      setLoading(false)
    })
  }, [])

  if (loading) return <div className="text-center py-20 text-black">Loading...</div>

  return (
    <div className="max-w-3xl space-y-6">
      <h1 className="text-2xl font-bold">My Orders</h1>

      {orders.length === 0 ? (
        <div className="bg-white rounded-3xl p-8 text-center text-black shadow-sm">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Package size={32} className="text-gray-400" />
          </div>
          No orders yet.{' '}
          <Link href="/marketplace" className="text-black font-semibold hover:underline">Browse the marketplace</Link>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => (
            <Link
              key={order.id}
              href={`/orders/${order.orderNumber}`}
              className="block bg-white rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-semibold">#{order.orderNumber}</p>
                  <p className="text-xs text-black">
                    {order.items.map(i => `${i.product.name} ×${i.quantity}`).join(', ')}
                  </p>
                  <p className="text-xs text-black mt-1">{new Date(order.createdAt).toLocaleDateString()}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-xs font-semibold px-3 py-1 rounded-full capitalize ${STATUS_COLORS[order.status] || 'bg-gray-100 text-gray-600'}`}>
                    {order.status.replace(/_/g, ' ')}
                  </span>
                  <span className="font-semibold text-sm">&#8358;{order.total.toLocaleString()}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
