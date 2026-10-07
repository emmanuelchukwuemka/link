import { useState, useEffect, useCallback } from 'react';
import { Link } from '@inertiajs/react';
import { ArrowLeft, Mail, Phone, CheckCircle2 } from 'lucide-react';
import AdminLayout from '@/layouts/admin-layout';
import { apiFetch } from '@/lib/api';

type ContactMsg = { id: number; name: string; email: string; phone: string | null; message: string; status: string; created_at: string };

const STATUS_COLORS: Record<string, string> = {
    new: 'bg-blue-100 text-blue-700',
    read: 'bg-gray-100 text-gray-600',
    responded: 'bg-green-100 text-green-700',
};

function AdminMessageDetailInner({ id }: { id: number }) {
    const [message, setMessage] = useState<ContactMsg | null>(null);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);

    const load = useCallback(async () => {
        const res = await fetch(`/api/admin/contact-messages/${id}`);
        if (res.ok) {
            const data = await res.json();
            setMessage(data.message);
        }
        setLoading(false);
    }, [id]);

    useEffect(() => {
        load();
    }, [load]);

    const markResponded = async () => {
        setUpdating(true);
        const { ok, data } = await apiFetch(`/api/admin/contact-messages/${id}`, { status: 'responded' }, 'PUT');
        if (ok) setMessage(data.message as ContactMsg);
        setUpdating(false);
    };

    if (loading) return <div className="text-center py-20 text-black">Loading...</div>;
    if (!message) return <div className="text-center py-20 text-black">Message not found.</div>;

    return (
        <div className="max-w-2xl space-y-5">
            <Link href="/admin/messages" className="text-sm font-semibold text-gray-500 hover:text-black flex items-center gap-1.5">
                <ArrowLeft size={14} /> Back to Messages
            </Link>

            <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <h1 className="text-xl font-bold text-black">{message.name}</h1>
                        <p className="text-sm text-gray-500">{new Date(message.created_at).toLocaleString()}</p>
                    </div>
                    <span className={`text-xs font-bold px-3 py-1.5 rounded-full shrink-0 uppercase tracking-wide ${STATUS_COLORS[message.status]}`}>{message.status}</span>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                    <a href={`mailto:${message.email}`} className="flex items-center gap-2 text-sm font-semibold text-black hover:underline">
                        <Mail size={15} /> {message.email}
                    </a>
                    {message.phone && (
                        <a href={`tel:${message.phone}`} className="flex items-center gap-2 text-sm font-semibold text-black hover:underline">
                            <Phone size={15} /> {message.phone}
                        </a>
                    )}
                </div>

                <div className="bg-gray-50 rounded-2xl p-5">
                    <p className="text-sm text-black leading-relaxed whitespace-pre-wrap">{message.message}</p>
                </div>

                <div className="flex gap-3">
                    <a href={`mailto:${message.email}`} className="flex-1 text-center py-3 rounded-full font-semibold text-sm bg-black text-white hover:bg-gray-800">
                        Reply by Email
                    </a>
                    {message.status !== 'responded' && (
                        <button onClick={markResponded} disabled={updating} className="flex items-center justify-center gap-1.5 px-5 py-3 rounded-full font-semibold text-sm bg-green-50 text-green-700 hover:bg-green-100 disabled:opacity-60 whitespace-nowrap">
                            <CheckCircle2 size={15} /> Mark Responded
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

export default function AdminMessageDetailPage({ id }: { id: number }) {
    return (
        <AdminLayout>
            <AdminMessageDetailInner id={id} />
        </AdminLayout>
    );
}
