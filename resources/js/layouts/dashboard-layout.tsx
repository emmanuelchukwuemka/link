import { useState, useEffect } from 'react';
import { Link, router, usePage } from '@inertiajs/react';
import { Logo } from '@/components/logo';
import { NotificationBell } from '@/components/notification-bell';
import { ProfileSwitcher } from '@/components/profile-switcher';
import { SupportChatWidget } from '@/components/support-chat-widget';
import { ImageWithFallback } from '@/components/image-with-fallback';
import { apiFetch } from '@/lib/api';
import {
    LayoutDashboard,
    Link as LinkIcon,
    User,
    Settings,
    LogOut,
    CreditCard,
    Store,
    MessageSquareText,
    Building2,
    Crown,
    Menu,
    X,
    Package,
    BarChart3,
    Search,
    Headphones,
    ChevronDown,
    ChevronRight,
} from 'lucide-react';

type CurrentUser = {
    username: string;
    name: string | null;
    avatar_url: string | null;
    account_type: string;
    plan: string;
};

function planLabel(user: CurrentUser | null): string {
    if (!user) return '';
    if (user.account_type === 'business_admin' || user.account_type === 'employee') return 'Business Plan';
    return user.plan === 'pro' ? 'Pro Plan' : 'Individual Plan';
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const { url } = usePage();
    const pathname = url.split('?')[0];
    const [me, setMe] = useState<CurrentUser | null>(null);
    const [mobileOpen, setMobileOpen] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);
    const [openGroups, setOpenGroups] = useState<Set<string>>(
        new Set(pathname.startsWith('/dashboard/store') || pathname.startsWith('/dashboard/services') || pathname.startsWith('/dashboard/portfolio') ? ['Products & Services'] : []),
    );
    const toggleGroup = (name: string) => {
        setOpenGroups((prev) => {
            const next = new Set(prev);
            if (next.has(name)) next.delete(name);
            else next.add(name);
            return next;
        });
    };

    useEffect(() => {
        fetch('/api/auth/me')
            .then((res) => res.json())
            .then((data) => setMe(data.user || null))
            .catch(() => setMe(null));
    }, []);

    const handleLogout = async () => {
        await apiFetch('/logout');
        router.visit('/login');
    };

    const navItems = [
        { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
        { name: 'My Links', href: '/dashboard/links', icon: LinkIcon },
        { name: 'Appearance', href: '/dashboard/appearance', icon: User },
        { name: 'My Cards', href: '/dashboard/cards', icon: CreditCard },
        {
            name: 'Products & Services',
            icon: Store,
            sub: [
                { name: 'Store', href: '/dashboard/store' },
                { name: 'Services', href: '/dashboard/services' },
                { name: 'Portfolio', href: '/dashboard/portfolio' },
                { name: 'Categories', href: '/dashboard/store/categories' },
            ],
        },
        { name: 'Orders', href: '/dashboard/orders', icon: Package },
        { name: 'Leads', href: '/dashboard/leads', icon: MessageSquareText },
        { name: 'Analytics', href: '/dashboard/analytics', icon: BarChart3 },
        ...(me?.account_type === 'business_admin' ? [{ name: 'Business', href: '/dashboard/business', icon: Building2 }] : []),
        { name: 'Subscription', href: '/dashboard/subscription', icon: Crown },
        { name: 'Settings', href: '/dashboard/settings', icon: Settings },
    ];

    const isActive = (href: string) => (href === '/dashboard' ? pathname === href : pathname.startsWith(href));

    // For a group's sub-items, a nested route (e.g. /dashboard/store/categories) should only
    // highlight its own, most specific entry — not also the parent it happens to start with.
    const isSubActive = (href: string, siblingHrefs: string[]) => {
        const matches = siblingHrefs.filter((h) => pathname === h || pathname.startsWith(h + '/'));
        if (matches.length === 0) return false;
        const mostSpecific = [...matches].sort((a, b) => b.length - a.length)[0];
        return mostSpecific === href;
    };

    const SidebarContent = (
        <div className="flex flex-col h-full">
            <Link href="/" className="flex items-center px-6 py-6">
                <Logo className="h-8 w-auto" />
            </Link>

            <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
                {navItems.map((item) => {
                    const Icon = item.icon;
                    if (item.sub) {
                        const groupActive = item.sub.some((s) => isSubActive(s.href, item.sub!.map((x) => x.href)));
                        const open = openGroups.has(item.name);
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
                                                    isSubActive(s.href, item.sub!.map((x) => x.href)) ? 'text-white font-semibold' : 'text-white/50 hover:text-white'
                                                }`}
                                            >
                                                {s.name}
                                            </Link>
                                        ))}
                                    </div>
                                )}
                            </div>
                        );
                    }
                    const active = isActive(item.href!);
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
                            {item.name}
                        </Link>
                    );
                })}
            </nav>

            <div className="p-4">
                <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                    <span className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center mb-3">
                        <Headphones size={16} className="text-white" />
                    </span>
                    <p className="font-semibold text-sm text-white mb-1">Need Help?</p>
                    <p className="text-xs text-white/50 mb-3">Visit our Help Center or chat with our support team.</p>
                    <a
                        href="mailto:hello@tapconnect.ng"
                        className="flex items-center justify-center gap-1.5 bg-white text-black text-xs font-semibold rounded-full py-2.5 hover:bg-white/90 transition-colors"
                    >
                        Get Support &rarr;
                    </a>
                </div>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-[#F3F3F1] lg:flex">
            {/* Desktop sidebar */}
            <aside className="hidden lg:block w-64 shrink-0 bg-[#0A0A0A] fixed inset-y-0 left-0">{SidebarContent}</aside>

            {/* Mobile sidebar drawer */}
            {mobileOpen && (
                <div className="lg:hidden fixed inset-0 z-50 flex">
                    <div className="relative w-72 bg-[#0A0A0A]">
                        <button onClick={() => setMobileOpen(false)} className="absolute right-3 top-6 p-1.5 text-white/60 hover:text-white" aria-label="Close menu">
                            <X size={20} />
                        </button>
                        {SidebarContent}
                    </div>
                    <div className="flex-1 bg-black/40" onClick={() => setMobileOpen(false)} />
                </div>
            )}

            <div className="flex-1 lg:ml-64 min-w-0">
                {/* Top bar */}
                <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
                    <div className="px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
                        <button className="lg:hidden p-2 shrink-0" onClick={() => setMobileOpen(true)}>
                            <Menu size={22} />
                        </button>

                        <div className="hidden sm:flex items-center flex-1 max-w-md bg-gray-100 rounded-lg px-3 py-2.5">
                            <Search size={16} className="text-gray-400 mr-2 shrink-0" />
                            <input type="text" placeholder="Search anything..." className="bg-transparent outline-none text-sm w-full text-black placeholder:text-gray-400" />
                        </div>

                        <div className="flex items-center gap-3 ml-auto">
                            <ProfileSwitcher />
                            <NotificationBell />
                            <div className="relative">
                                <button onClick={() => setMenuOpen(!menuOpen)} className="flex items-center gap-2">
                                    <div className="w-9 h-9 rounded-full bg-black overflow-hidden flex items-center justify-center text-sm font-bold text-white shrink-0">
                                        <ImageWithFallback src={me?.avatar_url} alt="" className="w-full h-full object-cover" fallback={(me?.name || me?.username || 'U').charAt(0).toUpperCase()} />
                                    </div>
                                    <div className="hidden sm:block text-left">
                                        <p className="text-sm font-semibold leading-tight text-black">{me?.name || me?.username}</p>
                                        <p className="text-xs text-gray-600 leading-tight">{planLabel(me)}</p>
                                    </div>
                                    <ChevronDown size={16} className="text-gray-400 hidden sm:block" />
                                </button>

                                {menuOpen && (
                                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-100 py-1 z-50">
                                        <a href={`/${me?.username}`} target="_blank" rel="noopener noreferrer" onClick={() => setMenuOpen(false)} className="block px-4 py-2.5 text-sm hover:bg-gray-50">
                                            View Public Profile
                                        </a>
                                        <Link href="/dashboard/settings" onClick={() => setMenuOpen(false)} className="block px-4 py-2.5 text-sm hover:bg-gray-50">
                                            Settings
                                        </Link>
                                        <button onClick={handleLogout} className="w-full text-left flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50">
                                            <LogOut size={14} /> Sign out
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </header>

                <main className="p-4 sm:p-6 max-w-7xl mx-auto">{children}</main>
            </div>

            <SupportChatWidget />
        </div>
    );
}
