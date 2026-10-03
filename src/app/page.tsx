import Link from 'next/link'
import Image from 'next/image'
import {
  Search, ArrowRight, Star, Nfc, Store, BarChart3, IdCard, Check,
  Building2, Users2, Sparkles, ShoppingBag, Smartphone, Eye, TrendingUp, Crown,
  Play, Handshake, Briefcase, Mail,
} from 'lucide-react'
import { Logo } from '@/components/Logo'
import { Reveal } from '@/components/Reveal'
import { query } from '@/lib/db'
import type { Product } from '@/lib/types'
import { PRO_PLAN_PRICE_NAIRA, BUSINESS_PLANS } from '@/lib/subscription'
import { fallbackVisual } from '@/lib/productVisual'
import { CartBadge, BuyNowButton, TestimonialCarousel, NewsletterForm, ContactForm } from './LandingInteractive'

const STEPS = [
  { n: '01', title: 'Get Your Card', body: 'Order a TapConnect card or wristband from our shop.', icon: ShoppingBag, image: '/step-1-card.jpg' },
  { n: '02', title: 'Tap or Scan', body: 'Tap your TapConnect Digital Card or scan the QR code with any phone.', icon: Smartphone, image: '/step-2-tap.jpg' },
  { n: '03', title: 'View Profile', body: 'Your digital profile opens instantly.', icon: Eye, image: '/step-3-profile.jpg' },
  { n: '04', title: 'Connect & Grow', body: 'Visitors can contact you, view your products/services and more, while you get real analytics.', icon: TrendingUp, image: '/step-4-analytics.jpg' },
]

const CHECKLIST_LEFT = ['Contact information', 'Social media links', 'Product catalogue & mini store', 'Service listings']
const CHECKLIST_RIGHT = ['Booking & enquiry forms', 'Portfolio & gallery', 'Custom design & branding', 'Built-in analytics']

const TESTIMONIALS = [
  { quote: 'TapConnect has made networking so easy for me. I share my card and people can instantly reach me.', name: 'Chinedu A.', role: 'Entrepreneur' },
  { quote: 'Our hotel purchased 30 cards for staff. It has improved our customer engagement tremendously.', name: 'Grace N.', role: 'Hotel Manager' },
  { quote: 'The mini store feature is amazing. I can now sell my products directly from my profile.', name: 'Amaka U.', role: 'Business Owner' },
]

