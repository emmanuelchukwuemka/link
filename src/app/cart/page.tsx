'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Minus, Plus, Trash2, ShoppingBag } from 'lucide-react'
import { getCart, updateCartQuantity, removeFromCart, cartTotal, type CartItem } from '@/lib/cart'

export default function CartPage() {
  const [items, setItems] = useState<CartItem[]>([])

  useEffect(() => {
    setItems(getCart())
  }, [])

  const refresh = () => setItems(getCart())

  const total = cartTotal(items)

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 pt-32 px-4 text-center">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <ShoppingBag size={28} className="text-gray-400" />
        </div>
        <h1 className="text-2xl font-bold text-[#111111] mb-3">Your cart is empty</h1>
        <Link href="/marketplace" className="text-[#000000] font-semibold hover:underline">Browse the marketplace</Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-32 pb-20 px-4">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-[#111111] mb-8">Your Cart</h1>

        <div className="space-y-4 mb-8">
          {items.map((item, i) => (
            <div key={i} className="bg-white rounded-2xl p-4 shadow-sm flex items-center gap-4">
              <div className="w-16 h-16 bg-gray-100 rounded-xl flex items-center justify-center text-xs text-gray-400 font-semibold overflow-hidden shrink-0">
                {item.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                ) : item.name.slice(0, 2)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold truncate">{item.name}</p>
                <p className="text-xs text-gray-500">
                  {item.color && `${item.color} · `}{item.customization ? 'With customization' : 'No customization'}
                </p>
                <p className="text-sm font-semibold mt-1">
                  &#8358;{(item.unitPrice + (item.customization ? item.customizationPrice : 0)).toLocaleString()}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => { updateCartQuantity(i, item.quantity - 1); refresh() }} className="w-7 h-7 rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-50">
                  <Minus size={12} />
                </button>
                <span className="w-6 text-center text-sm font-semibold">{item.quantity}</span>
                <button onClick={() => { updateCartQuantity(i, item.quantity + 1); refresh() }} className="w-7 h-7 rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-50">
                  <Plus size={12} />
                </button>
              </div>
              <button onClick={() => { removeFromCart(i); refresh() }} className="text-gray-400 hover:text-red-500">
                <Trash2 size={18} />
              </button>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm flex items-center justify-between mb-6">
          <span className="text-gray-500">Subtotal (delivery calculated at checkout)</span>
          <span className="text-xl font-bold">&#8358;{total.toLocaleString()}</span>
        </div>

        <div className="flex gap-4">
          <Link href="/marketplace" className="flex-1 text-center py-4 rounded-full font-semibold border border-gray-300 hover:bg-white">
            Continue shopping
          </Link>
          <Link href="/checkout" className="flex-1 text-center py-4 rounded-full font-semibold bg-black text-white hover:bg-gray-800">
            Proceed to checkout
          </Link>
        </div>
      </div>
    </div>
  )
}
