import { Nfc, type LucideIcon } from 'lucide-react'

// Only real product photography we have is the NFC card shot supplied for the
// "How It Works" section — reused here since it's a genuine card photo, just
// not per-material (Metal/Leather/etc. still show the brand icon, not a photo
// claiming to be that specific material). Every other product without a real
// photo falls back to the same NFC icon, matching the icon language used
// elsewhere on the site (hero, "How It Works" steps) rather than a different
// icon per product type.
export function fallbackVisual(category: string): { icon: LucideIcon } | { photo: string } {
  if (category === 'NFC Cards') return { photo: '/step-1-card.jpg' }
  return { icon: Nfc }
}
