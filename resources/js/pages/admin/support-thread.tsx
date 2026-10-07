import { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from '@inertiajs/react';
import { ArrowLeft, Send } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import AdminLayout from '@/layouts/admin-layout';

type Message = { id: number; sender: string; body: string; created_at: string };
type SupportUser = { id: number; username: string; displayName: string | null; avatarUrl: string | null; accountType: string };

function AdminSupportThreadInner({ userId }: { userId: string }) {
    const [user, setUser] = useState<SupportUser | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [loading, setLoading] = useState(true);
    const [input, setInput] = useState('');
    const [sending, setSending] = useState(false);
    const [error, setError] = useState('');
    const listRef = useRef<HTMLDivElement>(null);

    const load = useCallback(async () => {
        const res = await fetch(`/api/admin/support/${userId}`);
        if (!res.ok) {
            setLoading(false);
            return;
        }
        const data = await res.json();
        setUser(data.user);
        setMessages(data.messages || []);
        setLoading(false);
        apiFetch(`/api/admin/support/${userId}/read`);
    }, [userId]);

    useEffect(() => {
        load();
    }, [load]);

    useEffect(() => {
        listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
    }, [messages]);

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        const body = input.trim();
        if (!body || sending) return;
        setSending(true);
        setError('');
        const { ok, data } = await apiFetch(`/api/admin/support/${userId}`, { body });
        if (ok) {
            setMessages((prev) => [...prev, data.message as Message]);
            setInput('');
        } else {
            setError((data.error as string) || 'Could not send message');
        }
        setSending(false);
    };

    if (loading) return <div className="text-center py-20 text-black">Loading...</div>;
    if (!user) return <div className="text-center py-20 text-black">User not found.</div>;

    return (
        <div className="max-w-2xl space-y-4">
            <Link href="/admin/support" className="text-sm font-semibold text-gray-500 hover:text-black flex items-center gap-1.5">
                <ArrowLeft size={14} /> Back to Support
            </Link>

            <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-full bg-black overflow-hidden flex items-center justify-center text-sm font-bold text-white shrink-0">
                    {user.avatarUrl ? <img src={user.avatarUrl} alt="" className="w-full h-full object-cover" /> : (user.displayName || user.username).charAt(0).toUpperCase()}
                </div>
                <div>
                    <p className="font-bold text-black">{user.displayName || user.username}</p>
                    <p className="text-xs text-gray-500">
                        @{user.username} &middot; {user.accountType.replace('_', ' ')}
                    </p>
                </div>
            </div>

            <div className="bg-white rounded-3xl shadow-sm flex flex-col h-[32rem] overflow-hidden">
                <div ref={listRef} className="flex-1 overflow-y-auto p-5 space-y-3 bg-gray-50">
                    {messages.length === 0 ? (
                        <p className="text-sm text-gray-400 text-center pt-8">No messages yet.</p>
                    ) : (
                        messages.map((m) => (
                            <div key={m.id} className={`flex ${m.sender === 'admin' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm ${m.sender === 'admin' ? 'bg-black text-white' : 'bg-white border border-gray-200 text-black'}`}>{m.body}</div>
                            </div>
                        ))
                    )}
                </div>

                {error && <div className="bg-red-50 text-red-500 p-3 text-sm text-center">{error}</div>}

                <form onSubmit={handleSend} className="flex items-center gap-2 p-4 border-t border-gray-100 shrink-0">
                    <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Reply..." className="flex-1 px-4 py-2.5 rounded-full bg-gray-100 outline-none text-sm text-black" />
                    <button type="submit" disabled={sending || !input.trim()} aria-label="Send" className="w-10 h-10 shrink-0 rounded-full bg-green-600 text-white flex items-center justify-center hover:bg-green-700 disabled:opacity-50">
                        <Send size={16} />
                    </button>
                </form>
            </div>
        </div>
    );
}

export default function AdminSupportThreadPage({ userId }: { userId: string }) {
    return (
        <AdminLayout>
            <AdminSupportThreadInner userId={userId} />
        </AdminLayout>
    );
}
