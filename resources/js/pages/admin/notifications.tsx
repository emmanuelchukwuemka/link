import { useState, useEffect, useRef } from 'react';
import { Send, Megaphone, Users, ChevronDown, Search } from 'lucide-react';
import AdminLayout from '@/layouts/admin-layout';
import { apiFetch } from '@/lib/api';

type PickerUser = { id: number; username: string | null; email: string; displayName: string | null };

function UserPicker({ username, onSelect }: { username: string; onSelect: (username: string) => void }) {
    const [open, setOpen] = useState(false);
    const [users, setUsers] = useState<PickerUser[] | null>(null);
    const [search, setSearch] = useState('');
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (open && users === null) {
            fetch('/api/admin/users')
                .then((r) => r.json())
                .then((d) => setUsers(d.users || []))
                .catch(() => setUsers([]));
        }
    }, [open, users]);

    useEffect(() => {
        if (!open) return;
        const onClickOutside = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
        };
        document.addEventListener('mousedown', onClickOutside);
        return () => document.removeEventListener('mousedown', onClickOutside);
    }, [open]);

    const filtered = (users || []).filter((u) => {
        if (!u.username) return false;
        const q = search.toLowerCase();
        return u.username.toLowerCase().includes(q) || (u.displayName || '').toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
    });

    return (
        <div className="relative" ref={ref}>
            <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                className="w-full flex items-center justify-between gap-2 px-4 py-3 rounded-lg bg-gray-100 text-left text-sm"
            >
                <span className={username ? 'text-black' : 'text-gray-500'}>{username ? `@${username}` : 'Choose a user...'}</span>
                <span className="flex items-center gap-1 text-gray-500 shrink-0">
                    <Users size={14} /> <ChevronDown size={14} />
                </span>
            </button>

            {open && (
                <div className="absolute z-20 mt-1 w-full bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden">
                    <div className="flex items-center gap-2 px-3 py-2 border-b border-gray-100">
                        <Search size={14} className="text-gray-400 shrink-0" />
                        <input
                            autoFocus
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search users..."
                            className="w-full outline-none text-sm"
                        />
                    </div>
                    <div className="max-h-64 overflow-y-auto">
                        {users === null && <p className="px-4 py-3 text-sm text-gray-500">Loading users...</p>}
                        {users !== null && filtered.length === 0 && <p className="px-4 py-3 text-sm text-gray-500">No users found.</p>}
                        {filtered.map((u) => (
                            <button
                                key={u.id}
                                type="button"
                                onClick={() => {
                                    onSelect(u.username as string);
                                    setOpen(false);
                                    setSearch('');
                                }}
                                className="w-full text-left px-4 py-2.5 hover:bg-gray-50 flex flex-col"
                            >
                                <span className="text-sm font-medium text-black">{u.displayName || u.username}</span>
                                <span className="text-xs text-gray-500">@{u.username} &middot; {u.email}</span>
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

function AdminNotificationsInner() {
    const [mode, setMode] = useState<'user' | 'broadcast'>('user');
    const [username, setUsername] = useState('');
    const [title, setTitle] = useState('');
    const [message, setMessage] = useState('');
    const [link, setLink] = useState('');
    const [sending, setSending] = useState(false);
    const [result, setResult] = useState('');
    const [error, setError] = useState('');

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (mode === 'user' && !username) {
            setError('Please choose a user.');
            return;
        }
        setSending(true);
        setError('');
        setResult('');
        try {
            const { ok, data } = await apiFetch('/api/admin/notifications/send', {
                broadcast: mode === 'broadcast',
                username: mode === 'user' ? username : undefined,
                title,
                message,
                link: link || undefined,
            });
            if (!ok) throw new Error((data.error as string) || 'Could not send');
            setResult(`Sent to ${data.sent} user(s).`);
            setTitle('');
            setMessage('');
            setLink('');
            setUsername('');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Something went wrong');
        } finally {
            setSending(false);
        }
    };

    return (
        <div className="max-w-xl space-y-6">
            <h1 className="text-2xl font-bold flex items-center gap-2">
                <Megaphone size={24} /> Send Notification
            </h1>

            <div className="grid grid-cols-2 gap-2 bg-gray-100 rounded-full p-1 w-fit">
                <button onClick={() => setMode('user')} className={`px-4 py-2 rounded-full font-semibold text-sm ${mode === 'user' ? 'bg-white shadow-sm text-black' : 'text-gray-500'}`}>
                    Specific user
                </button>
                <button onClick={() => setMode('broadcast')} className={`px-4 py-2 rounded-full font-semibold text-sm ${mode === 'broadcast' ? 'bg-white shadow-sm text-black' : 'text-gray-500'}`}>
                    Broadcast (all users)
                </button>
            </div>

            <form onSubmit={handleSend} className="bg-white rounded-3xl p-6 shadow-sm space-y-4">
                {error && <div className="bg-red-50 text-red-500 p-3 rounded-lg text-sm">{error}</div>}
                {result && <div className="bg-green-50 text-green-700 p-3 rounded-lg text-sm">{result}</div>}

                {mode === 'user' && <UserPicker username={username} onSelect={setUsername} />}
                {mode === 'broadcast' && <p className="text-sm text-amber-700 bg-amber-50 p-3 rounded-lg">This sends an in-app notification to every registered user. Use sparingly.</p>}

                <input required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title" className="w-full px-4 py-3 rounded-lg bg-gray-100 outline-none" />
                <textarea required value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Message" className="w-full px-4 py-3 rounded-lg bg-gray-100 outline-none min-h-[100px]" />
                <input value={link} onChange={(e) => setLink(e.target.value)} placeholder="Link (optional, e.g. /dashboard/subscription)" className="w-full px-4 py-3 rounded-lg bg-gray-100 outline-none" />

                <button type="submit" disabled={sending} className="bg-black text-white px-6 py-3 rounded-full font-semibold flex items-center gap-2 hover:bg-gray-800 disabled:opacity-60">
                    <Send size={16} /> {sending ? 'Sending...' : 'Send'}
                </button>
            </form>
        </div>
    );
}

export default function AdminNotificationsPage() {
    return (
        <AdminLayout>
            <AdminNotificationsInner />
        </AdminLayout>
    );
}
