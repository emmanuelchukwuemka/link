'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Store, Briefcase, Image as ImageIcon } from 'lucide-react'

const TABS = [
  { name: 'Store', href: '/dashboard/store', icon: Store },
  { name: 'Services', href: '/dashboard/services', icon: Briefcase },
  { name: 'Portfolio', href: '/dashboard/portfolio', icon: ImageIcon },
]

export function ProductsServicesTabs() {
  const pathname = usePathname()

  return (
    <div className="flex items-center gap-2 mb-6 border-b border-gray-200 -mt-2">
      {TABS.map(({ name, href, icon: Icon }) => {
        const active = pathname.startsWith(href)
        return (
          <Link
            key={href}
            href={href}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold border-b-2 -mb-px transition-colors ${
              active ? 'border-black text-black' : 'border-transparent text-gray-500 hover:text-black'
            }`}
          >
            <Icon size={15} /> {name}
          </Link>
        )
      })}
    </div>
  )
}
