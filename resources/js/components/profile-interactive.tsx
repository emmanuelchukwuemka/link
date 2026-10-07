import { useState, useEffect } from 'react';
import { Link } from '@inertiajs/react';
import { Download, Send, CheckCircle2, Image as ImageIcon, Share2, X as CloseIcon, Link2, Check, MessageSquare } from 'lucide-react';
import { WhatsAppIcon, XIcon, FacebookIcon, LinkedInIcon } from '@/components/brand-icons';

function track(username: string, type: string, meta?: Record<string, unknown>) {
    fetch('/api/analytics/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, type, meta }),
        keepalive: true,
    }).catch(() => {});
}

export function TrackedLink({
    href,
    type,
    username,
    className,
    style,
    children,
    meta,
}: {
    href: string;
    type: string;
    username: string;
    className?: string;
    style?: React.CSSProperties;
    children: React.ReactNode;
    meta?: Record<string, unknown>;
}) {
    return (
        <a
            href={href}
            target={href.startsWith('http') ? '_blank' : undefined}
            rel={href.startsWith('http') ? 'noopener noreferrer' : undefined}
            className={className}
            style={style}
            onClick={() => track(username, type, meta)}
        >
            {children}
        </a>
    );
}

export function TrackedButtonLink({ id, href, className, children }: { id: number; href: string; className?: string; children: React.ReactNode }) {
    return (
        <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className={className}
            onClick={() => {
                fetch(`/api/links/${id}/click`, { method: 'POST', keepalive: true }).catch(() => {});
            }}
        >
            {children}
        </a>
    );
}

export function SaveContactButton({
    username,
    displayName,
    phone,
    email,
    website,
    jobTitle,
    organization,
    className,
}: {
    username: string;
    displayName: string;
    phone?: string | null;
    email?: string | null;
    website?: string | null;
    jobTitle?: string | null;
    organization?: string | null;
    className?: string;
}) {
    const handleSave = () => {
        const lines = [
            'BEGIN:VCARD',
            'VERSION:3.0',
            `FN:${displayName}`,
            organization ? `ORG:${organization}` : '',
            jobTitle ? `TITLE:${jobTitle}` : '',
            phone ? `TEL;TYPE=CELL:${phone}` : '',
            email ? `EMAIL:${email}` : '',
            website ? `URL:${website}` : '',
            'END:VCARD',
        ].filter(Boolean);

        const blob = new Blob([lines.join('\n')], { type: 'text/vcard' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${displayName || username}.vcf`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);

        track(username, 'CONTACT_SAVE');
    };

    return (
        <button onClick={handleSave} className={className}>
            <Download size={16} /> Save Contact
        </button>
    );
}

export function LeadForm({ username, className }: { username: string; className?: string }) {
    const [form, setForm] = useState({ name: '', phone: '', email: '', message: '' });
    const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setStatus('sending');
        try {
            const res = await fetch('/api/leads', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, ...form }),
            });
            if (!res.ok) throw new Error();
            setStatus('sent');
        } catch {
            setStatus('error');
        }
    };

    if (status === 'sent') {
        return (
            <div className={`${className} flex flex-col items-center gap-2 text-center py-6`}>
                <CheckCircle2 className="text-green-500" size={32} />
                <p className="font-semibold">Thanks! Your message was sent.</p>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className={`${className} space-y-3`}>
            <input
                required
                placeholder="Your name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full px-4 py-3 rounded-lg bg-white/90 text-black outline-none"
            />
            <input
                placeholder="Phone"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="w-full px-4 py-3 rounded-lg bg-white/90 text-black outline-none"
            />
            <input
                type="email"
                placeholder="Email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full px-4 py-3 rounded-lg bg-white/90 text-black outline-none"
            />
            <textarea
                placeholder="Message"
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                className="w-full px-4 py-3 rounded-lg bg-white/90 text-black outline-none min-h-[80px]"
            />
            <button
                type="submit"
                disabled={status === 'sending'}
                className="w-full flex items-center justify-center gap-2 bg-black text-white py-3 rounded-lg font-semibold disabled:opacity-60"
            >
                <Send size={16} /> {status === 'sending' ? 'Sending...' : 'Send'}
            </button>
            {status === 'error' && <p className="text-red-300 text-sm text-center">Something went wrong. Please try again.</p>}
        </form>
    );
}

export function trackEvent(username: string, type: string, meta?: Record<string, unknown>) {
    track(username, type, meta);
}

type VariantGroup = { name: string; options: string[] };

function waLinkInternal(phone: string, message: string) {
    const digits = phone.replace(/[^\d]/g, '');
    return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}

export function StoreProductCard({
    username,
    whatsapp,
    id,
    name,
    imageUrl,
    price,
    discountPrice,
    availability,
    variantsJson,
    cardClassName = 'bg-black/5 rounded-2xl',
}: {
    username: string;
    whatsapp: string | null;
    id: number;
    name: string;
    imageUrl: string | null;
    price: number;
    discountPrice: number | null;
    availability: string;
    variantsJson: string | null;
    cardClassName?: string;
}) {
    const groups: VariantGroup[] = (() => {
        if (!variantsJson) return [];
        try {
            return JSON.parse(variantsJson);
        } catch {
            return [];
        }
    })();

    const [selected, setSelected] = useState<Record<string, string>>(Object.fromEntries(groups.map((g) => [g.name, g.options[0] || ''])));

    useEffect(() => {
        track(username, 'PRODUCT_VIEW', { productId: id });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);

    const finalPrice = discountPrice ?? price;
    const variantSummary = Object.entries(selected)
        .filter(([, v]) => v)
        .map(([k, v]) => `${k}: ${v}`)
        .join(', ');

    return (
        <div className={`overflow-hidden ${cardClassName}`}>
            <div className="aspect-square bg-black/10 flex items-center justify-center">
                {imageUrl ? (
                    <img src={imageUrl} alt={name} className="w-full h-full object-cover" />
                ) : (
                    <ImageIcon size={28} className="opacity-30" />
                )}
            </div>
            <div className="p-3 space-y-1.5">
                <p className="font-semibold text-sm truncate">{name}</p>
                <p className="text-sm font-bold">
                    &#8358;{finalPrice.toLocaleString()}
                    {discountPrice && <span className="text-xs opacity-50 line-through ml-1">&#8358;{price.toLocaleString()}</span>}
                </p>

                {groups.map((g) => (
                    <select
                        key={g.name}
                        value={selected[g.name] || ''}
                        onChange={(e) => setSelected({ ...selected, [g.name]: e.target.value })}
                        className="w-full text-xs bg-white/70 rounded-lg px-2 py-1 outline-none"
                    >
                        {g.options.map((opt) => (
                            <option key={opt} value={opt}>
                                {g.name}: {opt}
                            </option>
                        ))}
                    </select>
                ))}

                {availability === 'out_of_stock' ? (
                    <span className="text-xs opacity-60 block">Out of stock</span>
                ) : availability === 'coming_soon' ? (
                    <span className="text-xs opacity-60 block">Coming soon</span>
                ) : whatsapp ? (
                    <a
                        href={waLinkInternal(whatsapp, `Hi, I'd like to order "${name}"${variantSummary ? ` (${variantSummary})` : ''} — ₦${finalPrice.toLocaleString()}.`)}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => track(username, 'ADD_TO_CART', { productId: id, variants: selected })}
                        className="mt-1 block text-center text-xs font-semibold py-1.5 rounded-full bg-black text-white"
                    >
                        Order
                    </a>
                ) : null}
            </div>
        </div>
    );
}

