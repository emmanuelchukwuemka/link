'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Plus, Trash2, Image as ImageIcon, MessageSquareQuote, Star, Crown } from 'lucide-react'
import { ImageUploader } from '@/components/ImageUploader'
import { ProductsServicesTabs } from '@/components/ProductsServicesTabs'

type PortfolioItem = {
  id: string
  title: string
  description: string | null
  imageUrl: string | null
  videoUrl: string | null
  type: string
}

type Testimonial = {
  id: string
  authorName: string
  content: string
  rating: number
}

export default function PortfolioPage() {
  const [items, setItems] = useState<PortfolioItem[]>([])
  const [testimonials, setTestimonials] = useState<Testimonial[]>([])
  const [loading, setLoading] = useState(true)
  const [isPro, setIsPro] = useState(false)
  const [error, setError] = useState('')

  const load = async () => {
    const [pRes, tRes] = await Promise.all([fetch('/api/portfolio'), fetch('/api/testimonials')])
    const pData = await pRes.json()
    const tData = await tRes.json()
    if (pData.items) setItems(pData.items)
    if (tData.testimonials) setTestimonials(tData.testimonials)
    setLoading(false)
  }

  useEffect(() => {
    load()
    fetch('/api/auth/me').then(res => res.json()).then(data => {
      if (data.user) {
        setIsPro(data.user.plan === 'pro' && (!data.user.planExpiresAt || new Date(data.user.planExpiresAt) > new Date()))
      }
    })
  }, [])

  const addItem = async (type: 'project' | 'gallery') => {
    setError('')
    const res = await fetch('/api/portfolio', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: '', description: '', imageUrl: '', type })
    })
    const data = await res.json()
    if (!res.ok) {
      setError(data.error || 'Could not add item')
      return
    }
    if (data.item) setItems([...items, data.item])
  }

  const projects = items.filter((i) => i.type !== 'gallery')
  const galleryItems = items.filter((i) => i.type === 'gallery')

  const updateItem = async (id: string, updates: Partial<PortfolioItem>) => {
    setItems(items.map(i => i.id === id ? { ...i, ...updates } : i))
    await fetch(`/api/portfolio/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...items.find(i => i.id === id), ...updates })
    })
  }

  const deleteItem = async (id: string) => {
    setItems(items.filter(i => i.id !== id))
    await fetch(`/api/portfolio/${id}`, { method: 'DELETE' })
  }

  const addTestimonial = async () => {
    const res = await fetch('/api/testimonials', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ authorName: '', content: '', rating: 5 })
    })
    const data = await res.json()
    if (data.testimonial) setTestimonials([...testimonials, data.testimonial])
  }

  const updateTestimonial = async (id: string, updates: Partial<Testimonial>) => {
    setTestimonials(testimonials.map(t => t.id === id ? { ...t, ...updates } : t))
    await fetch(`/api/testimonials/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...testimonials.find(t => t.id === id), ...updates })
    })
  }

  const deleteTestimonial = async (id: string) => {
    setTestimonials(testimonials.filter(t => t.id !== id))
    await fetch(`/api/testimonials/${id}`, { method: 'DELETE' })
  }

  if (loading) return <div className="text-center py-20 text-black">Loading...</div>

  return (
    <div className="max-w-2xl space-y-10">
      <ProductsServicesTabs />
      {!isPro && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center justify-between gap-4">
          <p className="text-sm text-amber-800 flex items-center gap-2"><Crown size={16} /> Portfolio and Gallery are Pro features — visible on your public profile once you upgrade.</p>
          <Link href="/dashboard/subscription" className="text-sm font-semibold bg-amber-600 text-white px-4 py-2 rounded-full whitespace-nowrap hover:bg-amber-700">
            Upgrade
          </Link>
        </div>
      )}
      {error && <div className="bg-red-50 text-red-500 p-3 rounded-lg text-sm">{error}</div>}

      <section className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold flex items-center gap-2"><ImageIcon size={22} /> Portfolio</h1>
          <button onClick={() => addItem('project')} className="bg-[#000000] text-white px-4 py-2 rounded-full font-semibold flex items-center gap-2 hover:bg-[#000000]/90">
            <Plus size={18} /> Add project
          </button>
        </div>

        {projects.length === 0 ? (
          <div className="bg-white rounded-3xl p-8 text-center text-black shadow-sm">
            Showcase your projects, case studies or videos here.
          </div>
        ) : (
          <div className="space-y-4">
            {projects.map((item) => (
              <div key={item.id} className="bg-white rounded-2xl p-4 shadow-sm space-y-2">
                <div className="flex gap-2">
                  <input
                    value={item.title}
                    onChange={(e) => updateItem(item.id, { title: e.target.value })}
                    placeholder="Project title"
                    className="flex-1 font-semibold outline-none bg-transparent"
                  />
                  <button onClick={() => deleteItem(item.id)} className="text-gray-400 hover:text-red-500">
                    <Trash2 size={18} />
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  {item.imageUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={item.imageUrl} alt="" className="w-12 h-12 rounded-lg object-cover shrink-0" />
                  )}
                  <input
                    value={item.imageUrl || ''}
                    onChange={(e) => updateItem(item.id, { imageUrl: e.target.value })}
                    placeholder="Image URL"
                    className="flex-1 text-sm px-3 py-2 rounded-lg bg-gray-50 outline-none"
                  />
                  <ImageUploader
                    label="Upload"
                    onUploaded={(url) => updateItem(item.id, { imageUrl: url })}
                    className="bg-gray-100 text-gray-700 px-3 py-2 rounded-lg font-semibold text-xs hover:bg-gray-200 flex items-center gap-1 shrink-0"
                  />
                </div>
                <textarea
                  value={item.description || ''}
                  onChange={(e) => updateItem(item.id, { description: e.target.value })}
                  placeholder="Description"
                  className="w-full text-sm text-gray-600 outline-none bg-gray-50 rounded-lg p-2"
                />
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold flex items-center gap-2"><ImageIcon size={22} /> Gallery</h1>
          <button onClick={() => addItem('gallery')} className="bg-[#000000] text-white px-4 py-2 rounded-full font-semibold flex items-center gap-2 hover:bg-[#000000]/90">
            <Plus size={18} /> Add image
          </button>
        </div>
        <p className="text-sm text-black -mt-4">A simple photo grid &mdash; good for businesses showing off a space, products or events.</p>

        {galleryItems.length === 0 ? (
          <div className="bg-white rounded-3xl p-8 text-center text-black shadow-sm">
            No gallery images yet.
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-3">
            {galleryItems.map((item) => (
              <div key={item.id} className="bg-white rounded-2xl p-2 shadow-sm space-y-2">
                <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center">
                  {item.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={item.imageUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <ImageIcon size={20} className="text-gray-300" />
                  )}
                </div>
                <ImageUploader
                  label={item.imageUrl ? 'Replace' : 'Upload'}
                  onUploaded={(url) => updateItem(item.id, { imageUrl: url })}
                  className="w-full justify-center bg-gray-100 text-gray-700 px-2 py-1.5 rounded-lg font-semibold text-xs hover:bg-gray-200 flex items-center gap-1"
                />
                <button onClick={() => deleteItem(item.id)} className="w-full text-center text-xs text-black hover:text-red-500">
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold flex items-center gap-2"><MessageSquareQuote size={22} /> Testimonials</h1>
          <button onClick={addTestimonial} className="bg-[#000000] text-white px-4 py-2 rounded-full font-semibold flex items-center gap-2 hover:bg-[#000000]/90">
            <Plus size={18} /> Add testimonial
          </button>
        </div>

        {testimonials.length === 0 ? (
          <div className="bg-white rounded-3xl p-8 text-center text-black shadow-sm">
            Add quotes from happy clients or customers.
          </div>
        ) : (
          <div className="space-y-4">
            {testimonials.map((t) => (
              <div key={t.id} className="bg-white rounded-2xl p-4 shadow-sm space-y-2">
                <div className="flex items-center gap-1 text-amber-400">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <button key={i} onClick={() => updateTestimonial(t.id, { rating: i + 1 })}>
                      <Star size={16} fill={i < t.rating ? 'currentColor' : 'none'} />
                    </button>
                  ))}
                  <button onClick={() => deleteTestimonial(t.id)} className="ml-auto text-gray-400 hover:text-red-500">
                    <Trash2 size={16} />
                  </button>
                </div>
                <textarea
                  value={t.content}
                  onChange={(e) => updateTestimonial(t.id, { content: e.target.value })}
                  placeholder="What did they say?"
                  className="w-full text-sm text-gray-700 outline-none bg-gray-50 rounded-lg p-2"
                />
                <input
                  value={t.authorName}
                  onChange={(e) => updateTestimonial(t.id, { authorName: e.target.value })}
                  placeholder="Author name"
                  className="w-full text-xs text-black font-semibold outline-none bg-gray-50 rounded-lg p-2"
                />
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
