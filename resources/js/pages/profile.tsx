import { Head, Link } from '@inertiajs/react';
import { Phone, Mail, Globe, MapPin, MessageCircle, Star, Clock, Briefcase, Image as ImageIcon } from 'lucide-react';
import type { ComponentType, SVGProps } from 'react';
import {
    TrackedLink,
    TrackedButtonLink,
    SaveContactButton,
    LeadForm,
    StoreProductCard,
    ProfileTopBar,
    FloatingClaimBar,
} from '@/components/profile-interactive';
import { InstagramIcon, TikTokIcon, YouTubeIcon, FacebookIcon, XIcon, LinkedInIcon, SnapchatIcon, ThreadsIcon } from '@/components/brand-icons';
import { backgroundStyle } from '@/lib/profile/background';
import { profileFontFamily } from '@/lib/profile/profileFonts';
import { getLinkIcon } from '@/lib/profile/linkIcons';
import { getTemplate } from '@/lib/profile/templates';
import { buttonSizePadding, buttonSizeFontClass } from '@/lib/profile/buttonSize';
import { ImageWithFallback } from '@/components/image-with-fallback';

const SOCIAL_ICONS: Record<string, ComponentType<SVGProps<SVGSVGElement>>> = {
    Instagram: InstagramIcon,
    TikTok: TikTokIcon,
    Facebook: FacebookIcon,
    LinkedIn: LinkedInIcon,
    X: XIcon,
    YouTube: YouTubeIcon,
    Snapchat: SnapchatIcon,
    Threads: ThreadsIcon,
    Website: Globe,
};

function borderRadius(style: string) {
    return style === 'rounded' || style === 'outline' ? '9999px' : style === 'square' ? '0.5rem' : '0';
}

function waLink(phone: string, message: string) {
    const digits = phone.replace(/[^\d]/g, '');
    return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}

interface SocialLinkData {
    id: number;
    platform: string;
    url: string;
}

interface LinkData {
    id: number;
    title: string;
    url: string;
    thumbnail: string | null;
    icon_name: string | null;
    description: string | null;
}

interface ServiceData {
    id: number;
    name: string;
    description: string | null;
    price: string | null;
    cta_type: string;
}

interface PortfolioItemData {
    id: number;
    title: string;
    description: string | null;
    image_url: string | null;
}

interface TestimonialData {
    id: number;
    author_name: string;
    content: string;
    rating: number;
}

interface StoreProductData {
    id: number;
    name: string;
    image_url: string | null;
    price: number;
    discount_price: number | null;
    availability: string;
    variants: string | null;
}

interface ProfileUser {
    id: number;
    username: string;
    name: string | null;
    bio: string | null;
    about_text: string | null;
    avatar_url: string | null;
    show_avatar: boolean;
    social_position: string;
    phone: string | null;
    whatsapp: string | null;
    email: string | null;
    website: string | null;
    address: string | null;
    business_hours: string | null;
    lead_form_enabled: boolean;
    template: string;
    bg_type: string;
    bg_color: string;
    bg_gradient: string | null;
    bg_image: string | null;
    button_style: string;
    button_size: string;
    button_color: string;
    button_text_color: string;
    font_family: string;
    text_color: string;
    links: LinkData[];
    social_links: SocialLinkData[];
    services: ServiceData[];
    testimonials: TestimonialData[];
    store_products: StoreProductData[];
    business: { name: string; logo_url: string | null; description: string | null } | null;
}

