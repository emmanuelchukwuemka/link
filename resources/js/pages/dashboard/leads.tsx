import { useState, useEffect } from 'react';
import { MessageSquareText, Phone, Mail } from 'lucide-react';
import DashboardLayout from '@/layouts/dashboard-layout';
import { apiFetch } from '@/lib/api';

type LeadData = {
    id: number;
    name: string;
    phone: string | null;
    email: string | null;
    message: string | null;
    status: string;
    created_at: string;
};

const STATUSES = ['new', 'contacted', 'interested', 'converted', 'lost'];
const STATUS_COLORS: Record<string, string> = {
    new: 'bg-blue-100 text-blue-700',
    contacted: 'bg-amber-100 text-amber-700',
    interested: 'bg-purple-100 text-purple-700',
    converted: 'bg-green-100 text-green-700',
    lost: 'bg-gray-100 text-gray-700',
};

function LeadsInner() {
    const [leads, setLeads] = useState<LeadData[]>([]);
    const [loading, setLoading] = useState(true);

    const load = async () => {
        const res = await fetch('/api/leads');
        const data = await res.json();
        if (data.leads) setLeads(data.leads);
        setLoading(false);
    };

    useEffect(() => {
        load();
    }, []);

    const updateStatus = async (id: number, status: string) => {
        setLeads(leads.map((l) => (l.id === id ? { ...l, status } : l)));
        await apiFetch(`/api/leads/${id}`, { status }, 'PATCH');
    };

    if (loading) return <div className="text-center py-20 text-black">Loading...</div>;

    return (
        <div className="max-w-3xl space-y-6">
            <h1 className="text-2xl font-bold">Leads</h1>

            {leads.length === 0 ? (
                <div className="bg-white rounded-3xl p-8 text-center text-black shadow-sm">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <MessageSquareText size={32} className="text-gray-400" />
                    </div>
                    No leads yet. Turn on the lead capture form in Settings to start collecting enquiries.
                </div>
            ) : (
                <div className="space-y-4">
                    {leads.map((lead) => (
                        <div key={lead.id} className="bg-white rounded-2xl p-4 shadow-sm">
                            <div className="flex items-start justify-between gap-4">
                                <div>
                                    <p className="font-semibold">{lead.name}</p>
                                    <div className="flex gap-3 text-xs text-black mt-1">
                                        {lead.phone && (
                                            <span className="flex items-center gap-1">
                                                <Phone size={12} /> {lead.phone}
                                            </span>
                                        )}
                                        {lead.email && (
                                            <span className="flex items-center gap-1">
                                                <Mail size={12} /> {lead.email}
                                            </span>
                                        )}
                                    </div>
                                    {lead.message && <p className="text-sm text-gray-600 mt-2">{lead.message}</p>}
                                    <p className="text-xs text-black mt-2">{new Date(lead.created_at).toLocaleString()}</p>
                                </div>
                                <select
                                    value={lead.status}
                                    onChange={(e) => updateStatus(lead.id, e.target.value)}
                                    className={`text-xs font-semibold px-3 py-1.5 rounded-full outline-none capitalize ${STATUS_COLORS[lead.status]}`}
                                >
                                    {STATUSES.map((s) => (
                                        <option key={s} value={s}>
                                            {s}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default function LeadsPage() {
    return (
        <DashboardLayout>
            <LeadsInner />
        </DashboardLayout>
    );
}
