import { useState, useEffect } from 'react';
import { X, Globe } from 'lucide-react';
import { InstagramIcon, TikTokIcon, YouTubeIcon, FacebookIcon, XIcon, LinkedInIcon, SnapchatIcon, ThreadsIcon } from '@/components/brand-icons';
import { buildSocialUrl } from '@/lib/profile/socialUrl';
import { apiFetch } from '@/lib/api';

export const SOCIAL_PLATFORMS = ['Instagram', 'TikTok', 'Facebook', 'LinkedIn', 'X', 'YouTube', 'Snapchat', 'Threads', 'Website'];

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

export type SocialLinkType = { id: number; platform: string; url: string };

export function SocialLinkModal({
    existing,
    defaultPlatform,
    onClose,
    onSaved,
}: {
    existing?: SocialLinkType | null;
    defaultPlatform?: string;
    onClose: () => void;
    onSaved: (link: SocialLinkType) => void;
}) {
    const [platform, setPlatform] = useState(existing?.platform || defaultPlatform || 'Instagram');
    const [input, setInput] = useState(existing?.url || '');
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = '';
        };
    }, []);

    const resolvedUrl = buildSocialUrl(platform, input);

    const handleSave = async () => {
        if (!input.trim()) {
            setError('Enter a username or profile link.');
            return;
        }
        setSaving(true);
        setError('');
        try {
            const { ok, data } = await apiFetch(
                existing ? `/api/social-links/${existing.id}` : '/api/social-links',
                { platform, url: resolvedUrl },
                existing ? 'PUT' : 'POST',
            );
            if (!ok) throw new Error((data.error as string) || 'Could not save');
            onSaved(data.socialLink as SocialLinkType);
            onClose();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Could not save');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
            <div className="absolute inset-0 bg-black/40" onClick={onClose} />
            <div className="relative bg-white w-full sm:max-w-md sm:rounded-3xl rounded-t-3xl p-6 max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-5">
                    <h2 className="text-lg font-bold">{existing ? 'Edit social icon' : 'Add social icon'}</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-black p-1">
                        <X size={20} />
                    </button>
                </div>

                <div className="grid grid-cols-5 gap-2 mb-5">
                    {SOCIAL_PLATFORMS.map((p) => {
                        const Icon = PLATFORM_ICONS[p];
                        const selected = platform === p;
                        return (
                            <button
                                key={p}
                                type="button"
                                onClick={() => setPlatform(p)}
                                title={p}
                                className={`flex flex-col items-center gap-1 p-2.5 rounded-xl transition-colors ${selected ? 'bg-black text-white' : 'bg-gray-50 hover:bg-gray-100 text-gray-600'}`}
                            >
                                <Icon width={18} height={18} />
                            </button>
                        );
                    })}
                </div>

                <label className="block text-sm font-semibold mb-1.5">{platform === 'Website' ? 'Website URL' : `Username or ${platform} profile link`}</label>
                <input
                    type="text"
                    autoFocus
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder={platform === 'Website' ? 'https://yoursite.com' : '@yourusername'}
                    className="w-full px-4 py-3 rounded-lg bg-gray-100 border-transparent focus:bg-white focus:border-black focus:ring-2 focus:ring-black/10 outline-none transition-all"
                />
                {input.trim() && <p className="text-xs text-gray-500 mt-2 truncate">Will link to: {resolvedUrl}</p>}
                {error && <p className="text-xs text-red-500 mt-2">{error}</p>}

                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="w-full bg-black text-white rounded-full py-3.5 font-semibold mt-6 hover:bg-gray-800 transition-colors disabled:opacity-60"
                >
                    {saving ? 'Saving...' : 'Save'}
                </button>
            </div>
        </div>
    );
}
