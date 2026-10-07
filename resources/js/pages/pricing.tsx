import { Head, Link } from '@inertiajs/react';
import { ArrowRight, Check, Minus, Crown, Link2, BarChart3, MessageSquareText, Sparkles, Users, Building2, ChevronDown } from 'lucide-react';
import { Logo } from '@/components/logo';
import { Reveal } from '@/components/reveal';

const PRO_PLAN_PRICE_NAIRA = 10000;
const FREE_LINK_LIMIT = 5;

type BusinessPlanName = 'free' | 'tier10' | 'tier25' | 'tier50' | 'tier100' | 'enterprise';

const BUSINESS_PLANS: Record<BusinessPlanName, { label: string; employeeLimit: number; priceNaira: number | null }> = {
    free: { label: 'Free', employeeLimit: 3, priceNaira: 0 },
    tier10: { label: 'Team 10', employeeLimit: 10, priceNaira: 50000 },
    tier25: { label: 'Team 25', employeeLimit: 25, priceNaira: 100000 },
    tier50: { label: 'Team 50', employeeLimit: 50, priceNaira: 180000 },
    tier100: { label: 'Team 100', employeeLimit: 100, priceNaira: 300000 },
    enterprise: { label: 'Enterprise', employeeLimit: Infinity, priceNaira: null },
};

const NAV_LINKS = [
    { label: 'Home', href: '/#top' },
    { label: 'Products', href: '/#products' },
    { label: 'How It Works', href: '/#how-it-works' },
    { label: 'Pricing', href: '/pricing' },
    { label: 'About', href: '/#about' },
    { label: 'Contact', href: '/#contact' },
];

const COMPARISON_ROWS: { feature: string; free: string | boolean; pro: string | boolean }[] = [
    { feature: 'Digital profile & QR code', free: true, pro: true },
    { feature: 'Social media links', free: true, pro: true },
    { feature: 'Custom links', free: `Up to ${FREE_LINK_LIMIT}`, pro: 'Unlimited' },
    { feature: 'Mini store & product catalogue', free: true, pro: true },
    { feature: 'Analytics dashboard', free: true, pro: true },
    { feature: 'Design templates', free: 'Minimal only', pro: 'All templates' },
    { feature: 'Custom fonts', free: false, pro: true },
    { feature: 'Gradient & image backgrounds', free: false, pro: true },
    { feature: 'Services listings', free: false, pro: true },
    { feature: 'Portfolio, gallery & testimonials', free: false, pro: true },
    { feature: 'Lead capture form', free: false, pro: true },
    { feature: 'Remove "TapConnect" branding', free: false, pro: true },
];

const INDIVIDUAL_PLANS = [
    {
        name: 'Free',
        price: '₦0',
        period: 'forever',
        highlight: false,
        tagline: 'Get your digital identity live in minutes.',
        features: ['Digital profile & QR code', `Up to ${FREE_LINK_LIMIT} custom links`, 'Mini store & analytics', 'Minimal template, solid colors'],
        href: '/register',
        cta: 'Get Started',
    },
    {
        name: 'Individual Pro',
        price: `₦${PRO_PLAN_PRICE_NAIRA.toLocaleString()}`,
        period: 'per year',
        highlight: true,
        tagline: 'For professionals who want the full toolkit.',
        features: ['Everything in Free, plus:', 'Unlimited links, all templates & fonts', 'Services, portfolio & testimonials', 'Lead capture form', 'No TapConnect branding'],
        href: '/register',
        cta: 'Go Pro',
    },
];

const BUSINESS_INCLUDED = [
    { icon: Users, text: 'A branded profile for every team member' },
    { icon: Building2, text: 'Centralized employee management & bulk onboarding' },
    { icon: BarChart3, text: 'Team-wide engagement analytics' },
    { icon: MessageSquareText, text: 'Shared leads dashboard across your team' },
    { icon: Link2, text: 'Bulk Digital Card assignment' },
];

const BUSINESS_ORDER: BusinessPlanName[] = ['tier10', 'tier25', 'tier50', 'tier100', 'enterprise'];
const RECOMMENDED_TIER: BusinessPlanName = 'tier25';

