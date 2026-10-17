import { useState, useEffect } from 'react';
import { router } from '@inertiajs/react';
import { Gift, Loader2 } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { ImageWithFallback } from '@/components/image-with-fallback';

type IncomingTransfer = {
    id: number;
    profile: { id: number; username: string; name: string | null; avatarUrl: string | null };
    fromUsername: string | null;
    createdAt: string;
};

export function IncomingTransfers() {
    const [transfers, setTransfers] = useState<IncomingTransfer[]>([]);
    const [busyId, setBusyId] = useState<number | null>(null);

    const load = () => {
        fetch('/api/profile-transfers/incoming')
            .then((res) => res.json())
            .then((data) => setTransfers(data.transfers || []))
            .catch(() => {});
    };

    useEffect(() => {
        load();
    }, []);

    const respond = async (id: number, action: 'accept' | 'decline') => {
        setBusyId(id);
        const { ok } = await apiFetch(`/api/profile-transfers/${id}/${action}`, {}, 'POST');
        setBusyId(null);
        if (ok) {
            if (action === 'accept') {
                router.reload();
            } else {
                setTransfers((prev) => prev.filter((t) => t.id !== id));
            }
        }
    };

    if (transfers.length === 0) return null;

    return (
        <div className="space-y-3">
            {transfers.map((t) => (
                <div key={t.id} className="bg-amber-50 border border-amber-200 rounded-3xl p-5 flex flex-wrap items-center gap-4">
                    <div className="w-11 h-11 rounded-full bg-black overflow-hidden flex items-center justify-center text-sm font-bold text-white shrink-0">
                        <ImageWithFallback src={t.profile.avatarUrl} alt="" className="w-full h-full object-cover" fallback={(t.profile.name || t.profile.username).charAt(0).toUpperCase()} />
                    </div>
                    <div className="flex-1 min-w-[200px]">
                        <p className="font-semibold text-black flex items-center gap-1.5">
                            <Gift size={15} className="text-amber-600" /> @{t.fromUsername} wants to transfer a profile to you
                        </p>
                        <p className="text-sm text-gray-700">
                            @{t.profile.username} {t.profile.name ? `("${t.profile.name}")` : ''} — accepting makes it yours, with all its links, appearance and history.
                        </p>
                    </div>
                    <div className="flex gap-2 shrink-0">
                        <button
                            onClick={() => respond(t.id, 'decline')}
                            disabled={busyId === t.id}
                            className="bg-white border border-gray-200 text-black px-4 py-2 rounded-full font-semibold text-sm hover:bg-gray-50 disabled:opacity-60"
                        >
                            Decline
                        </button>
                        <button
                            onClick={() => respond(t.id, 'accept')}
                            disabled={busyId === t.id}
                            className="bg-black text-white px-4 py-2 rounded-full font-semibold text-sm hover:bg-gray-800 disabled:opacity-60 flex items-center gap-1.5"
                        >
                            {busyId === t.id ? <Loader2 size={14} className="animate-spin" /> : 'Accept'}
                        </button>
                    </div>
                </div>
            ))}
        </div>
    );
}