export default function Profile({
    user,
    organization,
    displayTitle,
    isPro,
    portfolioProjects,
    galleryImages,
}: {
    user: ProfileUser;
    organization: string | null;
    displayTitle: string | null;
    isPro: boolean;
    portfolioProjects: PortfolioItemData[];
    galleryImages: PortfolioItemData[];
}) {
    const tmpl = getTemplate(user.template);
    const socialAtBottom = user.social_position === 'bottom';

    const socialIconsBlock = user.social_links.length > 0 && (
        <div className="flex flex-wrap justify-center items-center gap-4 mb-6">
            {user.social_links.map((s) => {
                const Icon = SOCIAL_ICONS[s.platform] || Globe;
                return (
                    <TrackedLink
                        key={s.id}
                        href={s.url}
                        type="SOCIAL_CLICK"
                        username={user.username}
                        meta={{ platform: s.platform }}
                        className="flex items-center justify-center opacity-90 hover:opacity-100 transition-opacity"
                    >
                        <Icon width={24} height={24} />
                    </TrackedLink>
                );
            })}
        </div>
    );

    return (
        <div
            className="min-h-dvh font-sans pt-20 pb-44 px-4 flex flex-col items-center relative overflow-hidden"
            style={{
                ...backgroundStyle({ bgType: user.bg_type, bgColor: user.bg_color, bgGradient: user.bg_gradient, bgImage: user.bg_image }),
                color: user.text_color,
                fontFamily: profileFontFamily(user.font_family),
            }}
        >
            <Head title={user.name || `@${user.username}`} />
            <ProfileTopBar username={user.username} displayName={user.name} avatarUrl={user.avatar_url} />

            <div className="z-10 w-full max-w-2xl mx-auto flex flex-col items-center">
                {/* Avatar */}
                {user.show_avatar !== false && (
                    <div className={`w-24 h-24 overflow-hidden mb-4 bg-gray-200 shadow-xl ${tmpl.avatarShape} ${tmpl.avatarRing}`}>
                        <ImageWithFallback
                            src={user.avatar_url}
                            alt={user.name || user.username}
                            className="w-full h-full object-cover"
                            fallback={
                                <div className="w-full h-full bg-gray-300 flex items-center justify-center text-3xl font-bold text-gray-500">
                                    {(user.name || user.username).charAt(0).toUpperCase()}
                                </div>
                            }
                        />
                    </div>
                )}

                {/* Name, title, bio */}
                <h1 className="text-2xl font-extrabold text-center">{user.name || `@${user.username}`}</h1>
                {(displayTitle || user.bio) && (
                    <p className="text-sm font-bold uppercase tracking-wide text-center max-w-md mb-2 opacity-90 mt-1">
                        {[displayTitle, user.bio].filter(Boolean).join(' · ')}
                    </p>
                )}
                {user.about_text && <p className="text-sm text-center max-w-md mb-2 opacity-80 whitespace-pre-line">{user.about_text}</p>}

                {/* Business panel (employee profiles) */}
                {user.business && (
                    <div className={`w-full max-w-md mb-6 p-4 flex items-center gap-3 ${tmpl.card}`}>
                        <ImageWithFallback
                            src={user.business.logo_url}
                            alt={user.business.name}
                            className="w-10 h-10 rounded-lg object-cover"
                            fallback={
                                <div className="w-10 h-10 rounded-lg bg-gray-300 flex items-center justify-center font-bold">
                                    {user.business.name.charAt(0)}
                                </div>
                            }
                        />
                        <div className="flex-1 min-w-0">
                            <p className="font-semibold text-sm truncate">{user.business.name}</p>
                            {user.business.description && <p className="text-xs opacity-70 truncate">{user.business.description}</p>}
                        </div>
                    </div>
                )}

                {/* Social icons (top position) */}
                {!socialAtBottom && socialIconsBlock}

                {/* Contact actions */}
                <div className="flex flex-wrap justify-center gap-2 mb-6">
                    <SaveContactButton
                        username={user.username}
                        displayName={user.name || user.username}
                        phone={user.phone}
                        email={user.email}
                        website={user.website}
                        jobTitle={null}
                        organization={organization}
                        className="flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-full bg-black/10 hover:bg-black/20 transition-colors"
                    />
                    {user.phone && (
                        <TrackedLink
                            href={`tel:${user.phone}`}
                            type="PHONE_CLICK"
                            username={user.username}
                            className="flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-full bg-black/10 hover:bg-black/20 transition-colors"
                        >
                            <Phone size={14} /> Call
                        </TrackedLink>
                    )}
                    {user.whatsapp && (
                        <TrackedLink
                            href={waLink(user.whatsapp, `Hi ${user.name || user.username}, I found you on TapConnect.`)}
                            type="WHATSAPP_CLICK"
                            username={user.username}
                            className="flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-full bg-black/10 hover:bg-black/20 transition-colors"
                        >
                            <MessageCircle size={14} /> WhatsApp
                        </TrackedLink>
                    )}
                    {user.email && (
                        <TrackedLink
                            href={`mailto:${user.email}`}
                            type="EMAIL_CLICK"
                            username={user.username}
                            className="flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-full bg-black/10 hover:bg-black/20 transition-colors"
                        >
                            <Mail size={14} /> Email
                        </TrackedLink>
                    )}
                    {user.website && (
                        <TrackedLink
                            href={user.website}
                            type="WEBSITE_CLICK"
                            username={user.username}
                            className="flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-full bg-black/10 hover:bg-black/20 transition-colors"
                        >
                            <Globe size={14} /> Website
                        </TrackedLink>
                    )}
                    {user.address && (
                        <span className="flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-full bg-black/10">
                            <MapPin size={14} /> {user.address}
                        </span>
                    )}
                </div>

                {user.business_hours && (
                    <div className="flex items-start gap-2 text-sm opacity-80 mb-6 text-center whitespace-pre-line">
                        <Clock size={16} className="mt-0.5 shrink-0" />
                        <span>{user.business_hours}</span>
                    </div>
                )}

                {/* Links */}
                <div className="w-full max-w-md space-y-4">
                    {user.links.map((link) => {
                        const Icon = getLinkIcon(link.icon_name);
                        const isOutline = user.button_style === 'outline';
                        return (
                            <TrackedButtonLink key={link.id} id={link.id} href={link.url} className="block w-full transition-transform hover:scale-[1.02]">
                                <span
                                    className={`flex items-center gap-3 w-full ${buttonSizeFontClass(user.button_size)}`}
                                    style={{
                                        backgroundColor: isOutline ? 'transparent' : user.button_color,
                                        color: isOutline ? user.button_color : user.button_text_color,
                                        border: isOutline ? `2px solid ${user.button_color}` : 'none',
                                        borderRadius: borderRadius(user.button_style),
                                        padding: buttonSizePadding(user.button_size),
                                    }}
                                >
                                    <ImageWithFallback
                                        src={link.thumbnail}
                                        alt=""
                                        className="w-7 h-7 rounded-full object-cover shrink-0"
                                        fallback={<Icon size={18} className="shrink-0 opacity-70" />}
                                    />
                                    <span className="flex-1 text-center">
                                        <span className="block font-medium">{link.title || 'Untitled Link'}</span>
                                        {link.description && <span className="block text-xs opacity-70">{link.description}</span>}
                                    </span>
                                </span>
                            </TrackedButtonLink>
                        );
                    })}
                </div>

                {/* Social icons (bottom position) */}
                {socialAtBottom && socialIconsBlock}

                {/* Services */}
                {user.services.length > 0 && isPro && (
                    <section className="w-full max-w-md mt-10">
                        <h2 className={`${tmpl.heading} mb-4 flex items-center gap-2`}>
                            <Briefcase size={18} /> Services
                        </h2>
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
                                            href={waLink(
                                                user.whatsapp,
                                                `Hi, I'm interested in "${s.name}"${s.cta_type === 'quote' ? ' — could I get a quote?' : s.cta_type === 'book' ? ' — I would like to book.' : '.'}`,
                                            )}
                                            type="SERVICE_REQUEST"
                                            username={user.username}
                                            meta={{ serviceId: s.id }}
                                            className="shrink-0 text-xs font-semibold px-4 py-2 rounded-full bg-black text-white whitespace-nowrap"
                                        >
                                            {s.cta_type === 'quote' ? 'Get Quote' : s.cta_type === 'book' ? 'Book' : 'Contact'}
                                        </TrackedLink>
                                    )}
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* Products / mini-store */}
                {user.store_products.length > 0 && (
                    <section className="w-full max-w-md mt-10">
                        <h2 className={`${tmpl.heading} mb-4`}>Products</h2>
                        <div className="grid grid-cols-2 gap-4">
                            {user.store_products.map((p) => (
                                <StoreProductCard
                                    key={p.id}
                                    username={user.username}
                                    whatsapp={user.whatsapp}
                                    id={p.id}
                                    name={p.name}
                                    imageUrl={p.image_url}
                                    price={p.price}
                                    discountPrice={p.discount_price}
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
                                        {item.image_url ? (
                                            <img src={item.image_url} alt={item.title} className="w-full h-full object-cover" />
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
                                    {item.image_url ? (
                                        <img src={item.image_url} alt={item.title} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                            <ImageIcon size={20} className="opacity-30" />
                                        </div>
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
                                    <p className="text-xs opacity-60 font-semibold mt-1">&mdash; {t.author_name}</p>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* Lead capture (Pro feature — locks automatically if the plan lapses) */}
                {user.lead_form_enabled && isPro && (
                    <section className="w-full max-w-md mt-10 rounded-2xl p-5" style={{ backgroundColor: user.button_color, color: user.button_text_color }}>
                        <h2 className="font-bold text-lg mb-1">Interested in working together?</h2>
                        <p className="text-sm opacity-80 mb-4">Send a message and {user.name || user.username} will get back to you.</p>
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

            <FloatingClaimBar displayName={user.name} username={user.username} />
        </div>
    );
}
