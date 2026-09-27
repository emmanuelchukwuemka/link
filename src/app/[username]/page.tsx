import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import {
  Phone, Mail, Globe, MapPin, Camera, Users, Video, Music2, Hash, Ghost, AtSign,
  MessageCircle, Star, Clock, Briefcase, Image as ImageIcon,
} from 'lucide-react'
import { TrackedLink, TrackedButtonLink, SaveContactButton, LeadForm, StoreProductCard } from './ProfileInteractive'
import { backgroundStyle } from '@/lib/background'
import { getLinkIcon } from '@/lib/linkIcons'
import { getTemplate } from '@/lib/templates'
import { buttonSizePadding, buttonSizeFontClass } from '@/lib/buttonSize'

// lucide-react ships no brand/logo icons, so social platforms map to neutral stand-ins.
const SOCIAL_ICONS: Record<string, typeof Globe> = {
  Instagram: Camera, TikTok: Music2, Facebook: Users, LinkedIn: Briefcase,
  X: Hash, YouTube: Video, Snapchat: Ghost, Threads: AtSign, Website: Globe,
}

function borderRadius(style: string) {
  return style === 'rounded' ? '9999px' : style === 'square' ? '0.5rem' : '0'
}

function waLink(phone: string, message: string) {
  const digits = phone.replace(/[^\d]/g, '')
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`
}

export default async function PublicProfilePage({
  params,
}: {
  params: Promise<{ username: string }>
}) {
  const { username } = await params

  const user = await prisma.user.findUnique({
    where: { username },
    include: {
      links: { where: { isActive: true }, orderBy: { position: 'asc' } },
      socialLinks: { orderBy: { position: 'asc' } },
      services: { orderBy: { position: 'asc' } },
      portfolioItems: { orderBy: { position: 'asc' } },
      testimonials: { orderBy: { position: 'asc' } },
      products: { where: { availability: { not: 'hidden' } }, orderBy: { position: 'asc' } },
      business: true,
    }
  })

  if (!user) {
    notFound()
  }

  try {
    await prisma.analyticsEvent.create({
      data: { userId: user.id, type: 'PROFILE_VIEW' }
    })
  } catch (err) {
    console.error('Analytics error:', err)
  }

  const organization = user.business?.name
  const displayTitle = user.jobTitle && organization ? `${user.jobTitle} at ${organization}` : (user.jobTitle || organization)
  const isPro = user.plan === 'pro' && (!user.planExpiresAt || user.planExpiresAt > new Date())
  const tmpl = getTemplate(user.template)
  const portfolioProjects = user.portfolioItems.filter((i) => i.type !== 'gallery')
  const galleryImages = user.portfolioItems.filter((i) => i.type === 'gallery')

  return (
    <div
      className="min-h-screen font-sans py-12 px-4 flex flex-col items-center relative overflow-hidden"
      style={{ ...backgroundStyle(user), color: user.textColor, fontFamily: user.fontFamily }}
    >
      <div className="z-10 w-full max-w-2xl mx-auto flex flex-col items-center">
        {/* Avatar */}
        <div className={`w-24 h-24 overflow-hidden mb-4 bg-gray-200 shadow-xl ${tmpl.avatarShape} ${tmpl.avatarRing}`}>
          {user.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={user.avatarUrl} alt={user.displayName || user.username} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gray-300 flex items-center justify-center text-3xl font-bold text-gray-500">
              {(user.displayName || user.username).charAt(0).toUpperCase()}
            </div>
          )}
        </div>

        {/* Name, title, bio */}
        <h1 className="text-2xl font-bold text-center">{user.displayName || `@${user.username}`}</h1>
        <p className="text-sm opacity-60 mb-1">@{user.username}</p>
        {displayTitle && <p className="text-sm font-medium opacity-80 mb-2">{displayTitle}</p>}
        {user.bio && <p className="text-center mb-6 opacity-90 max-w-md">{user.bio}</p>}

        {/* Business panel (employee profiles) */}
        {user.business && (
          <div className={`w-full max-w-md mb-6 p-4 flex items-center gap-3 ${tmpl.card}`}>
            {user.business.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={user.business.logoUrl} alt={user.business.name} className="w-10 h-10 rounded-lg object-cover" />
            ) : (
              <div className="w-10 h-10 rounded-lg bg-gray-300 flex items-center justify-center font-bold">{user.business.name.charAt(0)}</div>
            )}
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm truncate">{user.business.name}</p>
              {user.business.description && <p className="text-xs opacity-70 truncate">{user.business.description}</p>}
            </div>
          </div>
        )}

        {/* Social icons */}
        {user.socialLinks.length > 0 && (
          <div className="flex flex-wrap justify-center gap-3 mb-6">
            {user.socialLinks.map((s) => {
              const Icon = SOCIAL_ICONS[s.platform] || Globe
              return (
                <TrackedLink
                  key={s.id}
                  href={s.url}
                  type="SOCIAL_CLICK"
                  username={user.username}
                  meta={{ platform: s.platform }}
                  className="w-10 h-10 rounded-full bg-black/10 hover:bg-black/20 flex items-center justify-center transition-colors"
                >
                  <Icon size={18} />
                </TrackedLink>
              )
            })}
          </div>
        )}

        {/* Contact actions */}
        <div className="flex flex-wrap justify-center gap-2 mb-6">
          <SaveContactButton
            username={user.username}
            displayName={user.displayName || user.username}
            phone={user.phone}
            email={user.email}
            website={user.website}
            jobTitle={user.jobTitle}
            organization={organization}
            className="flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-full bg-black/10 hover:bg-black/20 transition-colors"
          />
          {user.phone && (
            <TrackedLink href={`tel:${user.phone}`} type="PHONE_CLICK" username={user.username} className="flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-full bg-black/10 hover:bg-black/20 transition-colors">
              <Phone size={14} /> Call
            </TrackedLink>
          )}
          {user.whatsapp && (
            <TrackedLink href={waLink(user.whatsapp, `Hi ${user.displayName || user.username}, I found you on TapConnect.`)} type="WHATSAPP_CLICK" username={user.username} className="flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-full bg-black/10 hover:bg-black/20 transition-colors">
              <MessageCircle size={14} /> WhatsApp
            </TrackedLink>
          )}
          {user.email && (
            <TrackedLink href={`mailto:${user.email}`} type="EMAIL_CLICK" username={user.username} className="flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-full bg-black/10 hover:bg-black/20 transition-colors">
              <Mail size={14} /> Email
            </TrackedLink>
          )}
          {user.website && (
            <TrackedLink href={user.website} type="WEBSITE_CLICK" username={user.username} className="flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-full bg-black/10 hover:bg-black/20 transition-colors">
              <Globe size={14} /> Website
            </TrackedLink>
          )}
          {user.address && (
            <span className="flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-full bg-black/10">
              <MapPin size={14} /> {user.address}
            </span>
          )}
        </div>

        {user.businessHours && (
          <div className="flex items-start gap-2 text-sm opacity-80 mb-6 text-center whitespace-pre-line">
            <Clock size={16} className="mt-0.5 shrink-0" />
            <span>{user.businessHours}</span>
          </div>
        )}

        {/* Links */}
        <div className="w-full max-w-md space-y-4">
          {user.links.map((link) => {
            const Icon = getLinkIcon(link.iconName)
            return (
              <TrackedButtonLink
                key={link.id}
                id={link.id}
                href={link.url}
                className="block w-full transition-transform hover:scale-[1.02]"
              >
                <span
                  className={`flex items-center gap-3 w-full ${buttonSizeFontClass(user.buttonSize)}`}
                  style={{
                    backgroundColor: user.buttonColor,
                    color: user.buttonTextColor,
                    borderRadius: borderRadius(user.buttonStyle),
                    padding: buttonSizePadding(user.buttonSize),
                  }}
                >
                  <Icon size={18} className="shrink-0 opacity-70" />
                  <span className="flex-1 text-center">
                    <span className="block font-medium">{link.title || 'Untitled Link'}</span>
                    {link.description && <span className="block text-xs opacity-70">{link.description}</span>}
                  </span>
                </span>
              </TrackedButtonLink>
            )
          })}
        </div>

        {/* About */}
        {user.aboutText && (
          <section className="w-full max-w-md mt-10">
            <h2 className={`${tmpl.heading} mb-4`}>About</h2>
            <div className={`p-4 ${tmpl.card}`}>
              <p className="text-sm opacity-90 whitespace-pre-line">{user.aboutText}</p>
            </div>
          </section>
        )}

        {/* Services */}
        {user.services.length > 0 && isPro && (
          <section className="w-full max-w-md mt-10">
            <h2 className={`${tmpl.heading} mb-4 flex items-center gap-2`}><Briefcase size={18} /> Services</h2>
            <div className="space-y-3">
              {user.services.map((s) => (
                <div key={s.id} className={`p-4 flex items-center justify-between gap-3 ${tmpl.card}`}>
                  <div className="min-w-0">
                    <p className="font-semibold">{s.name}</p>
                    {s.description && <p className="text-sm opacity-70 truncate">{s.description}</p>}
                    {s.price && <p className="text-sm font-semibold mt-1">{s.price}</p>}
                  </div>
                  {user.whatsapp && (
                    <TrackedLink
                      href={waLink(user.whatsapp, `Hi, I'm interested in "${s.name}"${s.ctaType === 'quote' ? ' — could I get a quote?' : s.ctaType === 'book' ? ' — I would like to book.' : '.'}`)}
                      type="SERVICE_REQUEST"
                      username={user.username}
                      meta={{ serviceId: s.id }}
                      className="shrink-0 text-xs font-semibold px-4 py-2 rounded-full bg-black text-white whitespace-nowrap"
                    >
                      {s.ctaType === 'quote' ? 'Get Quote' : s.ctaType === 'book' ? 'Book' : 'Contact'}
                    </TrackedLink>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Products / mini-store */}
        {user.products.length > 0 && (
          <section className="w-full max-w-md mt-10">
            <h2 className={`${tmpl.heading} mb-4`}>Products</h2>
            <div className="grid grid-cols-2 gap-4">
              {user.products.map((p) => (
                <StoreProductCard
                  key={p.id}
                  username={user.username}
                  whatsapp={user.whatsapp}
                  id={p.id}
                  name={p.name}
                  imageUrl={p.imageUrl}
                  price={p.price}
                  discountPrice={p.discountPrice}
                  availability={p.availability}
                  variantsJson={p.variants}
                  cardClassName={tmpl.card}
                />
              ))}
            </div>
          </section>
        )}

        {/* Portfolio */}
        {portfolioProjects.length > 0 && isPro && (
          <section className="w-full max-w-md mt-10">
            <h2 className={`${tmpl.heading} mb-4`}>Portfolio</h2>
            <div className="grid grid-cols-2 gap-4">
              {portfolioProjects.map((item) => (
                <div key={item.id} className={`overflow-hidden ${tmpl.card}`}>
                  <div className="aspect-video bg-black/10 flex items-center justify-center">
                    {item.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover" />
                    ) : (
                      <ImageIcon size={24} className="opacity-30" />
                    )}
                  </div>
                  <div className="p-3">
                    <p className="font-semibold text-sm">{item.title}</p>
                    {item.description && <p className="text-xs opacity-70 line-clamp-2">{item.description}</p>}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Gallery */}
        {galleryImages.length > 0 && isPro && (
          <section className="w-full max-w-md mt-10">
            <h2 className={`${tmpl.heading} mb-4`}>Gallery</h2>
            <div className="grid grid-cols-3 gap-2">
              {galleryImages.map((item) => (
                <div key={item.id} className={`aspect-square overflow-hidden ${tmpl.card}`}>
                  {item.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center"><ImageIcon size={20} className="opacity-30" /></div>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Testimonials */}
        {user.testimonials.length > 0 && (
          <section className="w-full max-w-md mt-10">
            <h2 className={`${tmpl.heading} mb-4`}>Testimonials</h2>
            <div className="space-y-3">
              {user.testimonials.map((t) => (
                <div key={t.id} className={`p-4 ${tmpl.card}`}>
                  <div className="flex text-amber-400 mb-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} size={13} fill={i < t.rating ? 'currentColor' : 'none'} />
                    ))}
                  </div>
                  <p className="text-sm opacity-90">&ldquo;{t.content}&rdquo;</p>
                  <p className="text-xs opacity-60 font-semibold mt-1">&mdash; {t.authorName}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Lead capture (Pro feature — locks automatically if the plan lapses) */}
        {user.leadFormEnabled && isPro && (
          <section className="w-full max-w-md mt-10 rounded-2xl p-5" style={{ backgroundColor: user.buttonColor, color: user.buttonTextColor }}>
            <h2 className="font-bold text-lg mb-1">Interested in working together?</h2>
            <p className="text-sm opacity-80 mb-4">Send a message and {user.displayName || user.username} will get back to you.</p>
            <LeadForm username={user.username} />
          </section>
        )}

        {/* TapConnect Branding — Pro plans can remove it */}
        {!isPro && (
          <div className="mt-16 pb-8">
            <Link href="/" className="font-bold tracking-tighter opacity-70 hover:opacity-100 transition-opacity">
              TapConnect
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
