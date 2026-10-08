import { useState, useEffect } from 'react';
import { Link as InertiaLink } from '@inertiajs/react';
import { Reorder, useDragControls } from 'framer-motion';
import { Trash2, GripVertical, Link as LinkIcon, Share2, Crown, Plus, X, ChevronRight, Eye, Paintbrush, Sparkles } from 'lucide-react';
import DashboardLayout from '@/layouts/dashboard-layout';
import { getLinkIcon } from '@/lib/profile/linkIcons';
import { ImageUploader } from '@/components/image-uploader';
import { ImageWithFallback } from '@/components/image-with-fallback';
import { ProfileHeader } from '@/components/dashboard/profile-header';
import { StoreProductsPanel } from '@/components/dashboard/store-products-panel';
import { LinkEditorModal, type LinkType } from '@/components/dashboard/link-editor-modal';
import { SocialLinkModal, SOCIAL_PLATFORMS, type SocialLinkType } from '@/components/dashboard/social-link-modal';
import { InstagramIcon, TikTokIcon, YouTubeIcon, FacebookIcon, XIcon, LinkedInIcon, SnapchatIcon, ThreadsIcon } from '@/components/brand-icons';
import { Globe } from 'lucide-react';
import { apiFetch } from '@/lib/api';

const FREE_LINK_LIMIT = 5;