export default async function Home() {
  const products = await query<Product>(
    'SELECT * FROM `Product` WHERE `availability` != ? ORDER BY `priceRegular` ASC LIMIT 3',
    ['hidden']
  )

  return (
    <main id="top" className="min-h-screen font-sans bg-white text-[#111111]">
      {/* ===== Header + Hero (dark) ===== */}
      <div className="bg-[#0A0A0A] text-white">
        <header className="max-w-[1504px] mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-10">
            <a href="#top" className="flex items-center">
              <Logo className="h-9 w-auto" priority />
            </a>
            <nav className="hidden lg:flex gap-7 font-medium text-white/70 text-sm">
              <a href="#top" className="hover:text-white transition-colors">Home</a>
              <a href="#products" className="hover:text-white transition-colors">Products</a>
              <a href="#how-it-works" className="hover:text-white transition-colors">How It Works</a>
              <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
              <a href="#about" className="hover:text-white transition-colors">About</a>
              <a href="#contact" className="hover:text-white transition-colors">Contact</a>
            </nav>
          </div>
          <div className="flex items-center gap-1 sm:gap-2">
            <span className="hidden sm:inline-flex p-2 rounded-full text-white/70" aria-hidden="true">
              <Search size={20} />
            </span>
            <CartBadge />
            <Link href="/login" className="ml-1 sm:ml-2 font-semibold text-xs sm:text-sm px-3 sm:px-4 py-2 sm:py-2.5 rounded-full border border-white/25 hover:bg-white/10 transition-colors whitespace-nowrap">
              Login
            </Link>
            <Link href="/register" className="font-semibold text-xs sm:text-sm px-3 sm:px-4 py-2 sm:py-2.5 rounded-full bg-white text-black hover:bg-white/90 transition-colors whitespace-nowrap">
              Get Started
            </Link>
          </div>
        </header>

        <section className="relative isolate overflow-hidden max-w-[1504px] mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-20 grid lg:grid-cols-2 gap-16 items-center">
          {/* Background photo, heavily scrimmed so the section still reads as
              solid black (brand requirement) while adding real depth/mood. */}
          <div className="absolute inset-0 -z-10 overflow-hidden" aria-hidden="true">
            <Image src="/hero-photo.jpg" alt="" fill priority className="object-cover" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#0A0A0A]/92 via-[#0A0A0A]/70 to-[#0A0A0A]/40" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] via-transparent to-[#0A0A0A]/30" />
          </div>

          <div className="flex flex-col gap-7 max-w-xl">
            <Reveal>
              <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-white/50 border border-white/15 rounded-full px-4 py-1.5 w-fit">
                Powered by NFC + QR &middot; Smarter Connections
              </span>
            </Reveal>
            <Reveal delay={80}>
              <h1 className="text-5xl sm:text-6xl font-bold leading-[1.05] tracking-tight">
                Your Identity.<br />In One Tap.
              </h1>
            </Reveal>
            <Reveal delay={160}>
              <p className="text-lg text-white/60 leading-relaxed">
                Create stunning digital profiles, business pages, mini websites and online stores &mdash; all connected to your physical TapConnect Digital Card.
              </p>
            </Reveal>
            <Reveal delay={240}>
              <div className="flex flex-wrap gap-4 mt-2">
                <Link href="/marketplace" className="inline-flex items-center gap-2 bg-white text-black px-6 py-3.5 rounded-full font-semibold hover:bg-white/90 transition-colors">
                  Shop Digital Cards <ArrowRight size={16} />
                </Link>
                <Link href="/register" className="inline-flex items-center gap-2 border border-white/25 px-6 py-3.5 rounded-full font-semibold hover:bg-white/10 transition-colors">
                  Create Your Profile
                </Link>
              </div>
            </Reveal>
          </div>

          {/* Hero graphic — animated "tap to connect" loop: card taps down,
              a ripple + glow pulse out from the contact point, and the phone
              brightens as if the profile just loaded. Pure CSS, no assets. */}
          <Reveal delay={200} className="relative aspect-square w-full max-w-md mx-auto lg:ml-auto hidden sm:flex items-center justify-center">
            <div
              className="absolute w-80 h-80 rounded-full blur-3xl opacity-40"
              style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.5) 0%, rgba(255,255,255,0) 70%)' }}
              aria-hidden="true"
            />

            <div className="relative w-64 drop-shadow-2xl animate-[float_5s_ease-in-out_infinite]">
              <Image
                src="/phone-mock.png"
                alt="TapConnect profile shown on a phone"
                width={1020}
                height={1541}
                className="w-full h-auto animate-[phone-wake_4s_ease-in-out_infinite]"
                priority
              />

              {/* Tap contact point, positioned over the phone's upper body */}
              <div className="absolute left-1/2 top-[22%] -translate-x-1/2 -translate-y-1/2 pointer-events-none" aria-hidden="true">
                <span className="absolute -m-8 w-16 h-16 rounded-full border-2 border-white animate-[tap-ripple_4s_ease-out_infinite]" />
                <span className="absolute -m-8 w-16 h-16 rounded-full border-2 border-white animate-[tap-ripple_4s_ease-out_infinite] [animation-delay:0.35s]" />
                <span className="absolute -m-5 w-10 h-10 rounded-full bg-white blur-md animate-[tap-glow_4s_ease-in-out_infinite]" />
              </div>
            </div>

            {/* The tapping NFC card */}
            <div
              className="absolute left-[26%] top-[24%] w-20 h-14 rounded-xl bg-black border border-white/10 shadow-2xl flex flex-col justify-between p-2.5 z-20 animate-[tap-card_4s_ease-in-out_infinite]"
              aria-hidden="true"
            >
              <Nfc size={13} className="text-white/70" />
              <p className="font-bold text-[9px] tracking-tight leading-none">TapConnect</p>
            </div>

            <span className="absolute top-6 right-2 bg-white text-black text-xs font-semibold px-3 py-2 rounded-full shadow-xl flex items-center gap-1.5 z-20">
              <Nfc size={13} /> Instant Tap
            </span>
          </Reveal>
        </section>

        {/* Feature icon strip */}
        <div className="border-t border-white/10">
          <div className="max-w-[1504px] mx-auto px-4 sm:px-6 lg:px-8 py-8 grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { icon: IdCard, title: 'Digital Profile', sub: 'Modern & professional' },
              { icon: Nfc, title: 'NFC / QR Ready', sub: 'Instant access' },
              { icon: Store, title: 'Mini Online Store', sub: 'Sell your products' },
              { icon: BarChart3, title: 'Analytics Dashboard', sub: 'Track engagement' },
            ].map(({ icon: Icon, title, sub }) => (
              <div key={title} className="flex items-center gap-3">
                <span className="w-11 h-11 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                  <Icon size={20} />
                </span>
                <div>
                  <p className="font-semibold text-sm">{title}</p>
                  <p className="text-white/50 text-xs">{sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ===== How TapConnect Works ===== */}
      <section id="how-it-works" className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-[1504px] mx-auto">
          <Reveal>
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6 mb-14">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-[#6B6B6B] mb-3">How TapConnect Works</p>
              <h2 className="text-4xl sm:text-5xl font-bold leading-tight max-w-xl">
                From a Physical Card to Powerful Digital Experiences.
              </h2>
            </div>
            <div className="flex flex-col sm:items-end gap-4 max-w-sm">
              <p className="text-[#6B6B6B]">It&apos;s simple. Buy a card, create your profile, and start winning the world in seconds.</p>
              <Link href="/learn" className="inline-flex items-center gap-2 border border-[#E5E5E5] px-5 py-2.5 rounded-full font-semibold text-sm hover:bg-[#F7F7F5] transition-colors whitespace-nowrap">
                Learn More <ArrowRight size={14} />
              </Link>
            </div>
          </div>
          </Reveal>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {STEPS.map((step, i) => {
              const Icon = step.icon
              return (
                <Reveal key={step.n} delay={i * 100}>
                  <div className="group">
                    <div className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden bg-[#F0F0EE] mb-5 shadow-sm">
                      <Image
                        src={step.image}
                        alt={step.title}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent" />
                      <span className="absolute top-3 right-3 bg-white/90 text-black text-xs font-bold px-2.5 py-1 rounded-full">
                        {step.n}
                      </span>
                      <span className="absolute bottom-3 left-3 w-10 h-10 rounded-full bg-black text-white flex items-center justify-center shadow-lg">
                        <Icon size={16} />
                      </span>
                    </div>
                    <h3 className="font-bold text-lg mb-2">{step.title}</h3>
                    <p className="text-sm text-[#6B6B6B] leading-relaxed">{step.body}</p>
                  </div>
                </Reveal>
              )
            })}
          </div>
        </div>
      </section>

      {/* ===== Our NFC Products ===== */}
      <section id="products" className="py-16 px-4 sm:px-6 lg:px-8 bg-[#F7F7F5]">
        <div className="max-w-[1504px] mx-auto">
          <Reveal>
          <div className="flex items-end justify-between mb-10">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-[#6B6B6B] mb-3">TapConnect Digital Cards</p>
              <h2 className="text-3xl sm:text-4xl font-bold">Your professional identity, one tap away.</h2>
            </div>
            <Link href="/marketplace" className="hidden sm:inline-flex items-center gap-2 font-semibold text-sm hover:underline whitespace-nowrap">
              View All Products <ArrowRight size={14} />
            </Link>
          </div>
          </Reveal>

          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6 max-w-4xl mx-auto">
            {products.map((p, i) => {
              const colors: string[] = p.colors ? JSON.parse(p.colors) : []
              const savings = p.priceSale ? p.priceRegular - p.priceSale : 0
              const images: string[] = p.images ? JSON.parse(p.images) : []
              const visual = images[0] ? { photo: images[0] } : fallbackVisual(p.category)
              return (
                <Reveal key={p.id} delay={i * 80}>
                <div className="group bg-white rounded-2xl sm:rounded-3xl p-3 sm:p-5 shadow-sm flex flex-col transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
                  <div className="flex-1">
                    <Link href={`/marketplace/${p.slug}`} className="relative aspect-square bg-gradient-to-br from-[#F0F0EE] to-[#E5E5E1] rounded-xl sm:rounded-2xl mb-3 sm:mb-4 flex items-center justify-center overflow-hidden">
                      {'photo' in visual ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={visual.photo} alt={p.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                      ) : (
                        <div className="w-16 h-16 rounded-full bg-white shadow-md flex items-center justify-center transition-transform duration-300 group-hover:scale-105">
                          <visual.icon size={26} className="text-black/70" />
                        </div>
                      )}
                    </Link>
                    <Link href={`/marketplace/${p.slug}`} className="font-bold text-sm sm:text-base hover:underline leading-snug">{p.name}</Link>
                    {(p.length || p.width) && (
                      <p className="text-xs text-[#6B6B6B] mt-1 hidden sm:block">
                        {p.length ? `${p.length}cm` : ''}{p.length && p.width ? ' x ' : ''}{p.width ? `${p.width}cm` : ''}
                      </p>
                    )}
                    <div className="mt-2 sm:mt-3 flex items-baseline gap-1.5 sm:gap-2 flex-wrap">
                      {p.priceSale && <span className="text-xs text-[#B8B8B8] line-through">&#8358;{p.priceRegular.toLocaleString()}</span>}
                      <span className="font-bold text-sm sm:text-lg">&#8358;{(p.priceSale ?? p.priceRegular).toLocaleString()}</span>
                    </div>
                    {savings > 0 && (
                      <span className="text-[10px] sm:text-xs font-semibold text-green-600 bg-green-50 rounded-full px-2 py-0.5 w-fit mt-1">
                        Save &#8358;{savings.toLocaleString()}
                      </span>
                    )}
                    {colors.length > 0 && (
                      <div className="flex gap-1.5 mt-2 sm:mt-4">
                        {colors.map((c) => (
                          <span
                            key={c}
                            title={c}
                            className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full border border-[#E5E5E5]"
                            style={{ backgroundColor: c.toLowerCase() === 'black' ? '#000' : c.toLowerCase() === 'white' ? '#fff' : c }}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                  <BuyNowButton
                    productId={p.id}
                    name={p.name}
                    slug={p.slug}
                    image={null}
                    unitPrice={p.priceSale ?? p.priceRegular}
                    customizationPrice={p.customizationPrice}
                    color={colors[0]}
                    className="w-full flex items-center justify-center gap-1.5 bg-black text-white rounded-full py-2 sm:py-2.5 font-semibold text-xs sm:text-sm hover:bg-[#111111] transition-colors mt-3 sm:mt-4"
                  />
                </div>
                </Reveal>
              )
            })}
          </div>
        </div>
      </section>

      {/* ===== One Platform ===== */}
      <section id="about" className="py-24 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <div className="max-w-[1504px] mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center mb-20">
            <Reveal>
              <div>
                <div className="flex items-center gap-2.5 mb-5">
                  <span className="w-8 h-0.5 rounded-full bg-gradient-to-r from-green-500 to-blue-500" />
                  <span className="text-xs font-bold tracking-[0.15em] text-[#6B6B6B] uppercase">Designed for Everyone</span>
                </div>
                <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight mb-6">
                  One Platform.<br />
                  Endless <span className="bg-gradient-to-r from-blue-500 to-green-500 bg-clip-text text-transparent">Possibilities.</span>
                </h2>
                <p className="text-[#6B6B6B] text-lg leading-relaxed mb-8 max-w-lg">
                  TapConnect is built for individuals, businesses and large organizations. Whether you&apos;re a professional, a small business or a large enterprise, TapConnect helps you stand out.
                </p>
                <div className="flex items-center gap-6">
                  <Link href="/register" className="inline-flex items-center gap-2 bg-black text-white px-6 py-3.5 rounded-full font-semibold hover:bg-[#111111] transition-colors">
                    Get Started <ArrowRight size={16} />
                  </Link>
                  <a href="#how-it-works" className="inline-flex items-center gap-3 font-semibold text-sm hover:opacity-70 transition-opacity">
                    <span className="w-9 h-9 rounded-full border border-gray-300 flex items-center justify-center">
                      <Play size={12} className="ml-0.5" fill="currentColor" />
                    </span>
                    See how it works
                  </a>
                </div>
              </div>
            </Reveal>

            <Reveal delay={150}>
              <div className="relative max-w-md mx-auto lg:max-w-none">
                <div className="absolute -top-10 -left-10 w-40 h-40 rounded-full bg-[#F7F7F5] -z-10" />
                <div className="absolute -bottom-6 -right-6 w-28 h-28 rounded-full bg-green-50 -z-10" />

                <div className="rounded-3xl overflow-hidden shadow-xl">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/hero-woman.jpg" alt="Professional viewing profile analytics on her phone" className="w-full h-auto object-cover" />
                </div>

                <div className="absolute -right-3 sm:-right-8 top-8 bg-white rounded-2xl shadow-xl p-4 w-44">
                  <div className="flex items-center gap-1.5 mb-3">
                    <Star size={15} className="text-green-500 fill-green-500" />
                    <span className="font-bold text-sm">New Opportunities</span>
                  </div>
                  <div className="space-y-2.5">
                    {[
                      { icon: Users2, label: 'Clients', color: 'bg-blue-100 text-blue-600' },
                      { icon: Handshake, label: 'Collaborations', color: 'bg-purple-100 text-purple-600' },
                      { icon: Briefcase, label: 'Partnerships', color: 'bg-green-100 text-green-600' },
                    ].map(({ icon: Icon, label, color }) => (
                      <div key={label} className="flex items-center gap-2 text-xs font-medium">
                        <span className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${color}`}>
                          <Icon size={12} />
                        </span>
                        {label}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </Reveal>
          </div>

          <div className="grid sm:grid-cols-3 gap-6">
            {[
              { image: '/individual-person.jpg', badge: 'bg-blue-500', icon: Users2, title: 'Individuals', body: 'Professionals, creators, freelancers, students and more.', cta: 'Create Your Profile', href: '/register' },
              { image: '/business-team.jpg', badge: 'bg-green-600', icon: Building2, title: 'Businesses', body: 'Companies, teams, multiple employees and branding.', cta: 'Explore Business Plans', href: '/register?type=business' },
              { image: '/enterprise-building.jpg', badge: 'bg-purple-600', icon: Sparkles, title: 'Enterprises', body: 'Large organizations with advanced team management and analytics.', cta: 'Contact Sales', href: 'mailto:sales@tapconnect.ng' },
            ].map(({ image, badge, icon: Icon, title, body, cta, href }, i) => (
              <Reveal key={title} delay={i * 100}>
              <Link
                href={href}
                className="group relative rounded-3xl overflow-hidden min-h-[320px] flex flex-col justify-end transition-all duration-300 hover:-translate-y-1.5 hover:shadow-2xl"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={image} alt="" className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/55 to-black/10" />
                <div className="relative p-8">
                  <span className={`inline-flex w-11 h-11 rounded-full items-center justify-center mb-5 ${badge}`}>
                    <Icon size={20} className="text-white" />
                  </span>
                  <h3 className="text-xl font-bold text-white">{title}</h3>
                  <p className="text-white/70 text-sm mt-1 mb-5">{body}</p>
                  <span className="inline-flex items-center gap-2.5 font-semibold text-sm text-white">
                    {cta}
                    <span className="w-8 h-8 rounded-full bg-white/15 flex items-center justify-center group-hover:bg-white/25 group-hover:translate-x-0.5 transition-all">
                      <ArrowRight size={13} />
                    </span>
                  </span>
                </div>
              </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ===== More Than a Link ===== */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-[#F7F7F5]">
        <Reveal className="max-w-[1504px] mx-auto grid lg:grid-cols-2 gap-16 items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-[#6B6B6B] mb-3">Digital Profiles</p>
            <h2 className="text-4xl sm:text-5xl font-bold leading-tight mb-4">
              More Than a Link. A Complete Digital Presence.
            </h2>
            <p className="text-[#6B6B6B] leading-relaxed mb-8 max-w-lg">
              Create beautiful, customizable profiles with your contact information, social links, products, services, portfolio, booking and more.
            </p>
            <div className="grid sm:grid-cols-2 gap-x-8 gap-y-3 mb-8">
              {[...CHECKLIST_LEFT, ...CHECKLIST_RIGHT].map((item) => (
                <div key={item} className="flex items-center gap-2 text-sm">
                  <Check size={16} className="text-black shrink-0" />
                  {item}
                </div>
              ))}
            </div>
            <Link href="/register" className="inline-flex items-center gap-2 bg-black text-white px-6 py-3.5 rounded-full font-semibold hover:bg-[#111111] transition-colors">
              Create Your Profile
            </Link>
          </div>

          <div className="relative max-w-xs mx-auto w-full">
            <Image src="/phone-mock.png" alt="Example TapConnect profile with About, Services, Products and Gallery tabs" width={1020} height={1541} className="w-full h-auto drop-shadow-2xl" />
          </div>
        </Reveal>
      </section>

      {/* ===== Track Engagement ===== */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-[#0A0A0A] text-white">
        <Reveal className="max-w-[1504px] mx-auto grid lg:grid-cols-2 gap-16 items-center">
          <div>
            <h2 className="text-4xl sm:text-5xl font-bold leading-tight mb-4">
              Track Engagement. Measure Growth.
            </h2>
            <p className="text-white/60 leading-relaxed mb-8 max-w-md">
              See how many people view your profile, tap your card, click your links, view your products and submit enquiries.
            </p>
            <Link href="/register" className="inline-flex items-center gap-2 bg-white text-black px-6 py-3.5 rounded-full font-semibold hover:bg-white/90 transition-colors">
              View Sample Analytics
            </Link>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-3xl p-6">
            <div className="grid grid-cols-3 gap-4 mb-6">
              {[
                { label: 'Profile Views', value: '1,248', change: '+12%' },
                { label: 'NFC Taps', value: '890', change: '+8%' },
                { label: 'Link Clicks', value: '680', change: '+16%' },
              ].map((s) => (
                <div key={s.label} className="bg-white/5 rounded-2xl p-4">
                  <p className="text-xs text-white/50 mb-1">{s.label}</p>
                  <p className="text-xl font-bold">{s.value}</p>
                  <p className="text-xs text-green-400">{s.change}</p>
                </div>
              ))}
            </div>
            <div className="flex items-end gap-2 h-20 mb-6">
              {[40, 65, 50, 80, 60, 90, 70].map((h, i) => (
                <div key={i} className="flex-1 bg-white/20 rounded-t-md" style={{ height: `${h}%` }} />
              ))}
            </div>
            <div>
              <p className="text-xs font-semibold text-white/50 mb-3">Top Links</p>
              <div className="space-y-2">
                {[
                  { label: 'WhatsApp', value: 420 },
                  { label: 'Phone', value: 210 },
                  { label: 'Website', value: 180 },
                  { label: 'Products', value: 160 },
                  { label: 'Email', value: 120 },
                ].map((l) => (
                  <div key={l.label} className="flex items-center justify-between text-sm">
                    <span className="text-white/70">{l.label}</span>
                    <span className="font-semibold">{l.value}</span>
                  </div>
                ))}
              </div>
            </div>
            <p className="text-[10px] text-white/30 mt-4">Sample data for illustration &mdash; your dashboard shows real, privacy-safe engagement numbers.</p>
          </div>
        </Reveal>
      </section>

      {/* ===== Pricing ===== */}
      <section id="pricing" className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-[1504px] mx-auto">
          <Reveal className="text-center mb-14">
            <p className="text-xs font-semibold uppercase tracking-widest text-[#6B6B6B] mb-3">Simple, Transparent Pricing</p>
            <h2 className="text-4xl sm:text-5xl font-bold leading-tight max-w-2xl mx-auto">
              Start Free. Upgrade When You&apos;re Ready.
            </h2>
          </Reveal>

          <div className="grid sm:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {[
              {
                name: 'Free', price: '₦0', period: 'forever',
                features: ['Digital profile & QR code', 'Basic links & socials', '1 TapConnect Digital Card connection'],
                href: '/register', cta: 'Get Started', highlight: false,
              },
              {
                name: 'Individual Pro', price: `₦${PRO_PLAN_PRICE_NAIRA.toLocaleString()}`, period: 'per year',
                features: ['Everything in Free', 'Mini store & services', 'Portfolio & analytics'],
                href: '/register', cta: 'Go Pro', highlight: true,
              },
              {
                name: 'Business', price: `₦${BUSINESS_PLANS.tier10.priceNaira!.toLocaleString()}`, period: 'per year, from',
                features: [`${BUSINESS_PLANS.tier10.employeeLimit}+ team members`, 'Team analytics & leads', 'Bulk card management'],
                href: '/register?type=business', cta: 'Explore Business Plans', highlight: false,
              },
            ].map((plan, i) => (
              <Reveal key={plan.name} delay={i * 100}>
                <div className={`rounded-3xl p-8 h-full flex flex-col transition-all duration-300 hover:-translate-y-1 ${plan.highlight ? 'bg-[#0A0A0A] text-white shadow-2xl' : 'bg-[#F7F7F5] text-[#111111] hover:shadow-lg'}`}>
                  {plan.highlight && (
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest bg-white/10 rounded-full px-3 py-1 w-fit mb-4">
                      <Crown size={12} /> Most Popular
                    </span>
                  )}
                  <h3 className="font-bold text-lg">{plan.name}</h3>
                  <div className="mt-2 mb-6">
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
                  <Link
                    href={plan.href}
                    className={`inline-flex items-center justify-center gap-2 px-5 py-3 rounded-full font-semibold text-sm transition-colors ${plan.highlight ? 'bg-white text-black hover:bg-white/90' : 'bg-black text-white hover:bg-[#111111]'}`}
                  >
                    {plan.cta} <ArrowRight size={14} />
                  </Link>
                </div>
              </Reveal>
            ))}
          </div>
          <p className="text-center text-sm text-[#6B6B6B] mt-8">
            Need enterprise team management? <Link href="/pricing" className="font-semibold text-black hover:underline">See full pricing details</Link> or <a href="mailto:sales@tapconnect.ng" className="font-semibold text-black hover:underline">contact sales</a>.
          </p>
        </div>
      </section>

      {/* ===== Testimonials ===== */}
      <section className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-[1504px] mx-auto">
          <Reveal className="text-center mb-14">
            <p className="text-xs font-semibold uppercase tracking-widest text-[#6B6B6B] mb-3">What Our Customers Say</p>
            <h2 className="text-3xl sm:text-4xl font-bold max-w-2xl mx-auto">
              Trusted by Professionals, Businesses and Organizations.
            </h2>
          </Reveal>

          <Reveal delay={100}>
          <TestimonialCarousel>
            {TESTIMONIALS.map((t) => (
              <div key={t.name} className="snap-start shrink-0 w-[320px] bg-[#F7F7F5] rounded-3xl p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
                <div className="flex text-amber-400 mb-4">
                  {Array.from({ length: 5 }).map((_, i) => <Star key={i} size={14} fill="currentColor" />)}
                </div>
                <p className="text-sm leading-relaxed mb-6">&ldquo;{t.quote}&rdquo;</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#B8B8B8]/40 flex items-center justify-center font-bold text-sm">
                    {t.name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-semibold text-sm">{t.name}</p>
                    <p className="text-xs text-[#6B6B6B]">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </TestimonialCarousel>
          </Reveal>
        </div>
      </section>

      {/* ===== Final CTA ===== */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-[#0A0A0A] text-white">
        <Reveal className="max-w-[1504px] mx-auto flex flex-col lg:flex-row items-center justify-between gap-10">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-white/50 mb-3">Ready to get started?</p>
            <h2 className="text-4xl sm:text-5xl font-bold leading-tight max-w-xl">
              Create Your Digital Identity With TapConnect Today.
            </h2>
            <p className="text-white/60 mt-4 max-w-lg">
              Get your TapConnect Digital Card, create your profile and start connecting with opportunities everywhere you go.
            </p>
          </div>
          <div className="flex flex-wrap gap-4 shrink-0">
            <Link href="/marketplace" className="inline-flex items-center gap-2 bg-white text-black px-6 py-3.5 rounded-full font-semibold hover:bg-white/90 transition-colors whitespace-nowrap">
              Shop NFC Products <ArrowRight size={16} />
            </Link>
            <Link href="/register" className="inline-flex items-center gap-2 border border-white/25 px-6 py-3.5 rounded-full font-semibold hover:bg-white/10 transition-colors whitespace-nowrap">
              Create Your Profile
            </Link>
          </div>
        </Reveal>
      </section>

      {/* ===== Contact ===== */}
      <section id="contact" className="py-24 px-4 sm:px-6 lg:px-8 bg-[#F7F7F5]">
        <div className="max-w-[1504px] mx-auto grid lg:grid-cols-2 gap-16 items-start">
          <Reveal>
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-[#6B6B6B] mb-3">Get in Touch</p>
              <h2 className="text-4xl sm:text-5xl font-bold leading-tight mb-4">
                Questions? We&apos;d Love to Hear From You.
              </h2>
              <p className="text-[#6B6B6B] leading-relaxed mb-8 max-w-md">
                Whether it&apos;s a question about your order, a bulk purchase for your team, or just feedback — send us a message and a real person will get back to you.
              </p>
              <div className="space-y-4">
                <a href="mailto:hello@tapconnect.ng" className="flex items-center gap-3 group">
                  <span className="w-11 h-11 rounded-full bg-white shadow-sm flex items-center justify-center shrink-0">
                    <Mail size={17} />
                  </span>
                  <span>
                    <span className="block text-sm font-semibold group-hover:underline">hello@tapconnect.ng</span>
                    <span className="block text-xs text-[#6B6B6B]">We usually reply within a few hours</span>
                  </span>
                </a>
              </div>
            </div>
          </Reveal>

          <Reveal delay={100}>
            <ContactForm />
          </Reveal>
        </div>
      </section>

      {/* ===== Footer ===== */}
      <footer className="bg-[#0A0A0A] text-white/60 pt-16 pb-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-[1504px] mx-auto grid sm:grid-cols-2 lg:grid-cols-5 gap-10 mb-12">
          <div className="lg:col-span-1 sm:col-span-2">
            <Logo className="h-9 w-auto mb-4" />
            <p className="text-sm leading-relaxed max-w-[220px]">Tap. Connect. Grow. The modern way to network, sell and be remembered.</p>
          </div>

          <div>
            <p className="font-semibold text-white text-sm mb-4">Quick Links</p>
            <ul className="space-y-2.5 text-sm">
              <li><Link href="/" className="hover:text-white transition-colors">Home</Link></li>
              <li><Link href="/marketplace" className="hover:text-white transition-colors">Products</Link></li>
              <li><Link href="/learn" className="hover:text-white transition-colors">How it Works</Link></li>
              <li><Link href="/pricing" className="hover:text-white transition-colors">Pricing</Link></li>
              <li><Link href="/about" className="hover:text-white transition-colors">About</Link></li>
            </ul>
          </div>

          <div>
            <p className="font-semibold text-white text-sm mb-4">Products</p>
            <ul className="space-y-2.5 text-sm">
              <li><Link href="/marketplace" className="hover:text-white transition-colors">Digital Cards</Link></li>
              <li><Link href="/marketplace" className="hover:text-white transition-colors">Wristbands</Link></li>
              <li><Link href="/marketplace" className="hover:text-white transition-colors">Accessories</Link></li>
              <li><Link href="/marketplace" className="hover:text-white transition-colors">Bulk Orders</Link></li>
            </ul>
          </div>

          <div>
            <p className="font-semibold text-white text-sm mb-4">Newsletter</p>
            <p className="text-sm mb-4">Get updates on new products and features.</p>
            <NewsletterForm />
          </div>
        </div>

        <div className="max-w-[1504px] mx-auto pt-8 border-t border-white/10 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs">
          <p>&copy; 2026 TapConnect. All rights reserved.</p>
          <div className="flex gap-6">
            <Link href="/login" className="hover:text-white">Log in</Link>
            <Link href="/about" className="hover:text-white">About</Link>
          </div>
        </div>
      </footer>
    </main>
  )
}
