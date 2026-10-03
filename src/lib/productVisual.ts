import {
  Nfc, CreditCard, Shield, Sparkles, Watch, CircleDot,
  KeyRound, StickyNote, Store, Wallet, Briefcase, Trees,
  type LucideIcon,
} from 'lucide-react'

export interface CategoryVisual {
  icon: LucideIcon
  bgGradient: string
  accentColor: string
  badgeLabel: string
}

export const CATEGORY_VISUALS: Record<string, CategoryVisual> = {
  'Smart NFC Cards': {
    icon: CreditCard,
    bgGradient: 'from-slate-900 via-slate-800 to-zinc-900',
    accentColor: '#181818',
    badgeLabel: 'NFC Card',
  },
  'Luxury Metal Cards': {
    icon: Shield,
    bgGradient: 'from-amber-950 via-zinc-900 to-black',
    accentColor: '#181818',
    badgeLabel: 'Metal Series',
  },
  'Eco Wooden Cards': {
    icon: Trees,
    bgGradient: 'from-stone-900 via-yellow-950 to-stone-800',
    accentColor: '#181818',
    badgeLabel: 'Eco Bamboo',
  },
  'Smart Wearables & Bands': {
    icon: Watch,
    bgGradient: 'from-cyan-950 via-slate-900 to-black',
    accentColor: '#181818',
    badgeLabel: 'Wearable',
  },
  'Smart Rings': {
    icon: CircleDot,
    bgGradient: 'from-purple-950 via-zinc-900 to-black',
    accentColor: '#181818',
    badgeLabel: 'Smart Ring',
  },
  'Keychains & Smart Fobs': {
    icon: KeyRound,
    bgGradient: 'from-blue-950 via-slate-900 to-neutral-900',
    accentColor: '#181818',
    badgeLabel: 'Smart Fob',
  },
  'Stickers & Micro Tags': {
    icon: StickyNote,
    bgGradient: 'from-emerald-950 via-zinc-900 to-black',
    accentColor: '#181818',
    badgeLabel: 'Micro Tag',
  },
  'Desk Stands & QR Displays': {
    icon: Store,
    bgGradient: 'from-orange-950 via-stone-900 to-black',
    accentColor: '#181818',
    badgeLabel: 'Desk Stand',
  },
  'Wallets & RFID Protection': {
    icon: Wallet,
    bgGradient: 'from-zinc-900 via-neutral-900 to-stone-950',
    accentColor: '#181818',
    badgeLabel: 'RFID Shield',
  },
  'Executive & Business Bundles': {
    icon: Briefcase,
    bgGradient: 'from-red-950 via-zinc-900 to-black',
    accentColor: '#181818',
    badgeLabel: 'VIP Bundle',
  },
}

export function getCategoryVisual(category: string): CategoryVisual {
  return CATEGORY_VISUALS[category] || {
    icon: Nfc,
    bgGradient: 'from-gray-900 to-black',
    accentColor: '#181818',
    badgeLabel: 'TapConnect',
  }
}

export function fallbackVisual(category: string): { icon: LucideIcon } | { photo: string } {
  if (category === 'Smart NFC Cards' || category === 'TapConnect Cards') return { photo: '/step-1-card.jpg' }
  const vis = getCategoryVisual(category)
  return { icon: vis.icon }
}
