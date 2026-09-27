'use client'

import { useState, useEffect } from 'react'
import { CreditCard, Plus, ExternalLink } from 'lucide-react'

type Card = {
  id: string
  code: string
  status: string
  assignedAt: string | null
}

type Me = { username: string }

export default function CardsPage() {
  const [cards, setCards] = useState<Card[]>([])
  const [me, setMe] = useState<Me | null>(null)
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  const load = async () => {
    const [cardsRes, meRes] = await Promise.all([
      fetch('/api/cards/mine'),
      fetch('/api/auth/me'),
    ])
    const cardsData = await cardsRes.json()
    const meData = await meRes.json()
    if (cardsData.cards) setCards(cardsData.cards)
    if (meData.user) setMe(meData.user)
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    try {
      const res = await fetch('/api/cards/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Could not connect card')
      setCode('')
      load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    }
  }

  const profileUrl = me ? `${typeof window !== 'undefined' ? window.location.origin : ''}/${me.username}` : ''
  const qrSrc = me ? `https://api.qrserver.com/v1/create-qr-code/?size=260x260&data=${encodeURIComponent(`${typeof window !== 'undefined' ? window.location.origin : ''}/q/${me.username}`)}` : ''

  if (loading) return <div className="text-center py-20 text-black">Loading...</div>

  return (
    <div className="space-y-8 max-w-3xl">
      <h1 className="text-2xl font-bold">My Cards &amp; QR Code</h1>

      <section className="bg-white rounded-3xl p-6 shadow-sm flex flex-col sm:flex-row gap-6 items-center">
        {me && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={qrSrc} alt="Your TapConnect QR code" className="w-40 h-40 rounded-xl border border-gray-100" />
        )}
        <div className="flex-1">
          <h2 className="font-bold text-lg mb-1">Your QR code</h2>
          <p className="text-black text-sm mb-3">Anyone who scans this lands on your public profile. Great as a fallback when NFC isn&apos;t available.</p>
          {profileUrl && (
            <a href={profileUrl} target="_blank" rel="noopener noreferrer" className="text-[#000000] font-semibold text-sm inline-flex items-center gap-1 hover:underline">
              {profileUrl} <ExternalLink size={14} />
            </a>
          )}
        </div>
      </section>

      <section className="bg-white rounded-3xl p-6 shadow-sm">
        <h2 className="font-bold text-lg mb-1">Connect a physical card</h2>
        <p className="text-black text-sm mb-4">Enter the code printed on the back of your TapConnect card or wristband.</p>
        <form onSubmit={handleConnect} className="flex gap-3">
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="TC-XXXXXX"
            className="flex-1 px-4 py-3 rounded-lg bg-gray-100 border-transparent focus:bg-white focus:border-[#000000] focus:ring-2 focus:ring-[#000000]/20 outline-none font-mono"
          />
          <button type="submit" className="bg-black text-white px-6 py-3 rounded-full font-semibold hover:bg-gray-800 flex items-center gap-2">
            <Plus size={18} /> Connect
          </button>
        </form>
        {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
      </section>

      <section className="space-y-3">
        <h2 className="font-bold text-lg">Connected cards ({cards.length})</h2>
        {cards.length === 0 ? (
          <div className="bg-white rounded-3xl p-8 text-center text-black shadow-sm">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CreditCard size={32} className="text-gray-400" />
            </div>
            No cards connected yet. Enter your card code above to activate it.
          </div>
        ) : (
          cards.map((card) => (
            <div key={card.id} className="bg-white rounded-2xl p-4 shadow-sm flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CreditCard size={20} className="text-gray-400" />
                <span className="font-mono font-semibold">{card.code}</span>
              </div>
              <span className={`text-xs font-semibold px-3 py-1 rounded-full ${card.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                {card.status}
              </span>
            </div>
          ))
        )}
      </section>
    </div>
  )
}
