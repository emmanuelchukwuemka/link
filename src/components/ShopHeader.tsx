import Link from 'next/link'
import { Home } from 'lucide-react'
import { Logo } from '@/components/Logo'
import { CartBadge } from '@/app/LandingInteractive'

export function ShopHeader() {
  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center">
          <Logo className="h-8" invert />
        </Link>
        <nav className="flex items-center gap-2 sm:gap-4">
          <Link href="/" className="hidden sm:flex items-center gap-1.5 text-sm font-semibold text-gray-600 hover:text-black px-3 py-2 rounded-full hover:bg-gray-100 transition-colors">
            <Home size={15} /> Home
          </Link>
          <Link href="/marketplace" className="text-sm font-semibold text-gray-600 hover:text-black px-3 py-2 rounded-full hover:bg-gray-100 transition-colors">
            Shop
          </Link>
          <CartBadge invert />
        </nav>
      </div>
    </header>
  )
}
