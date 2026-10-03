'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ShoppingCart, Plus, Check, ChevronLeft, ChevronRight, Send, CheckCircle2, ArrowRight } from 'lucide-react'
import { addToCart, getCart, cartCount } from '@/lib/cart'

// Primary purchase CTA on homepage product cards — adds to cart and goes
// straight to checkout, skipping the product detail and cart-review pages
// so a purchase takes one click from the homepage instead of several.
export function BuyNowButton({
  productId, name, slug, image, unitPrice, customizationPrice, color, className,
}: {
  productId: string
  name: string
  slug: string
  image: string | null
  unitPrice: number
  customizationPrice: number
  color?: string
  className?: string
}) {
  const router = useRouter()

  const handleBuyNow = () => {
    addToCart({ productId, name, slug, image, unitPrice, color, customization: false, customizationPrice, quantity: 1 })
    router.push('/checkout')
  }

  return (
    <button
      onClick={handleBuyNow}
      className={className ?? 'w-full flex items-center justify-center gap-1.5 bg-black text-white rounded-full py-2.5 font-semibold text-sm hover:bg-[#111111] transition-colors'}
    >
      Get Yours <ArrowRight size={14} />
    </button>
  )
}

export function CartBadge({ invert = false, accent = false }: { invert?: boolean; accent?: boolean }) {
  const [count, setCount] = useState(0)

  useEffect(() => {
    const update = () => setCount(cartCount(getCart()))
    update()
    window.addEventListener('cart-updated', update)
    return () => window.removeEventListener('cart-updated', update)
  }, [])

  const badgeClasses = accent ? 'bg-[#22C55E] text-white' : invert ? 'bg-black text-white' : 'bg-white text-black'

  return (
    <Link
      href="/cart"
      className={`relative p-2 rounded-full transition-colors ${invert ? 'hover:bg-black/5' : 'hover:bg-white/10'}`}
      aria-label="View cart"
    >
      <ShoppingCart size={20} strokeWidth={1.75} className={invert ? 'text-black' : 'text-white'} />
      {count > 0 && (
        <span className={`absolute -top-0.5 -right-0.5 w-4 h-4 text-[10px] font-bold rounded-full flex items-center justify-center ${badgeClasses}`}>
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

export function ContactForm() {
  const [form, setForm] = useState({ name: '', email: '', phone: '', message: '' })
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus('sending')
    setError('')
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Something went wrong')
      setStatus('sent')
      setForm({ name: '', email: '', phone: '', message: '' })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setStatus('error')
    }
  }

  if (status === 'sent') {
    return (
      <div className="bg-white rounded-3xl p-8 shadow-sm text-center">
        <div className="w-14 h-14 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 size={26} className="text-green-600" />
        </div>
        <h3 className="text-lg font-bold text-[#111111] mb-1">Message sent</h3>
        <p className="text-sm text-[#6B6B6B]">Thanks for reaching out — our team will get back to you shortly.</p>
        <button onClick={() => setStatus('idle')} className="mt-5 text-sm font-semibold underline hover:text-black">
          Send another message
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm space-y-4">
      {error && <div className="bg-red-50 text-red-500 p-3 rounded-lg text-sm">{error}</div>}
      <div className="grid sm:grid-cols-2 gap-4">
        <input
          required
          placeholder="Full name"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          className="px-4 py-3 rounded-lg bg-gray-100 outline-none text-sm"
        />
        <input
          required
          type="email"
          placeholder="Email address"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          className="px-4 py-3 rounded-lg bg-gray-100 outline-none text-sm"
        />
      </div>
      <input
        type="tel"
        placeholder="Phone number (optional)"
        value={form.phone}
        onChange={(e) => setForm({ ...form, phone: e.target.value })}
        className="w-full px-4 py-3 rounded-lg bg-gray-100 outline-none text-sm"
      />
      <textarea
        required
        placeholder="How can we help?"
        value={form.message}
        onChange={(e) => setForm({ ...form, message: e.target.value })}
        rows={5}
        className="w-full px-4 py-3 rounded-lg bg-gray-100 outline-none text-sm resize-none"
      />
      <button
        type="submit"
        disabled={status === 'sending'}
        className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-black text-white px-6 py-3.5 rounded-full font-semibold hover:bg-[#111111] transition-colors disabled:opacity-60"
      >
        {status === 'sending' ? 'Sending...' : 'Send Message'} <Send size={15} />
      </button>
    </form>
  )
}
