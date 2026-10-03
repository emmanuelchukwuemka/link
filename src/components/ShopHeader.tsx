'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import {
  Truck, Heart, User, ChevronDown, HelpCircle, PhoneCall,
  ShoppingBag,
} from 'lucide-react'
import { Logo } from '@/components/Logo'
import { CartBadge } from '@/app/LandingInteractive'
import { ShopSearchForm } from '@/components/ShopSearchForm'

export function ShopHeader({ active = 'Shop' }: { active?: string }) {
  const [accountOpen, setAccountOpen] = useState(false)
  const [helpOpen, setHelpOpen] = useState(false)
  const accountRef = useRef<HTMLDivElement>(null)
  const helpRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (accountRef.current && !accountRef.current.contains(e.target as Node)) {
        setAccountOpen(false)
      }
      if (helpRef.current && !helpRef.current.contains(e.target as Node)) {
        setHelpOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <header className="sticky top-0 z-40 shadow-xs bg-[#181818]">
      {/* Top micro announcement bar */}
      <div className="bg-[#101010] text-[#FFFFFF] text-[11px] py-2 px-4 hidden sm:block">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3 text-[#A8A49D]">
            <span className="font-semibold tracking-wide text-[#D4D0C9]">Free delivery on orders over &#8358;30,000</span>
            <span className="w-px h-3 bg-white/15" />
            <Link href="/register?type=business" className="hover:text-white transition-colors">
              Sell on TapConnect
            </Link>
          </div>
          <div className="flex items-center gap-4 text-[#A8A49D]">
            <a href="tel:08008272666" className="hover:text-white flex items-center gap-1.5 transition-colors">
              <PhoneCall size={11} /> 0800-TAPCONNECT
            </a>
            <span className="w-px h-3 bg-white/15" />
            <Link href="/track-order" className="hover:text-white flex items-center gap-1.5 transition-colors">
              <Truck size={11} /> Track Order
            </Link>
            <span className="w-px h-3 bg-white/15" />
            <span>Nigeria &middot; NGN &#8358;</span>
          </div>
        </div>
      </div>

      {/* Main Brand Header Bar */}
      <div className="bg-[#181818] text-[#FFFFFF] border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center gap-4 sm:gap-8">
          {/* Brand Logo */}
          <Link href="/marketplace" className="flex items-center gap-2 shrink-0 group">
            <Logo className="h-7 sm:h-8" invert={false} />
            <span className="hidden md:inline-block text-[#8A8782] text-[10px] font-bold uppercase tracking-[0.15em] border-l border-white/15 pl-2 ml-0.5 group-hover:text-white transition-colors">
              Shop
            </span>
          </Link>

          {/* Central Search Form */}
          <ShopSearchForm />

          {/* Action Buttons */}
          <div className="flex items-center gap-0.5 sm:gap-1 shrink-0 ml-auto text-[#FFFFFF]">
            {/* Account Dropdown */}
            <div className="relative" ref={accountRef}>
              <button
                onClick={() => setAccountOpen(!accountOpen)}
                className="flex items-center gap-1.5 py-2 px-2.5 sm:px-3 rounded-full hover:bg-white/10 text-white font-semibold text-sm transition-colors"
                aria-expanded={accountOpen}
              >
                <User size={18} className="text-[#D4D0C9]" />
                <span className="hidden md:inline">Account</span>
                <ChevronDown size={14} className={`text-[#D4D0C9] transition-transform ${accountOpen ? 'rotate-180' : ''}`} />
              </button>

              {accountOpen && (
                <div className="absolute right-0 top-full mt-1.5 w-56 bg-white text-[#181818] rounded-lg shadow-xl border border-[#D4D0C9] py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="px-4 py-2 border-b border-[#D4D0C9]">
                    <Link
                      href="/login"
                      className="w-full bg-[#181818] hover:bg-[#181818]/90 text-white text-center font-bold text-xs py-2 rounded-md block shadow-xs transition-colors"
                    >
                      SIGN IN
                    </Link>
                    <p className="text-[11px] text-[#66635F] text-center mt-1.5">
                      New customer? <Link href="/register" className="text-[#181818] font-bold hover:underline">Register</Link>
                    </p>
                  </div>
                  <div className="py-1 text-xs">
                    <Link href="/dashboard" className="flex items-center gap-2.5 px-4 py-2 text-[#181818] hover:bg-[#E8E5E0]">
                      <User size={15} className="text-[#66635F]" /> My Profile &amp; Dashboard
                    </Link>
                    <Link href="/dashboard/appearance" className="flex items-center gap-2.5 px-4 py-2 text-[#181818] hover:bg-[#E8E5E0]">
                      <ShoppingBag size={15} className="text-[#66635F]" /> My Orders &amp; TapConnect Cards
                    </Link>
                    <Link href="/wishlist" className="flex items-center gap-2.5 px-4 py-2 text-[#181818] hover:bg-[#E8E5E0]">
                      <Heart size={15} className="text-[#66635F]" /> Saved Items / Wishlist
                    </Link>
                    <Link href="/track-order" className="flex items-center gap-2.5 px-4 py-2 text-[#181818] hover:bg-[#E8E5E0]">
                      <Truck size={15} className="text-[#66635F]" /> Track Ongoing Order
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* Help Dropdown */}
            <div className="relative hidden lg:block" ref={helpRef}>
              <button
                onClick={() => setHelpOpen(!helpOpen)}
                className="flex items-center gap-1.5 py-2 px-3 rounded-full hover:bg-white/10 text-white font-semibold text-sm transition-colors"
                aria-expanded={helpOpen}
              >
                <HelpCircle size={18} className="text-[#D4D0C9]" />
                <span>Help</span>
                <ChevronDown size={14} className={`text-[#D4D0C9] transition-transform ${helpOpen ? 'rotate-180' : ''}`} />
              </button>

              {helpOpen && (
                <div className="absolute right-0 top-full mt-1.5 w-60 bg-white text-[#181818] rounded-lg shadow-xl border border-[#D4D0C9] py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="py-1 text-xs">
                    <Link href="/#faq" className="block px-4 py-2 text-[#181818] hover:bg-[#E8E5E0] font-medium">
                      Help Center &amp; FAQs
                    </Link>
                    <Link href="/track-order" className="block px-4 py-2 text-[#181818] hover:bg-[#E8E5E0] font-medium">
                      Track an Order
                    </Link>
                    <Link href="/#contact" className="block px-4 py-2 text-[#181818] hover:bg-[#E8E5E0] font-medium">
                      Payment &amp; Delivery Options
                    </Link>
                    <div className="border-t border-[#D4D0C9] my-1 pt-1">
                      <a
                        href="https://wa.me/2348008272666"
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center justify-center gap-1.5 mx-3 my-1 bg-[#181818] hover:bg-[#181818]/90 text-white font-bold py-1.5 px-3 rounded text-xs transition-colors"
                      >
                        💬 Chat on WhatsApp
                      </a>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Wishlist Link */}
            <Link
              href="/wishlist"
              aria-label="Wishlist"
              className="hidden sm:flex items-center gap-1.5 py-2 px-2.5 rounded-full hover:bg-white/10 text-white font-semibold text-sm transition-colors"
            >
              <Heart size={18} className="text-[#D4D0C9]" />
              <span className="hidden xl:inline">Saved</span>
            </Link>

            <span className="hidden sm:block w-px h-5 bg-white/10 mx-1" />

            {/* Cart Button */}
            <CartBadge invert={false} />
          </div>
        </div>
      </div>
    </header>
  )
}
