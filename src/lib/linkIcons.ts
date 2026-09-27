import {
  Link2, Globe, MessageCircle, Calendar, Briefcase, ShoppingBag,
  Mail, Phone, Video, Music2, Camera, Star,
} from 'lucide-react'

export const LINK_ICONS = {
  link: Link2,
  website: Globe,
  whatsapp: MessageCircle,
  booking: Calendar,
  portfolio: Briefcase,
  shop: ShoppingBag,
  email: Mail,
  phone: Phone,
  video: Video,
  music: Music2,
  photo: Camera,
  featured: Star,
} as const

export type LinkIconName = keyof typeof LINK_ICONS

export const LINK_ICON_NAMES = Object.keys(LINK_ICONS) as LinkIconName[]

export function getLinkIcon(name: string | null | undefined) {
  return LINK_ICONS[(name as LinkIconName) || 'link'] || Link2
}
