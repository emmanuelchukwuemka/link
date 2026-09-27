'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { ShoppingBag, Plus, Check, ChevronLeft, ChevronRight, Send } from 'lucide-react'
import { addToCart, getCart, cartCount } from '@/lib/cart'

export function CartBadge() {
  const [count, setCount] = useState(0)

  useEffect(() => {
    const update = () => setCount(cartCount(getCart()))
    update()
    window.addEventListener('cart-updated', update)
    return () => window.removeEventListener('cart-updated', update)
  }, [])

  return (
    <Link href="/cart" className="relative p-2 rounded-full hover:bg-white/10 transition-colors" aria-label="View cart">
      <ShoppingBag size={20} className="text-white" />
      {count > 0 && (
        <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-white text-black text-[10px] font-bold rounded-full flex items-center justify-center">
          {count > 9 ? '9+' : count}
        </span>
      )}
    </Link>
  )
}

export function QuickAddButton({
  productId, name, slug, image, unitPrice, customizationPrice, color,
}: {
  productId: string
  name: string
  slug: string
  image: string | null
  unitPrice: number
  customizationPrice: number
  color?: string
}) {
  const [added, setAdded] = useState(false)

  const handleAdd = () => {
    addToCart({ productId, name, slug, image, unitPrice, color, customization: false, customizationPrice, quantity: 1 })
    setAdded(true)
    setTimeout(() => setAdded(false), 1400)
  }

  return (
    <button
      onClick={handleAdd}
      aria-label={`Add ${name} to cart`}
      className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors ${added ? 'bg-green-500 text-white' : 'bg-black text-white hover:bg-[#111111]'}`}
    >
      {added ? <Check size={16} /> : <Plus size={16} />}
    </button>
  )
}

export function TestimonialCarousel({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)
  const pausedRef = useRef(false)

  const scroll = (dir: 1 | -1) => {
    const el = ref.current
    if (!el) return
    const atEnd = el.scrollLeft + el.clientWidth >= el.scrollWidth - 10
    if (dir === 1 && atEnd) el.scrollTo({ left: 0, behavior: 'smooth' })
    else el.scrollBy({ left: dir * 340, behavior: 'smooth' })
  }

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const interval = setInterval(() => {
      if (!pausedRef.current) scroll(1)
    }, 5000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div
      className="relative"
      onMouseEnter={() => { pausedRef.current = true }}
      onMouseLeave={() => { pausedRef.current = false }}
      onTouchStart={() => { pausedRef.current = true }}
    >
      <div ref={ref} className="flex gap-6 overflow-x-auto snap-x snap-mandatory scroll-smooth pb-2 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        {children}
      </div>
      <div className="flex justify-center gap-3 mt-6">
        <button onClick={() => scroll(-1)} aria-label="Previous testimonial" className="w-10 h-10 rounded-full border border-[#E5E5E5] flex items-center justify-center hover:bg-[#F7F7F5] transition-colors">
          <ChevronLeft size={18} />
        </button>
        <button onClick={() => scroll(1)} aria-label="Next testimonial" className="w-10 h-10 rounded-full border border-[#E5E5E5] flex items-center justify-center hover:bg-[#F7F7F5] transition-colors">
          <ChevronRight size={18} />
        </button>
      </div>
    </div>
  )
}

export function NewsletterForm() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus('sending')
    try {
      const res = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      if (!res.ok) throw new Error()
      setStatus('sent')
      setEmail('')
    } catch {
      setStatus('error')
    }
  }

  if (status === 'sent') {
    return <p className="text-sm text-white font-medium">Thanks — you&apos;re on the list.</p>
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <input
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Your email address"
        className="flex-1 min-w-0 px-4 py-2.5 rounded-full bg-white/10 border border-white/20 text-white placeholder:text-white/50 outline-none focus:border-white/50 text-sm"
      />
      <button
        type="submit"
        disabled={status === 'sending'}
        aria-label="Subscribe"
        className="w-10 h-10 shrink-0 rounded-full bg-white text-black flex items-center justify-center hover:bg-[#F7F7F5] transition-colors disabled:opacity-60"
      >
        <Send size={16} />
      </button>
      {status === 'error' && <p className="text-xs text-red-300 absolute mt-12">Something went wrong.</p>}
    </form>
  )
}