const PLATFORM_ICONS: Record<string, (props: { width?: number; height?: number; className?: string }) => React.ReactNode> = {
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

function domainOf(url: string): string {
    try {
        return new URL(url).hostname.replace(/^www\./, '');
    } catch {
        return url;
    }
}

function ThumbnailPopup({ link, onClose, onSaved }: { link: LinkType; onClose: () => void; onSaved: (thumbnail: string) => void }) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/40" onClick={onClose} />
            <div className="relative bg-white rounded-3xl p-6 w-full max-w-xs">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold">Link thumbnail</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-black p-1">
                        <X size={18} />
                    </button>
                </div>
                <div className="w-20 h-20 rounded-2xl bg-gray-100 flex items-center justify-center overflow-hidden mx-auto mb-4">
                    <ImageWithFallback src={link.thumbnail} alt="" className="w-full h-full object-cover" fallback={<LinkIcon size={24} className="text-gray-400" />} />
                </div>
                <div className="flex flex-col items-center gap-2">
                    <ImageUploader
                        onUploaded={(url) => {
                            onSaved(url);
                            onClose();
                        }}
                        label={link.thumbnail ? 'Change image' : 'Upload image'}
                    />
                    {link.thumbnail && (
                        <button
                            onClick={() => {
                                onSaved('');
                                onClose();
                            }}
                            className="text-xs text-gray-400 hover:text-red-500"
                        >
                            Remove thumbnail
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

function LinkRow({
    link,
    onOpenEdit,
    onOpenThumbnail,
    onDelete,
    onToggleActive,
}: {
    link: LinkType & { clicks?: number };
    onOpenEdit: (link: LinkType) => void;
    onOpenThumbnail: (link: LinkType) => void;
    onDelete: (id: number) => void;
    onToggleActive: (id: number, currentStatus: boolean) => void;
}) {
    const dragControls = useDragControls();
    const Icon = getLinkIcon(link.icon_name);

    return (
        <Reorder.Item value={link} dragListener={false} dragControls={dragControls} className="bg-white rounded-3xl p-4 shadow-sm flex items-center gap-3">
            <div onPointerDown={(e) => dragControls.start(e)} className="text-gray-400 cursor-grab active:cursor-grabbing hover:text-gray-600 touch-none shrink-0">
                <GripVertical />
            </div>

            <button
                onClick={(e) => {
                    e.stopPropagation();
                    onOpenThumbnail(link);
                }}
                className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center overflow-hidden shrink-0 hover:ring-2 hover:ring-black/20 transition-all"
                title="Change thumbnail"
            >
                <ImageWithFallback src={link.thumbnail} alt="" className="w-full h-full object-cover" fallback={<Icon size={20} className="text-gray-400" />} />
            </button>

            <button onClick={() => onOpenEdit(link)} className="flex-1 min-w-0 text-left">
                <p className="font-semibold text-sm truncate">{link.title || 'Untitled Link'}</p>
                <p className="text-xs text-gray-400 truncate">
                    {link.clicks ?? 0} click{(link.clicks ?? 0) === 1 ? '' : 's'} &middot; {domainOf(link.url)}
                </p>
            </button>

            <button
                onClick={() => onToggleActive(link.id, link.is_active)}
                className={`w-11 h-6 rounded-full relative shrink-0 transition-colors ${link.is_active ? 'bg-green-500' : 'bg-gray-300'}`}
            >
                <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-all ${link.is_active ? 'left-[22px]' : 'left-0.5'}`} />
            </button>
            <button onClick={() => onDelete(link.id)} className="text-gray-400 hover:text-red-500 p-1.5 rounded-lg hover:bg-red-50 transition-colors shrink-0">
                <Trash2 size={16} />
            </button>
        </Reorder.Item>
    );
}

function DashboardLinksInner() {
    const params = new URLSearchParams(window.location.search);
    const [links, setLinks] = useState<(LinkType & { clicks?: number })[]>([]);
    const [socialLinks, setSocialLinks] = useState<SocialLinkType[]>([]);
    const [loading, setLoading] = useState(true);
    const [isPro, setIsPro] = useState(false);
    const [linkError] = useState('');
    const [profile, setProfile] = useState<{ username: string; name: string | null; bio: string | null; avatar_url: string | null; social_position: string } | null>(null);
    const [activeTab, setActiveTab] = useState<'links' | 'shop'>(params.get('tab') === 'shop' ? 'shop' : 'links');

    const [linkModalOpen, setLinkModalOpen] = useState(false);
    const [editingLink, setEditingLink] = useState<LinkType | null>(null);
    const [thumbnailPopupLink, setThumbnailPopupLink] = useState<LinkType | null>(null);
    const [socialModalOpen, setSocialModalOpen] = useState(false);
    const [editingSocial, setEditingSocial] = useState<SocialLinkType | null>(null);
    const [socialDefaultPlatform, setSocialDefaultPlatform] = useState<string>('Instagram');

    const fetchLinks = async () => {
        try {
            const res = await fetch('/api/links');
            const data = await res.json();
            if (data.links) setLinks(data.links);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const fetchSocialLinks = async () => {
        try {
            const res = await fetch('/api/social-links');
            const data = await res.json();
            if (data.socialLinks) setSocialLinks(data.socialLinks);
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        fetchLinks();
        fetchSocialLinks();
        fetch('/api/auth/me')
            .then((res) => res.json())
            .then((data) => {
                if (data.user) {
                    setIsPro(data.user.plan === 'pro' && (!data.user.plan_expires_at || new Date(data.user.plan_expires_at) > new Date()));
                    setProfile({
                        username: data.user.username,
                        name: data.user.name,
                        bio: data.user.bio,
                        avatar_url: data.user.avatar_url,
                        social_position: data.user.social_position || 'top',
                    });
                }
            });
        if (params.get('add') === '1') {
            setEditingLink(null);
            setLinkModalOpen(true);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleDelete = async (id: number) => {
        setLinks(links.filter((l) => l.id !== id));
        try {
            await apiFetch(`/api/links/${id}`, undefined, 'DELETE');
        } catch (err) {
            console.error(err);
            fetchLinks();
        }
    };

    const handleToggleActive = async (id: number, currentStatus: boolean) => {
        setLinks(links.map((l) => (l.id === id ? { ...l, is_active: !currentStatus } : l)));
        try {
            await apiFetch(`/api/links/${id}`, { isActive: !currentStatus }, 'PATCH');
        } catch (err) {
            console.error(err);
        }
    };

    const handleReorder = (newOrder: (LinkType & { clicks?: number })[]) => {
        setLinks(newOrder);
        apiFetch('/api/links/reorder', { ids: newOrder.map((l) => l.id) }, 'PATCH').catch((err) => console.error(err));
    };

    const handleThumbnailSaved = async (link: LinkType, thumbnail: string) => {
        setLinks(links.map((l) => (l.id === link.id ? { ...l, thumbnail } : l)));
        try {
            await apiFetch(`/api/links/${link.id}`, { title: link.title, url: link.url, thumbnail: thumbnail || null }, 'PUT');
        } catch (err) {
            console.error(err);
        }
    };

    const handleSocialPositionChange = async (position: 'top' | 'bottom') => {
        if (!profile) return;
        setProfile({ ...profile, social_position: position });
        try {
            await apiFetch('/api/profile', { socialPosition: position }, 'PUT');
        } catch (err) {
            console.error(err);
        }
    };

    if (loading) return <div className="text-center py-20">Loading...</div>;

    return (
        <div className="grid md:grid-cols-[1fr_400px] gap-8 items-start pb-24">
            <div className="space-y-6 min-w-0">
                {profile && <ProfileHeader username={profile.username} displayName={profile.name} bio={profile.bio} avatarUrl={profile.avatar_url} />}

                {/* Links / Shop tabs */}
                <div className="flex items-center gap-1 bg-white rounded-full p-1 shadow-sm w-fit">
                    <button
                        onClick={() => setActiveTab('links')}
                        className={`px-5 py-2 rounded-full text-sm font-semibold transition-colors ${activeTab === 'links' ? 'bg-black text-white' : 'text-gray-500 hover:text-black'}`}
                    >
                        Links
                    </button>
                    <button
                        onClick={() => setActiveTab('shop')}
                        className={`px-5 py-2 rounded-full text-sm font-semibold transition-colors ${activeTab === 'shop' ? 'bg-black text-white' : 'text-gray-500 hover:text-black'}`}
                    >
                        Shop
                    </button>
                </div>

                {activeTab === 'shop' ? (
                    <StoreProductsPanel showTabs={false} showHeading={false} />
                ) : (
                    <>
                        {!isPro && (
                            <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-sm bg-white rounded-2xl px-4 py-3 shadow-sm">
                                <span className="text-black flex items-center gap-1.5">
                                    <Crown size={14} className="text-amber-500 shrink-0" /> {links.length} / {FREE_LINK_LIMIT} links used on the Free plan
                                </span>
                                <InertiaLink href="/dashboard/subscription" className="font-semibold text-black hover:underline">
                                    Upgrade for unlimited
                                </InertiaLink>
                            </div>
                        )}
                        {linkError && <div className="bg-red-50 text-red-500 p-3 rounded-lg text-sm">{linkError}</div>}
                        <button
                            onClick={() => {
                                setEditingLink(null);
                                setLinkModalOpen(true);
                            }}
                            className="w-full bg-[#000000] text-white py-4 rounded-full font-semibold text-lg hover:bg-[#000000]/90 transition-colors flex items-center justify-center gap-2"
                        >
                            <Plus /> Add link
                        </button>

                        {links.length === 0 ? (
                            <div className="bg-white rounded-3xl p-8 text-center text-black shadow-sm">
                                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <LinkIcon size={32} className="text-gray-400" />
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 mb-2">Show the world who you are</h3>
                                <p>Add a link to get started.</p>
                            </div>
                        ) : (
                            <Reorder.Group axis="y" values={links} onReorder={handleReorder} className="space-y-3">
                                {links.map((link) => (
                                    <LinkRow
                                        key={link.id}
                                        link={link}
                                        onOpenEdit={(l) => {
                                            setEditingLink(l);
                                            setLinkModalOpen(true);
                                        }}
                                        onOpenThumbnail={(l) => setThumbnailPopupLink(l)}
                                        onDelete={handleDelete}
                                        onToggleActive={handleToggleActive}
                                    />
                                ))}
                            </Reorder.Group>
                        )}

                        <div className="bg-white rounded-3xl p-6 shadow-sm">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="font-bold text-lg flex items-center gap-2">
                                    <Share2 size={18} /> Social Icons
                                </h2>
                            </div>

                            <div className="grid grid-cols-5 gap-2 mb-4">
                                {SOCIAL_PLATFORMS.map((p) => {
                                    const Icon = PLATFORM_ICONS[p];
                                    const existing = socialLinks.find((s) => s.platform === p);
                                    return (
                                        <button
                                            key={p}
                                            type="button"
                                            onClick={() => {
                                                setEditingSocial(existing || null);
                                                setSocialDefaultPlatform(p);
                                                setSocialModalOpen(true);
                                            }}
                                            title={p}
                                            className={`relative flex flex-col items-center gap-1 p-2.5 rounded-xl transition-colors ${
                                                existing ? 'bg-black text-white' : 'bg-gray-50 hover:bg-gray-100 text-gray-400 border border-dashed border-gray-300'
                                            }`}
                                        >
                                            <Icon width={18} height={18} />
                                            {!existing && <Plus size={10} className="absolute -top-1 -right-1 bg-white rounded-full text-gray-400" />}
                                        </button>
                                    );
                                })}
                            </div>

                            {socialLinks.length > 0 && (
                                <div className="flex items-center justify-between gap-4 bg-gray-50 rounded-xl p-4 mb-2">
                                    <div className="min-w-0">
                                        <p className="font-semibold text-sm">Show social icons at the top</p>
                                        <p className="text-xs text-gray-500">Turn off to show them below your links instead.</p>
                                    </div>
                                    <button
                                        onClick={() => handleSocialPositionChange(profile?.social_position === 'bottom' ? 'top' : 'bottom')}
                                        className={`w-12 h-6 rounded-full relative shrink-0 transition-colors ${profile?.social_position !== 'bottom' ? 'bg-green-500' : 'bg-gray-300'}`}
                                    >
                                        <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-all ${profile?.social_position !== 'bottom' ? 'left-[26px]' : 'left-0.5'}`} />
                                    </button>
                                </div>
                            )}
                        </div>

                        <InertiaLink href="/dashboard/subscription" className="flex items-center justify-between bg-white rounded-3xl p-4 shadow-sm hover:shadow-md transition-shadow">
                            <div>
                                <p className="font-semibold text-sm">TapConnect branding</p>
                                <p className="text-xs text-gray-500">{isPro ? 'Hidden on your profile (Pro)' : 'Shown on your profile — upgrade to remove it'}</p>
                            </div>
                            <ChevronRight size={18} className="text-gray-400" />
                        </InertiaLink>
                    </>
                )}
            </div>

            {/* Preview Section */}
            <div className="hidden md:flex justify-center sticky top-24 border-[12px] border-black rounded-[3rem] h-[700px] w-[340px] bg-white overflow-y-auto overflow-x-hidden shadow-2xl relative">
                <div className="w-32 h-6 bg-black absolute top-0 rounded-b-xl z-10 left-1/2 -translate-x-1/2"></div>
                <div className="w-full py-12 px-4 flex flex-col items-center gap-4 bg-[#F3F3F1] min-h-full">
                    <div className="w-24 h-24 bg-gray-300 rounded-full mb-2 overflow-hidden flex items-center justify-center text-2xl font-bold text-gray-500">
                        <ImageWithFallback src={profile?.avatar_url} alt="" className="w-full h-full object-cover" fallback={(profile?.name || profile?.username || 'U').charAt(0).toUpperCase()} />
                    </div>
                    <h2 className="font-bold text-xl mb-4">{profile ? `@${profile.username}` : '@username'}</h2>

                    {links
                        .filter((l) => l.is_active)
                        .map((link) => {
                            const PreviewIcon = getLinkIcon(link.icon_name);
                            return (
                                <a
                                    key={link.id}
                                    href={link.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="w-full bg-white text-black font-semibold p-4 text-center rounded-full shadow-sm hover:scale-[1.02] transition-transform relative flex items-center justify-center gap-2"
                                >
                                    <ImageWithFallback src={link.thumbnail} alt="" className="w-6 h-6 rounded-full object-cover shrink-0" fallback={<PreviewIcon size={16} className="text-gray-500" />} />
                                    {link.title || 'Untitled'}
                                </a>
                            );
                        })}
                </div>
            </div>

            {/* Persistent bottom action bar */}
            <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 bg-black rounded-full shadow-2xl flex items-center gap-1 p-1.5">
                <button
                    onClick={() => {
                        setActiveTab('links');
                        setEditingLink(null);
                        setLinkModalOpen(true);
                    }}
                    className="flex flex-col items-center gap-0.5 text-white px-4 py-2 rounded-full hover:bg-white/10 transition-colors"
                >
                    <Plus size={18} />
                    <span className="text-[10px] font-semibold">Add</span>
                </button>
                {profile && (
                    <a href={`/${profile.username}`} target="_blank" rel="noopener noreferrer" className="flex flex-col items-center gap-0.5 text-white px-4 py-2 rounded-full hover:bg-white/10 transition-colors">
                        <Eye size={18} />
                        <span className="text-[10px] font-semibold">Preview</span>
                    </a>
                )}
                <InertiaLink href="/dashboard/appearance" className="flex flex-col items-center gap-0.5 text-white px-4 py-2 rounded-full hover:bg-white/10 transition-colors">
                    <Paintbrush size={18} />
                    <span className="text-[10px] font-semibold">Design</span>
                </InertiaLink>
                <InertiaLink href="/dashboard/subscription" className="flex flex-col items-center gap-0.5 text-white px-4 py-2 rounded-full hover:bg-white/10 transition-colors">
                    <Sparkles size={18} />
                    <span className="text-[10px] font-semibold">Enhance</span>
                </InertiaLink>
            </div>

            {linkModalOpen && (
                <LinkEditorModal
                    existing={editingLink}
                    onClose={() => setLinkModalOpen(false)}
                    onSaved={(saved) => {
                        setLinks((prev) => {
                            const exists = prev.some((l) => l.id === saved.id);
                            return exists ? prev.map((l) => (l.id === saved.id ? { ...l, ...saved } : l)) : [saved, ...prev];
                        });
                    }}
                />
            )}

            {socialModalOpen && (
                <SocialLinkModal
                    existing={editingSocial}
                    defaultPlatform={socialDefaultPlatform}
                    onClose={() => setSocialModalOpen(false)}
                    onSaved={(saved) => {
                        setSocialLinks((prev) => {
                            const exists = prev.some((s) => s.id === saved.id);
                            return exists ? prev.map((s) => (s.id === saved.id ? saved : s)) : [...prev, saved];
                        });
                    }}
                />
            )}

            {thumbnailPopupLink && (
                <ThumbnailPopup link={thumbnailPopupLink} onClose={() => setThumbnailPopupLink(null)} onSaved={(thumbnail) => handleThumbnailSaved(thumbnailPopupLink, thumbnail)} />
            )}
        </div>
    );
}

export default function DashboardLinksPage() {
    return (
        <DashboardLayout>
            <DashboardLinksInner />
        </DashboardLayout>
    );
}
