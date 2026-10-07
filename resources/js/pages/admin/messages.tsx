import { useState, useEffect } from 'react';
import { Link } from '@inertiajs/react';
import { Mail } from 'lucide-react';
import AdminLayout from '@/layouts/admin-layout';

type ContactMsg = { id: number; name: string; email: string; phone: string | null; message: string; status: string; created_at: string };

const STATUS_COLORS: Record<string, string> = {
    new: 'bg-blue-100 text-blue-700',
    read: 'bg-gray-100 text-gray-600',
    responded: 'bg-green-100 text-green-700',
};

function AdminMessagesInner() {
    const [messages, setMessages] = useState<ContactMsg[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/api/admin/contact-messages')
            .then((res) => res.json())
            .then((data) => {
                if (data.messages) setMessages(data.messages);
                setLoading(false);
            });
    }, []);

    if (loading) return <div className="text-center py-20 text-black">Loading...</div>;

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-black">Messages</h1>
                <p className="text-gray-600 text-sm mt-1">Contact form submissions from the website.</p>
            </div>

            {messages.length === 0 ? (
                <div className="bg-white rounded-3xl p-8 text-center text-black shadow-sm">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Mail size={32} className="text-gray-400" />
                    </div>
                    No messages yet.
                </div>
            ) : (
                <div className="bg-white rounded-3xl shadow-sm divide-y divide-gray-100">
                    {messages.map((m) => (
                        <Link key={m.id} href={`/admin/messages/${m.id}`} className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition-colors">
                            <div className="w-11 h-11 rounded-full bg-black flex items-center justify-center text-sm font-bold text-white shrink-0">{m.name.charAt(0).toUpperCase()}</div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                    <p className="font-semibold text-black truncate">{m.name}</p>
                                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full shrink-0 uppercase tracking-wide ${STATUS_COLORS[m.status]}`}>{m.status}</span>
                                </div>
                                <p className="text-sm text-gray-500 truncate">{m.message}</p>
                            </div>
                            <p className="text-xs text-gray-400 shrink-0 whitespace-nowrap">{new Date(m.created_at).toLocaleDateString()}</p>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}

export default function AdminMessagesPage() {
    return (
        <AdminLayout>
            <AdminMessagesInner />
        </AdminLayout>
    );
}