function ShareModal({
    username,
    displayName,
    avatarUrl,
    onClose,
}: {
    username: string;
    displayName: string | null;
    avatarUrl: string | null;
    onClose: () => void;
}) {
    const [copied, setCopied] = useState(false);
    const profileUrl = `${window.location.origin}/${username}`;

    const handleCopy = () => {
        navigator.clipboard.writeText(profileUrl);
        setCopied(true);
        track(username, 'SHARE', { method: 'copy' });
        setTimeout(() => setCopied(false), 1500);
    };

    const shareTargets = [
        { name: 'WhatsApp', Icon: WhatsAppIcon, bg: '#25D366', href: `https://wa.me/?text=${encodeURIComponent(profileUrl)}` },
        { name: 'X', Icon: XIcon, bg: '#000000', href: `https://twitter.com/intent/tweet?url=${encodeURIComponent(profileUrl)}` },
        { name: 'Facebook', Icon: FacebookIcon, bg: '#1877F2', href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(profileUrl)}` },
        { name: 'LinkedIn', Icon: LinkedInIcon, bg: '#0A66C2', href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(profileUrl)}` },
        { name: 'Messages', Icon: MessageSquare, bg: '#34C759', href: `sms:?&body=${encodeURIComponent(profileUrl)}` },
    ];

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50" onClick={onClose}>
            <div
                className="bg-white rounded-t-3xl sm:rounded-3xl w-full sm:max-w-sm p-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))]"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center justify-between mb-5">
                    <h2 className="font-bold text-lg">Share Profile</h2>
                    <button onClick={onClose} className="p-1.5 rounded-full hover:bg-gray-100 text-gray-500">
                        <CloseIcon size={18} />
                    </button>
                </div>

                <div className="bg-black rounded-2xl p-5 flex flex-col items-center text-center mb-5">
                    <div className="w-16 h-16 rounded-full bg-gray-700 overflow-hidden mb-3 flex items-center justify-center text-xl font-bold text-white">
                        {avatarUrl ? (
                            <img src={avatarUrl} alt={displayName || username} className="w-full h-full object-cover" />
                        ) : (
                            (displayName || username).charAt(0).toUpperCase()
                        )}
                    </div>
                    <p className="font-bold text-white">{displayName || username}</p>
                    <p className="text-xs text-gray-400">
                        {window.location.host}/{username}
                    </p>
                </div>

                <div className="grid grid-cols-3 gap-y-4 mb-5">
                    {shareTargets.map(({ name, Icon, bg, href }) => (
                        <a
                            key={name}
                            href={href}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={() => track(username, 'SHARE', { method: name })}
                            className="flex flex-col items-center gap-1.5"
                        >
                            <span className="w-12 h-12 rounded-full flex items-center justify-center text-white" style={{ backgroundColor: bg }}>
                                <Icon width={20} height={20} />
                            </span>
                            <span className="text-[11px] text-gray-600">{name}</span>
                        </a>
                    ))}
                    <button onClick={handleCopy} className="flex flex-col items-center gap-1.5">
                        <span className="w-12 h-12 rounded-full flex items-center justify-center text-gray-700 bg-gray-100">
                            {copied ? <Check size={20} /> : <Link2 size={20} />}
                        </span>
                        <span className="text-[11px] text-gray-600">{copied ? 'Copied' : 'Copy link'}</span>
                    </button>
                </div>

                <div className="border-t border-gray-100 pt-4 text-center">
                    <p className="font-semibold text-sm">Want a profile like this?</p>
                    <p className="text-xs text-gray-500 mb-3">Get your own TapConnect — the smart NFC card for your links.</p>
                    <div className="flex items-center justify-center gap-2">
                        <Link href="/marketplace" className="bg-black text-white text-xs font-semibold px-4 py-2 rounded-full">
                            Shop Digital Cards
                        </Link>
                        <Link href="/register" className="bg-gray-100 text-black text-xs font-semibold px-4 py-2 rounded-full">
                            Create Your Profile
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}

