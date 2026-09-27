'use client'

import { useState, useEffect } from 'react'
import { CreditCard, Plus } from 'lucide-react'

type Card = {
  id: string
  code: string
  status: string
  businessId: string | null
  user: { username: string; displayName: string | null } | null
  business: { name: string } | null
}

type Business = { id: string; name: string }

export default function AdminCardsPage() {
  const [cards, setCards] = useState<Card[]>([])
  const [businesses, setBusinesses] = useState<Business[]>([])
  const [count, setCount] = useState(10)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [filter, setFilter] = useState('')

  const load = async () => {
    const [cardsRes, businessesRes] = await Promise.all([
      fetch('/api/cards'),
      fetch('/api/admin/businesses'),
    ])
    const cardsData = await cardsRes.json()
    const businessesData = await businessesRes.json()
    if (cardsData.cards) setCards(cardsData.cards)
    if (businessesData.businesses) setBusinesses(businessesData.businesses)
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const assignBusiness = async (code: string, businessId: string) => {
    await fetch(`/api/cards/${code}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ businessId: businessId || null }),
    })
    load()
  }

  const generate = async () => {
    setGenerating(true)
    await fetch('/api/cards', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ count }),
    })
    await load()
    setGenerating(false)
  }

  const setStatus = async (code: string, status: string) => {
    await fetch(`/api/cards/${code}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    load()
  }

  const filtered = filter ? cards.filter(c => c.status === filter) : cards

  if (loading) return <div className="text-center py-20 text-black">Loading...</div>

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap justify-between items-center gap-3">
        <h1 className="text-2xl font-bold flex items-center gap-2"><CreditCard size={24} /> Cards ({cards.length})</h1>
        <div className="flex items-center gap-2">
          <input type="number" value={count} onChange={(e) => setCount(parseInt(e.target.value) || 1)} className="w-20 px-3 py-2 rounded-lg bg-white border border-gray-200 outline-none text-sm" />
          <button onClick={generate} disabled={generating} className="bg-black text-white px-4 py-2 rounded-full font-semibold flex items-center gap-2 hover:bg-gray-800 disabled:opacity-60">
            <Plus size={18} /> {generating ? 'Generating...' : 'Generate cards'}
          </button>
        </div>
      </div>

      <div className="flex gap-2">
        {['', 'unassigned', 'active', 'deactivated'].map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`text-xs font-semibold px-3 py-1.5 rounded-full capitalize ${filter === s ? 'bg-black text-white' : 'bg-white text-gray-500'}`}
          >
            {s || 'All'}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-2xl shadow-sm overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-black border-b border-gray-100">
              <th className="p-4 font-semibold">Code</th>
              <th className="p-4 font-semibold">Status</th>
              <th className="p-4 font-semibold">Assigned To</th>
              <th className="p-4 font-semibold">Business Pool</th>
              <th className="p-4 font-semibold">Action</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((c) => (
              <tr key={c.id} className="border-b border-gray-50 last:border-0">
                <td className="p-4 font-mono font-semibold">{c.code}</td>
                <td className="p-4 capitalize">{c.status}</td>
                <td className="p-4 text-black">
                  {c.user ? `@${c.user.username}` : c.business ? c.business.name : '—'}
                </td>
                <td className="p-4">
                  <select
                    defaultValue={c.businessId || ''}
                    onChange={(e) => assignBusiness(c.code, e.target.value)}
                    disabled={!!c.user}
                    className="text-xs px-2 py-1.5 rounded-lg bg-gray-50 outline-none disabled:opacity-50"
                  >
                    <option value="">— None —</option>
                    {businesses.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </select>
                </td>
                <td className="p-4">
                  {c.status !== 'deactivated' ? (
                    <button onClick={() => setStatus(c.code, 'deactivated')} className="text-red-500 text-xs font-semibold hover:underline">Deactivate</button>
                  ) : (
                    <button onClick={() => setStatus(c.code, 'unassigned')} className="text-green-600 text-xs font-semibold hover:underline">Reactivate</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && <p className="text-black text-center py-10">No cards found.</p>}
      </div>
    </div>
  )
}
