import { useState, useEffect, useRef } from 'react';
import { router } from '@inertiajs/react';
import { ChevronDown, Plus, Check, Loader2 } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { ImageWithFallback } from '@/components/image-with-fallback';

type ProfileSummary = {
    id: number;
    username: string;
    name: string | null;
    avatarUrl: string | null;
    plan: string;
    active: boolean;
};

export function ProfileSwitcher() {
    const [profiles, setProfiles] = useState<ProfileSummary[]>([]);
    const [open, setOpen] = useState(false);
    const [creating, setCreating] = useState(false);
    const [newUsername, setNewUsername] = useState('');
    const [newName, setNewName] = useState('');
    const [error, setError] = useState('');
    const [busy, setBusy] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    const load = () => {
        fetch('/api/profiles')
            .then((res) => res.json())
            .then((data) => setProfiles(data.profiles || []))
            .catch(() => {});
    };

    useEffect(() => {
        load();
    }, []);

    useEffect(() => {
        const onClickOutside = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                setOpen(false);
            }
        };
        document.addEventListener('mousedown', onClickOutside);
        return () => document.removeEventListener('mousedown', onClickOutside);
    }, []);

    const active = profiles.find((p) => p.active);

    const switchTo = async (id: number) => {
        if (busy) return;
        setBusy(true);
        const { ok } = await apiFetch('/api/profiles/switch', { profileId: id }, 'POST');
        setBusy(false);
        if (ok) {
            router.reload();
        }
    };

    const createProfile = async () => {
        setError('');
        if (!newUsername.trim() || !newName.trim()) {
            setError('Username and name are required.');
            return;
        }
        setBusy(true);
        const { ok, data } = await apiFetch('/api/profiles', { username: newUsername.trim(), name: newName.trim() }, 'POST');
        setBusy(false);
        if (!ok) {
            setError((data.error as string) || 'Could not create profile.');
            return;
        }
        setCreating(false);
        setNewUsername('');
        setNewName('');
        router.reload();
    };

    if (profiles.length === 0) return null;

    return (
        <div className="relative" ref={ref}>
            <button
                onClick={() => setOpen(!open)}
                className="flex items-center gap-2 pl-1.5 pr-3 py-1.5 rounded-full border border-gray-200 hover:border-gray-300 bg-white text-sm font-medium text-black"
            >
                <div className="w-6 h-6 rounded-full bg-black overflow-hidden flex items-center justify-center text-[10px] font-bold text-white shrink-0">
                    <ImageWithFallback src={active?.avatarUrl} alt="" className="w-full h-full object-cover" fallback={(active?.name || active?.username || 'P').charAt(0).toUpperCase()} />
                </div>
                <span className="hidden md:inline max-w-[120px] truncate">{active?.name || active?.username}</span>
                <ChevronDown size={14} className="text-gray-400" />
            </button>

            {open && (
                <div className="absolute left-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-gray-100 py-1 z-50">
                    <p className="px-3 pt-2 pb-1 text-[11px] font-semibold uppercase tracking-wide text-gray-400">Your profiles</p>
                    {profiles.map((p) => (
                        <button
                            key={p.id}
                            onClick={() => switchTo(p.id)}
                            disabled={busy}
                            className="w-full flex items-center gap-2.5 px-3 py-2 text-sm hover:bg-gray-50 text-left disabled:opacity-60"
                        >
                            <div className="w-7 h-7 rounded-full bg-black overflow-hidden flex items-center justify-center text-[10px] font-bold text-white shrink-0">
                                <ImageWithFallback src={p.avatarUrl} alt="" className="w-full h-full object-cover" fallback={(p.name || p.username).charAt(0).toUpperCase()} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="font-medium truncate text-black">{p.name || p.username}</p>
                                <p className="text-xs text-gray-500 truncate">@{p.username}</p>
                            </div>
                            {p.active && <Check size={16} className="text-black shrink-0" />}
                        </button>
                    ))}

                    <div className="border-t border-gray-100 mt-1 pt-1">
                        <button
                            onClick={() => {
                                setOpen(false);
                                setCreating(true);
                            }}
                            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-black hover:bg-gray-50 font-medium"
                        >
                            <Plus size={15} /> Create new profile
                        </button>
                    </div>
                </div>
            )}

            {creating && (
                <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => { setCreating(false); setError(''); }}>
                    <div className="bg-white rounded-3xl p-6 w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
                        <h2 className="text-lg font-bold mb-4 text-black">Create a new profile</h2>
                        <div className="space-y-3">
                            <div>
                                <label className="block text-xs font-semibold text-black mb-1">Display name</label>
                                <input
                                    autoFocus
                                    value={newName}
                                    onChange={(e) => setNewName(e.target.value)}
                                    placeholder="e.g. My Business"
                                    className="w-full px-3 py-2.5 rounded-lg bg-gray-100 outline-none text-sm text-black"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-black mb-1">Username</label>
                                <input
                                    value={newUsername}
                                    onChange={(e) => setNewUsername(e.target.value.toLowerCase())}
                                    placeholder="username"
                                    className="w-full px-3 py-2.5 rounded-lg bg-gray-100 outline-none text-sm text-black"
                                />
                            </div>
                            {error && <div className="bg-red-50 text-red-500 p-3 rounded-lg text-sm">{error}</div>}
                            <div className="flex gap-3 pt-2">
                                <button
                                    onClick={() => { setCreating(false); setError(''); }}
                                    className="flex-1 bg-gray-100 text-black py-2.5 rounded-full font-semibold text-sm hover:bg-gray-200"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={createProfile}
                                    disabled={busy}
                                    className="flex-1 flex items-center justify-center gap-1.5 bg-black text-white py-2.5 rounded-full font-semibold text-sm hover:bg-gray-800 disabled:opacity-60"
                                >
                                    {busy ? <Loader2 size={14} className="animate-spin" /> : 'Create'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