export function ProfileTopBar({ username, displayName, avatarUrl }: { username: string; displayName: string | null; avatarUrl: string | null }) {
    const [shareOpen, setShareOpen] = useState(false);

    return (
        <>
            <div
                className="fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-4"
                style={{ paddingTop: 'calc(0.75rem + env(safe-area-inset-top))', paddingBottom: '0.75rem' }}
            >
                <a
                    href="/marketplace"
                    onClick={() => track(username, 'LOGO_CLICK')}
                    className="w-9 h-9 rounded-full bg-white/90 backdrop-blur-xs shadow-sm flex items-center justify-center overflow-hidden"
                    aria-label="Shop TapConnect cards"
                >
                    <img src="/logo-icon.png" alt="TapConnect" className="w-5 h-5" />
                </a>
                <button
                    onClick={() => setShareOpen(true)}
                    className="w-9 h-9 rounded-full bg-white/90 backdrop-blur-xs shadow-sm flex items-center justify-center text-black"
                    aria-label="Share profile"
                >
                    <Share2 size={16} />
                </button>
            </div>
            {shareOpen && <ShareModal username={username} displayName={displayName} avatarUrl={avatarUrl} onClose={() => setShareOpen(false)} />}
        </>
    );
}

export function FloatingClaimBar({ displayName, username }: { displayName: string | null; username: string }) {
    return (
        <div
            className="fixed bottom-0 left-0 right-0 z-30 flex flex-col items-center gap-2 px-4 pb-3"
            style={{ paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom))' }}
        >
            <a
                href="/marketplace"
                onClick={() => track(username, 'CLAIM_BAR_CLICK')}
                className="bg-white rounded-full shadow-lg px-5 py-2.5 text-sm font-semibold text-black hover:scale-[1.02] transition-transform"
            >
                tapconnect.ng/you
            </a>
            <a
                href="/marketplace"
                onClick={() => track(username, 'CLAIM_BAR_CLICK')}
                className="text-xs font-medium text-white bg-black/60 backdrop-blur-xs px-3 py-1 rounded-full hover:bg-black/70 transition-colors"
            >
                Join {displayName || username} and own a TapConnect card
            </a>
        </div>
    );
}
