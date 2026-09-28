'use client'

import Link from 'next/link'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { useState, useEffect, Suspense } from 'react'
import { Logo } from '@/components/Logo'
import { NotificationBell } from '@/components/NotificationBell'
import {
  LayoutDashboard, Package, ClipboardList, CreditCard, Truck, Users, MessageSquareText,
  LogOut, Menu, X, Crown, Megaphone, BarChart3, Search, ChevronDown, ChevronRight, ExternalLink, MessageCircle,
} from 'lucide-react'

type AdminUser = {
  username: string
  displayName: string | null
  avatarUrl: string | null
}

function AdminLayoutContent({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [me, setMe] = useState<AdminUser | null>(null)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [supportUnread, setSupportUnread] = useState(0)

  useEffect(() => {
    const loadSupportUnread = () => {
      fetch('/api/admin/support').then((res) => res.json()).then((data) => {
        if (data.conversations) {
          setSupportUnread(data.conversations.reduce((sum: number, c: { unreadCount: number }) => sum + c.unreadCount, 0))
        }
      })
    }
    loadSupportUnread()
    const interval = setInterval(loadSupportUnread, 20000)
    return () => clearInterval(interval)
  }, [])
  const [openGroups, setOpenGroups] = useState<Set<string>>(
    new Set([
      ...(pathname.startsWith('/admin/users') ? ['Users'] : []),
      ...(pathname.startsWith('/admin/products') || pathname.startsWith('/admin/categories') ? ['Products'] : []),
    ])
  )
  const toggleGroup = (name: string) => {
    setOpenGroups((prev) => {
      const next = new Set(prev)
      if (next.has(name)) next.delete(name)
      else next.add(name)
      return next
    })
  }

  useEffect(() => {
    fetch('/api/auth/me')
      .then(res => res.json())
      .then(data => setMe(data.user || null))
      .catch(() => setMe(null))
  }, [])

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
    router.refresh()
  }

  const navItems = [
    { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
    {
      name: 'Users', icon: Users, sub: [
        { name: 'All Users', href: '/admin/users' },
        { name: 'Individuals', href: '/admin/users?type=individual' },
        { name: 'Businesses', href: '/admin/users?type=business_admin' },
        { name: 'Employees', href: '/admin/users?type=employee' },
      ],
    },
    {
      name: 'Products', icon: Package, sub: [
        { name: 'All Products', href: '/admin/products' },
        { name: 'Categories', href: '/admin/categories' },
      ],
    },
    { name: 'Orders', href: '/admin/orders', icon: ClipboardList },
    { name: 'NFC Cards', href: '/admin/cards', icon: CreditCard },
    { name: 'Subscriptions', href: '/admin/subscriptions', icon: Crown },
    { name: 'Leads', href: '/admin/leads', icon: MessageSquareText },
    { name: 'Support', href: '/admin/support', icon: MessageCircle, badge: supportUnread },
    { name: 'Analytics', href: '/admin/analytics', icon: BarChart3 },
    { name: 'Delivery', href: '/admin/delivery-zones', icon: Truck },
    { name: 'Notifications', href: '/admin/notifications', icon: Megaphone },
  ]

  const isActive = (href: string) => {
    const [path, query] = href.split('?')
    if (pathname !== path) return false
    return (query || '') === searchParams.toString()
  }

  const SidebarContent = (
    <div className="flex flex-col h-full">
      <Link href="/admin" className="flex items-center gap-2 px-6 py-6">
        <Logo className="h-8 w-auto" />
      </Link>

      <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon
          if (item.sub) {
            const groupActive = item.sub.some((s) => pathname.startsWith(s.href.split('?')[0]))
            const open = openGroups.has(item.name)
            return (
              <div key={item.name}>
                <button
                  onClick={() => toggleGroup(item.name)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-sm transition-colors ${
                    groupActive ? 'bg-white text-black' : 'text-white/60 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Icon size={18} />
                  <span className="flex-1 text-left">{item.name}</span>
                  {open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                </button>
                {open && (
                  <div className="ml-6 mt-1 space-y-1 border-l border-white/10 pl-3">
                    {item.sub.map((s) => (
                      <Link
                        key={s.href}
                        href={s.href}
                        onClick={() => setMobileOpen(false)}
                        className={`block px-3 py-1.5 rounded-lg text-sm transition-colors ${
                          isActive(s.href) ? 'text-white font-semibold' : 'text-white/50 hover:text-white'
                        }`}
                      >
                        {s.name}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )
          }
          const active = isActive(item.href!)
          return (
            <Link
              key={item.name}
              href={item.href!}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-sm transition-colors ${
                active ? 'bg-white text-black' : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              <Icon size={18} />
              <span className="flex-1">{item.name}</span>
              {!!item.badge && (
                <span className="min-w-[20px] h-5 px-1 rounded-full bg-red-500 text-white text-[11px] font-bold flex items-center justify-center">
                  {item.badge > 9 ? '9+' : item.badge}
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      <div className="p-4">
        <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
          <p className="font-semibold text-sm text-white mb-1">Need Help?</p>
          <p className="text-xs text-white/50 mb-3">Visit our Help Center or contact support team.</p>
          <a
            href="mailto:hello@tapconnect.ng"
            className="flex items-center justify-center gap-1.5 bg-white text-black text-xs font-semibold rounded-full py-2.5 hover:bg-white/90 transition-colors"
          >
            Get Support &rarr;
          </a>
        </div>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-[#F3F3F1] lg:flex">
      <aside className="hidden lg:block w-64 shrink-0 bg-[#0A0A0A] fixed inset-y-0 left-0">
        {SidebarContent}
      </aside>

      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="relative w-72 bg-[#0A0A0A]">
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute right-3 top-6 p-1.5 text-white/60 hover:text-white"
              aria-label="Close menu"
            >
              <X size={20} />
            </button>
            {SidebarContent}
          </div>
          <div className="flex-1 bg-black/40" onClick={() => setMobileOpen(false)} />
        </div>
      )}

      <div className="flex-1 lg:ml-64 min-w-0">
        <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
          <div className="px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
            <button className="lg:hidden p-2 shrink-0" onClick={() => setMobileOpen(true)}>
              <Menu size={22} />
            </button>

            <div className="hidden sm:flex items-center flex-1 max-w-md bg-gray-100 rounded-lg px-3 py-2.5">
              <Search size={16} className="text-gray-400 mr-2 shrink-0" />
              <input
                type="text"
                placeholder="Search users, businesses, orders, cards..."
                className="bg-transparent outline-none text-sm w-full text-black placeholder:text-gray-400"
              />
            </div>

            <div className="flex items-center gap-3 ml-auto">
              <NotificationBell />
              <div className="relative">
                <button onClick={() => setMenuOpen(!menuOpen)} className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-full bg-black overflow-hidden flex items-center justify-center text-sm font-bold text-white shrink-0">
                    {me?.avatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={me.avatarUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                      (me?.displayName || me?.username || 'A').charAt(0).toUpperCase()
                    )}
                  </div>
                  <div className="hidden sm:block text-left">
                    <p className="text-sm font-semibold leading-tight text-black">{me?.displayName || me?.username || 'Admin'}</p>
                    <p className="text-xs text-gray-600 leading-tight">Platform Administrator</p>
                  </div>
                  <ChevronDown size={16} className="text-gray-400 hidden sm:block" />
                </button>

                {menuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-100 py-1 z-50">
                    <a href="/" target="_blank" rel="noopener noreferrer" onClick={() => setMenuOpen(false)} className="flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-gray-50">
                      <ExternalLink size={14} /> View Website
                    </a>
                    <button onClick={handleLogout} className="w-full text-left flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50">
                      <LogOut size={14} /> Sign out
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        <main className="p-4 sm:p-6 max-w-7xl mx-auto">
          {children}
        </main>
      </div>
    </div>
  )
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={null}>
      <AdminLayoutContent>{children}</AdminLayoutContent>
    </Suspense>
  )
}