const FAQS = [
    {
        q: 'Do I need to buy a TapConnect Digital Card separately?',
        a: 'Yes. Your plan covers your digital profile software — templates, links, store, analytics and so on. The TapConnect Digital Card (powered by NFC + QR) is a physical product you order separately from our shop, then connect to your profile.',
    },
    {
        q: 'What happens if my Pro subscription expires?',
        a: 'Your profile stays live on the Free plan. Pro-only sections like Services, Portfolio and your lead capture form are automatically hidden until you renew — nothing is deleted, and everything reappears the moment you upgrade again.',
    },
    {
        q: 'Can I change my business plan later?',
        a: 'Yes, you can move up to a higher team-size tier at any time from your business dashboard as your team grows.',
    },
    {
        q: 'Do business plan tiers unlock different features?',
        a: 'No — every business tier includes the same team management, analytics and leads tools. The only difference between tiers is how many team members you can add.',
    },
    {
        q: 'Is there a contract or can I cancel anytime?',
        a: "Plans are billed yearly with no lock-in contract. If you don't renew, your account simply reverts to the Free plan at expiry.",
    },
];

export default function PricingPage() {
    return (
        <>
            <Head title="Pricing | TapConnect" />
            <main className="min-h-screen font-sans bg-white text-[#111111]">
                <div className="bg-[#0A0A0A] text-white">
                    <header className="max-w-[1504px] mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
                        <div className="flex items-center gap-10">
                            <Link href="/" className="flex items-center">
                                <Logo className="h-9 w-auto" invert={false} />
                            </Link>
                            <nav className="hidden lg:flex gap-7 font-medium text-white/70 text-sm">
                                {NAV_LINKS.map((l) => (
                                    <Link key={l.label} href={l.href} className={`hover:text-white transition-colors ${l.label === 'Pricing' ? 'text-white' : ''}`}>
                                        {l.label}
                                    </Link>
                                ))}
                            </nav>
                        </div>
                        <div className="flex items-center gap-2">
                            <Link href="/login" className="font-semibold text-sm px-4 py-2.5 rounded-full border border-white/25 hover:bg-white/10 transition-colors">
                                Login
                            </Link>
                            <Link href="/register" className="font-semibold text-sm px-4 py-2.5 rounded-full bg-white text-black hover:bg-white/90 transition-colors">
                                Get Started
                            </Link>
                        </div>
                    </header>

                    <section className="max-w-[1504px] mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-20 text-center">
                        <Reveal>
                            <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-white/50 border border-white/15 rounded-full px-4 py-1.5">Simple, Transparent Pricing</span>
                        </Reveal>
                        <Reveal delay={80}>
                            <h1 className="text-4xl sm:text-6xl font-bold leading-[1.05] tracking-tight max-w-3xl mx-auto mt-6">Pricing That Grows With You.</h1>
                        </Reveal>
                        <Reveal delay={160}>
                            <p className="text-lg text-white/60 leading-relaxed max-w-xl mx-auto mt-5">Start free, no card required. Upgrade whenever you need more from your TapConnect profile or your team.</p>
                        </Reveal>
                        <Reveal delay={240}>
                            <div className="flex flex-wrap justify-center gap-3 mt-8">
                                <a href="#individuals" className="inline-flex items-center gap-2 bg-white text-black px-5 py-2.5 rounded-full font-semibold text-sm hover:bg-white/90 transition-colors">
                                    <Users size={15} /> For Individuals
                                </a>
                                <a href="#business" className="inline-flex items-center gap-2 border border-white/25 px-5 py-2.5 rounded-full font-semibold text-sm hover:bg-white/10 transition-colors">
                                    <Building2 size={15} /> For Businesses
                                </a>
                            </div>
                        </Reveal>
                    </section>
                </div>

                <section id="individuals" className="py-24 px-4 sm:px-6 lg:px-8">
                    <div className="max-w-[1504px] mx-auto">
                        <Reveal className="text-center mb-14">
                            <p className="text-xs font-semibold uppercase tracking-widest text-[#6B6B6B] mb-3">For Individuals</p>
                            <h2 className="text-3xl sm:text-4xl font-bold max-w-xl mx-auto">One Profile. Two Ways to Show Up.</h2>
                        </Reveal>

                        <div className="grid sm:grid-cols-2 gap-6 max-w-3xl mx-auto mb-16">
                            {INDIVIDUAL_PLANS.map((plan, i) => (
                                <Reveal key={plan.name} delay={i * 100}>
                                    <div className={`rounded-3xl p-8 h-full flex flex-col transition-all duration-300 hover:-translate-y-1 ${plan.highlight ? 'bg-[#0A0A0A] text-white shadow-2xl' : 'bg-[#F7F7F5] text-[#111111] hover:shadow-lg'}`}>
                                        {plan.highlight && (
                                            <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest bg-white/10 rounded-full px-3 py-1 w-fit mb-4">
                                                <Crown size={12} /> Most Popular
                                            </span>
                                        )}
                                        <h3 className="font-bold text-lg">{plan.name}</h3>
                                        <p className={`text-sm mt-1 ${plan.highlight ? 'text-white/60' : 'text-[#6B6B6B]'}`}>{plan.tagline}</p>
                                        <div className="mt-4 mb-6">
                                            <span className="text-4xl font-bold">{plan.price}</span>
                                            <span className={`text-sm ml-1 ${plan.highlight ? 'text-white/50' : 'text-[#6B6B6B]'}`}>/{plan.period}</span>
                                        </div>
                                        <div className="space-y-3 mb-8 flex-1">
                                            {plan.features.map((f) => (
                                                <div key={f} className="flex items-center gap-2 text-sm">
                                                    <Check size={15} className={plan.highlight ? 'text-white' : 'text-black'} />
                                                    {f}
                                                </div>
                                            ))}
                                        </div>
                                        <Link href={plan.href} className={`inline-flex items-center justify-center gap-2 px-5 py-3 rounded-full font-semibold text-sm transition-colors ${plan.highlight ? 'bg-white text-black hover:bg-white/90' : 'bg-black text-white hover:bg-[#111111]'}`}>
                                            {plan.cta} <ArrowRight size={14} />
                                        </Link>
                                    </div>
                                </Reveal>
                            ))}
                        </div>

                        <Reveal>
                            <div className="max-w-3xl mx-auto bg-white rounded-3xl border border-[#E5E5E5] overflow-hidden">
                                <div className="grid grid-cols-[1fr_auto_auto] sm:grid-cols-[1fr_140px_140px] items-center px-5 sm:px-8 py-4 border-b border-[#E5E5E5] bg-[#F7F7F5]">
                                    <span className="text-xs font-semibold uppercase tracking-widest text-[#6B6B6B]">Compare Plans</span>
                                    <span className="text-sm font-bold text-center">Free</span>
                                    <span className="text-sm font-bold text-center flex items-center justify-center gap-1">
                                        <Crown size={13} className="text-amber-500" /> Pro
                                    </span>
                                </div>
                                {COMPARISON_ROWS.map((row) => (
                                    <div key={row.feature} className="grid grid-cols-[1fr_auto_auto] sm:grid-cols-[1fr_140px_140px] items-center px-5 sm:px-8 py-3.5 border-b border-[#F0F0EE] last:border-0 text-sm">
                                        <span>{row.feature}</span>
                                        <span className="flex justify-center">
                                            {typeof row.free === 'boolean' ? row.free ? <Check size={16} className="text-black" /> : <Minus size={14} className="text-[#B8B8B8]" /> : <span className="text-xs text-[#6B6B6B] text-center">{row.free}</span>}
                                        </span>
                                        <span className="flex justify-center">
                                            {typeof row.pro === 'boolean' ? row.pro ? <Check size={16} className="text-black" /> : <Minus size={14} className="text-[#B8B8B8]" /> : <span className="text-xs font-semibold text-center">{row.pro}</span>}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </Reveal>
                    </div>
                </section>

                <section id="business" className="py-24 px-4 sm:px-6 lg:px-8 bg-[#F7F7F5]">
                    <div className="max-w-[1504px] mx-auto">
                        <Reveal className="text-center mb-10">
                            <p className="text-xs font-semibold uppercase tracking-widest text-[#6B6B6B] mb-3">For Businesses</p>
                            <h2 className="text-3xl sm:text-4xl font-bold max-w-xl mx-auto">One Plan Type. Priced by Team Size.</h2>
                            <p className="text-[#6B6B6B] max-w-lg mx-auto mt-3">Every business tier includes the same tools &mdash; the only difference is how many team members you can add.</p>
                        </Reveal>

                        <Reveal delay={80}>
                            <div className="max-w-3xl mx-auto grid sm:grid-cols-2 gap-x-8 gap-y-3 mb-14 bg-white rounded-3xl p-6 sm:p-8 shadow-sm">
                                {BUSINESS_INCLUDED.map(({ icon: Icon, text }) => (
                                    <div key={text} className="flex items-center gap-3 text-sm">
                                        <span className="w-8 h-8 rounded-full bg-[#F7F7F5] flex items-center justify-center shrink-0">
                                            <Icon size={15} className="text-black" />
                                        </span>
                                        {text}
                                    </div>
                                ))}
                            </div>
                        </Reveal>

                        <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
                            {BUSINESS_ORDER.map((key, i) => {
                                const plan = BUSINESS_PLANS[key];
                                const recommended = key === RECOMMENDED_TIER;
                                return (
                                    <Reveal key={key} delay={i * 80}>
                                        <div className={`relative rounded-3xl p-6 flex flex-col h-full transition-all duration-300 hover:-translate-y-1 ${recommended ? 'bg-[#0A0A0A] text-white shadow-2xl' : 'bg-white shadow-sm hover:shadow-lg'}`}>
                                            {recommended && (
                                                <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-widest bg-white/10 rounded-full px-2.5 py-1 w-fit mb-3">
                                                    <Sparkles size={10} /> Recommended
                                                </span>
                                            )}
                                            <h3 className="font-bold">{plan.label}</h3>
                                            <div className="mt-2 mb-4">
                                                {plan.priceNaira !== null ? (
                                                    <>
                                                        <span className="text-2xl font-bold">₦{plan.priceNaira.toLocaleString()}</span>
                                                        <span className={`text-xs ml-1 ${recommended ? 'text-white/50' : 'text-[#6B6B6B]'}`}>/yr</span>
                                                    </>
                                                ) : (
                                                    <span className="text-lg font-bold">Contact Us</span>
                                                )}
                                            </div>
                                            <p className={`text-sm mb-6 flex-1 ${recommended ? 'text-white/60' : 'text-[#6B6B6B]'}`}>Up to {plan.employeeLimit === Infinity ? 'unlimited' : plan.employeeLimit} team members</p>
                                            <Link
                                                href={plan.priceNaira !== null ? '/register?type=business' : 'mailto:sales@tapconnect.ng'}
                                                className={`inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-full font-semibold text-sm transition-colors ${recommended ? 'bg-white text-black hover:bg-white/90' : 'bg-black text-white hover:bg-[#111111]'}`}
                                            >
                                                {plan.priceNaira !== null ? 'Choose Plan' : 'Contact Sales'}
                                            </Link>
                                        </div>
                                    </Reveal>
                                );
                            })}
                        </div>
                    </div>
                </section>

                <section className="py-24 px-4 sm:px-6 lg:px-8">
                    <div className="max-w-2xl mx-auto">
                        <Reveal className="text-center mb-12">
                            <p className="text-xs font-semibold uppercase tracking-widest text-[#6B6B6B] mb-3">FAQ</p>
                            <h2 className="text-3xl sm:text-4xl font-bold">Common Questions.</h2>
                        </Reveal>
                        <div className="space-y-3">
                            {FAQS.map((item, i) => (
                                <Reveal key={item.q} delay={i * 60}>
                                    <details className="group bg-[#F7F7F5] rounded-2xl p-5 [&_summary::-webkit-details-marker]:hidden">
                                        <summary className="flex items-center justify-between gap-4 font-semibold cursor-pointer list-none">
                                            {item.q}
                                            <ChevronDown size={18} className="shrink-0 text-[#6B6B6B] transition-transform duration-300 group-open:rotate-180" />
                                        </summary>
                                        <p className="text-sm text-[#6B6B6B] leading-relaxed mt-3">{item.a}</p>
                                    </details>
                                </Reveal>
                            ))}
                        </div>
                    </div>
                </section>

                <section className="py-24 px-4 sm:px-6 lg:px-8 bg-[#0A0A0A] text-white">
                    <Reveal className="max-w-[1504px] mx-auto flex flex-col lg:flex-row items-center justify-between gap-10 text-center lg:text-left">
                        <div>
                            <h2 className="text-3xl sm:text-4xl font-bold leading-tight max-w-xl">Ready to Create Your Digital Identity?</h2>
                            <p className="text-white/60 mt-3 max-w-lg">Start free today, or reach out if you&apos;d like help choosing the right plan.</p>
                        </div>
                        <div className="flex flex-wrap justify-center gap-4 shrink-0">
                            <Link href="/register" className="inline-flex items-center gap-2 bg-white text-black px-6 py-3.5 rounded-full font-semibold hover:bg-white/90 transition-colors whitespace-nowrap">
                                Get Started <ArrowRight size={16} />
                            </Link>
                            <a href="mailto:hello@tapconnect.ng" className="inline-flex items-center gap-2 border border-white/25 px-6 py-3.5 rounded-full font-semibold hover:bg-white/10 transition-colors whitespace-nowrap">
                                Talk to Us
                            </a>
                        </div>
                    </Reveal>
                </section>

                <footer className="border-t border-[#E5E5E5] py-8 px-4 sm:px-6 lg:px-8 text-center">
                    <Link href="/" className="font-semibold text-sm hover:underline">
                        &larr; Back to home
                    </Link>
                </footer>
            </main>
        </>
    );
}
