'use client'

import { useState, useEffect } from 'react'
import { Download, Send, CheckCircle2, Image as ImageIcon } from 'lucide-react'

function track(username: string, type: string, meta?: Record<string, unknown>) {
  fetch('/api/analytics/track', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, type, meta }),
    keepalive: true,
  }).catch(() => {})
}

export function TrackedLink({
  href, type, username, className, style, children, meta,
}: {
  href: string
  type: string
  username: string
  className?: string
  style?: React.CSSProperties
  children: React.ReactNode
  meta?: Record<string, unknown>
}) {
  return (
    <a
      href={href}
      target={href.startsWith('http') ? '_blank' : undefined}
      rel={href.startsWith('http') ? 'noopener noreferrer' : undefined}
      className={className}
      style={style}
      onClick={() => track(username, type, meta)}
    >
      {children}
    </a>
  )
}

export function TrackedButtonLink({
  id, href, className, children,
}: {
  id: string
  href: string
  className?: string
  children: React.ReactNode
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={className}
      onClick={() => {
        fetch(`/api/links/${id}/click`, { method: 'POST', keepalive: true }).catch(() => {})
      }}
    >
      {children}
    </a>
  )
}

export function SaveContactButton({
  username, displayName, phone, email, website, jobTitle, organization, className,
}: {
  username: string
  displayName: string
  phone?: string | null
  email?: string | null
  website?: string | null
  jobTitle?: string | null
  organization?: string | null
  className?: string
}) {
  const handleSave = () => {
    const lines = [
      'BEGIN:VCARD',
      'VERSION:3.0',
      `FN:${displayName}`,
      organization ? `ORG:${organization}` : '',
      jobTitle ? `TITLE:${jobTitle}` : '',
      phone ? `TEL;TYPE=CELL:${phone}` : '',
      email ? `EMAIL:${email}` : '',
      website ? `URL:${website}` : '',
      'END:VCARD',
    ].filter(Boolean)

    const blob = new Blob([lines.join('\n')], { type: 'text/vcard' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${displayName || username}.vcf`
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)

    track(username, 'CONTACT_SAVE')
  }

  return (
    <button onClick={handleSave} className={className}>
      <Download size={16} /> Save Contact
    </button>
  )
}

export function LeadForm({ username, className }: { username: string; className?: string }) {
  const [form, setForm] = useState({ name: '', phone: '', email: '', message: '' })
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus('sending')
    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, ...form }),
      })
      if (!res.ok) throw new Error()
      setStatus('sent')
    } catch {
      setStatus('error')
    }
  }

  if (status === 'sent') {
    return (
      <div className={`${className} flex flex-col items-center gap-2 text-center py-6`}>
        <CheckCircle2 className="text-green-500" size={32} />
        <p className="font-semibold">Thanks! Your message was sent.</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className={`${className} space-y-3`}>
      <input
        required
        placeholder="Your name"
        value={form.name}
        onChange={(e) => setForm({ ...form, name: e.target.value })}
        className="w-full px-4 py-3 rounded-lg bg-white/90 text-black outline-none"
      />
      <input
        placeholder="Phone"
        value={form.phone}
        onChange={(e) => setForm({ ...form, phone: e.target.value })}
        className="w-full px-4 py-3 rounded-lg bg-white/90 text-black outline-none"
      />
      <input
        type="email"
        placeholder="Email"
        value={form.email}
        onChange={(e) => setForm({ ...form, email: e.target.value })}
        className="w-full px-4 py-3 rounded-lg bg-white/90 text-black outline-none"
      />
      <textarea
        placeholder="Message"
        value={form.message}
        onChange={(e) => setForm({ ...form, message: e.target.value })}
        className="w-full px-4 py-3 rounded-lg bg-white/90 text-black outline-none min-h-[80px]"
      />
      <button
        type="submit"
        disabled={status === 'sending'}
        className="w-full flex items-center justify-center gap-2 bg-black text-white py-3 rounded-lg font-semibold disabled:opacity-60"
      >
        <Send size={16} /> {status === 'sending' ? 'Sending...' : 'Send'}
      </button>
      {status === 'error' && <p className="text-red-300 text-sm text-center">Something went wrong. Please try again.</p>}
    </form>
  )
}

export function trackEvent(username: string, type: string, meta?: Record<string, unknown>) {
  track(username, type, meta)
}

type VariantGroup = { name: string; options: string[] }

function waLinkInternal(phone: string, message: string) {
  const digits = phone.replace(/[^\d]/g, '')
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`
}

export function StoreProductCard({
  username, whatsapp, id, name, imageUrl, price, discountPrice, availability, variantsJson, cardClassName = 'bg-black/5 rounded-2xl',
}: {
  username: string
  whatsapp: string | null
  id: string
  name: string
  imageUrl: string | null
  price: number
  discountPrice: number | null
  availability: string
  variantsJson: string | null
  cardClassName?: string
}) {
  const groups: VariantGroup[] = (() => {
    if (!variantsJson) return []
    try { return JSON.parse(variantsJson) } catch { return [] }
  })()

  const [selected, setSelected] = useState<Record<string, string>>(
    Object.fromEntries(groups.map((g) => [g.name, g.options[0] || '']))
  )

  useEffect(() => {
    track(username, 'PRODUCT_VIEW', { productId: id })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  const finalPrice = discountPrice ?? price
  const variantSummary = Object.entries(selected).filter(([, v]) => v).map(([k, v]) => `${k}: ${v}`).join(', ')

  return (
    <div className={`overflow-hidden ${cardClassName}`}>
      <div className="aspect-square bg-black/10 flex items-center justify-center">
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={imageUrl} alt={name} className="w-full h-full object-cover" />
        ) : (
          <ImageIcon size={28} className="opacity-30" />
        )}
      </div>
      <div className="p-3 space-y-1.5">
        <p className="font-semibold text-sm truncate">{name}</p>
        <p className="text-sm font-bold">
          &#8358;{finalPrice.toLocaleString()}
          {discountPrice && <span className="text-xs opacity-50 line-through ml-1">&#8358;{price.toLocaleString()}</span>}
        </p>

        {groups.map((g) => (
          <select
            key={g.name}
            value={selected[g.name] || ''}
            onChange={(e) => setSelected({ ...selected, [g.name]: e.target.value })}
            className="w-full text-xs bg-white/70 rounded-lg px-2 py-1 outline-none"
          >
            {g.options.map((opt) => <option key={opt} value={opt}>{g.name}: {opt}</option>)}
          </select>
        ))}

        {availability === 'out_of_stock' ? (
          <span className="text-xs opacity-60 block">Out of stock</span>
        ) : availability === 'coming_soon' ? (
          <span className="text-xs opacity-60 block">Coming soon</span>
        ) : whatsapp ? (
          <a
            href={waLinkInternal(whatsapp, `Hi, I'd like to order "${name}"${variantSummary ? ` (${variantSummary})` : ''} — ₦${finalPrice.toLocaleString()}.`)}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => track(username, 'ADD_TO_CART', { productId: id, variants: selected })}
            className="mt-1 block text-center text-xs font-semibold py-1.5 rounded-full bg-black text-white"
          >
            Order
          </a>
        ) : null}
      </div>
    </div>
  )
}
