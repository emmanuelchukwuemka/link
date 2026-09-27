'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Plus, Trash2, Briefcase, Crown } from 'lucide-react'
import { ProductsServicesTabs } from '@/components/ProductsServicesTabs'

type Service = {
  id: string
  name: string
  description: string | null
  price: string | null
  ctaType: string
}

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [isPro, setIsPro] = useState(false)
  const [error, setError] = useState('')

  const fetchServices = async () => {
    const res = await fetch('/api/services')
    const data = await res.json()
    if (data.services) setServices(data.services)
    setLoading(false)
  }

  useEffect(() => {
    fetchServices()
    fetch('/api/auth/me').then(res => res.json()).then(data => {
      if (data.user) {
        setIsPro(data.user.plan === 'pro' && (!data.user.planExpiresAt || new Date(data.user.planExpiresAt) > new Date()))
      }
    })
  }, [])

  const handleAdd = async () => {
    setError('')
    const res = await fetch('/api/services', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: '', description: '', price: '', ctaType: 'contact' })
    })
    const data = await res.json()
    if (!res.ok) {
      setError(data.error || 'Could not add service')
      return
    }
    if (data.service) setServices([...services, data.service])
  }

  const handleUpdate = async (id: string, updates: Partial<Service>) => {
    setServices(services.map(s => s.id === id ? { ...s, ...updates } : s))
    await fetch(`/api/services/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...services.find(s => s.id === id), ...updates })
    })
  }

  const handleDelete = async (id: string) => {
    setServices(services.filter(s => s.id !== id))
    await fetch(`/api/services/${id}`, { method: 'DELETE' })
  }

  if (loading) return <div className="text-center py-20 text-black">Loading...</div>

  return (
    <div className="max-w-2xl space-y-6">
      <ProductsServicesTabs />
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Services</h1>
        <button onClick={handleAdd} className="bg-[#000000] text-white px-4 py-2 rounded-full font-semibold flex items-center gap-2 hover:bg-[#000000]/90">
          <Plus size={18} /> Add service
        </button>
      </div>

      {!isPro && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center justify-between gap-4">
          <p className="text-sm text-amber-800 flex items-center gap-2"><Crown size={16} /> Services are a Pro feature — visible on your public profile once you upgrade.</p>
          <Link href="/dashboard/subscription" className="text-sm font-semibold bg-amber-600 text-white px-4 py-2 rounded-full whitespace-nowrap hover:bg-amber-700">
            Upgrade
          </Link>
        </div>
      )}
      {error && <div className="bg-red-50 text-red-500 p-3 rounded-lg text-sm">{error}</div>}

      {services.length === 0 ? (
        <div className="bg-white rounded-3xl p-8 text-center text-black shadow-sm">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Briefcase size={32} className="text-gray-400" />
          </div>
          List what you offer &mdash; consulting, design work, bookings, anything visitors can request.
        </div>
      ) : (
        <div className="space-y-4">
          {services.map((s) => (
            <div key={s.id} className="bg-white rounded-2xl p-4 shadow-sm space-y-2">
              <div className="flex gap-2">
                <input
                  value={s.name}
                  onChange={(e) => handleUpdate(s.id, { name: e.target.value })}
                  placeholder="Service name"
                  className="flex-1 font-semibold outline-none bg-transparent"
                />
                <button onClick={() => handleDelete(s.id)} className="text-gray-400 hover:text-red-500">
                  <Trash2 size={18} />
                </button>
              </div>
              <textarea
                value={s.description || ''}
                onChange={(e) => handleUpdate(s.id, { description: e.target.value })}
                placeholder="Description"
                className="w-full text-sm text-gray-600 outline-none bg-gray-50 rounded-lg p-2"
              />
              <div className="flex gap-2">
                <input
                  value={s.price || ''}
                  onChange={(e) => handleUpdate(s.id, { price: e.target.value })}
                  placeholder="Price (optional)"
                  className="flex-1 text-sm px-3 py-2 rounded-lg bg-gray-50 outline-none"
                />
                <select
                  value={s.ctaType}
                  onChange={(e) => handleUpdate(s.id, { ctaType: e.target.value })}
                  className="text-sm px-3 py-2 rounded-lg bg-gray-50 outline-none"
                >
                  <option value="contact">Contact</option>
                  <option value="quote">Request Quote</option>
                  <option value="book">Book</option>
                </select>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
