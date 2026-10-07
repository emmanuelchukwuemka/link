import { useState } from 'react';
import { Link } from '@inertiajs/react';
import { Copy, Check, ExternalLink, Plus, ShoppingBag, Paintbrush } from 'lucide-react';

export function ProfileHeader({
    username,
    displayName,
    bio,
    avatarUrl,
    showQuickActions = false,
}: {
    username: string;
    displayName: string | null;
    bio: string | null;
    avatarUrl: string | null;
    showQuickActions?: boolean;
}) {
    const [copied, setCopied] = useState(false);
    const url = `${window.location.host}/${username}`;

    const handleCopy = () => {
        navigator.clipboard.writeText(`${window.location.origin}/${username}`);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
    };

    return (
        <div className="bg-white rounded-3xl p-5 shadow-sm">
            <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-black overflow-hidden flex items-center justify-center text-xl font-bold text-white shrink-0">
                    {avatarUrl ? (
                        <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                        (displayName || username).charAt(0).toUpperCase()
                    )}
                </div>
                <div className="flex-1 min-w-0">
                    <p className="font-bold text-lg truncate">{displayName || `@${username}`}</p>
                    {bio && <p className="text-sm text-gray-500 truncate">{bio}</p>}
                    <div className="flex items-center gap-1.5 mt-1">
                        <a href={`/${username}`} target="_blank" rel="noopener noreferrer" className="text-sm text-gray-500 hover:text-black truncate flex items-center gap-1">
                            {url} <ExternalLink size={12} />
                        </a>
                    </div>
                </div>
                <button
                    onClick={handleCopy}
                    className="shrink-0 flex items-center gap-1.5 bg-gray-100 hover:bg-gray-200 text-black text-sm font-semibold px-4 py-2 rounded-full transition-colors"
                >
                    {copied ? (
                        <>
                            <Check size={14} /> Copied
                        </>
                    ) : (
                        <>
                            <Copy size={14} /> Copy link
                        </>
                    )}
                </button>
            </div>

            {showQuickActions && (
                <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-100">
                    <Link
                        href="/dashboard/links?add=1"
                        className="flex items-center gap-1.5 bg-black text-white text-sm font-semibold px-4 py-2 rounded-full hover:bg-gray-800 transition-colors"
                    >
                        <Plus size={15} /> Add
                    </Link>
                    <Link
                        href="/dashboard/links?tab=shop"
                        className="flex items-center gap-1.5 bg-gray-100 text-black text-sm font-semibold px-4 py-2 rounded-full hover:bg-gray-200 transition-colors"
                    >
                        <ShoppingBag size={15} /> Products
                    </Link>
                    <Link
                        href="/dashboard/appearance"
                        className="flex items-center gap-1.5 bg-gray-100 text-black text-sm font-semibold px-4 py-2 rounded-full hover:bg-gray-200 transition-colors"
                    >
                        <Paintbrush size={15} /> Design
                    </Link>
                </div>
            )}
        </div>
    );
}
