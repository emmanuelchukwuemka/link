import { useState, useEffect } from 'react';
import { Link } from '@inertiajs/react';
import { Plus, Trash2, Briefcase, Crown } from 'lucide-react';
import DashboardLayout from '@/layouts/dashboard-layout';
import { ProductsServicesTabs } from '@/components/products-services-tabs';
import { apiFetch } from '@/lib/api';

type Service = {
    id: number;
    name: string;
    description: string | null;
    price: string | null;
    cta_type: string;
};

function ServicesInner() {
    const [services, setServices] = useState<Service[]>([]);
    const [loading, setLoading] = useState(true);
    const [isPro, setIsPro] = useState(false);
    const [error, setError] = useState('');

    const fetchServices = async () => {
        const res = await fetch('/api/services');
        const data = await res.json();
        if (data.services) setServices(data.services);
        setLoading(false);
    };

    useEffect(() => {
        fetchServices();
        fetch('/api/auth/me')
            .then((res) => res.json())
            .then((data) => {
                if (data.user) {
                    setIsPro(data.user.plan === 'pro' && (!data.user.plan_expires_at || new Date(data.user.plan_expires_at) > new Date()));
                }
            });
    }, []);

    const handleAdd = async () => {
        setError('');
        const { ok, data } = await apiFetch('/api/services', { name: '', description: '', price: '', ctaType: 'contact' });
        if (!ok) {
            setError((data.error as string) || 'Could not add service');
            return;
        }
        if (data.service) setServices([...services, data.service as Service]);
    };

    const handleUpdate = async (id: number, updates: Partial<Service>) => {
        const updated = { ...services.find((s) => s.id === id), ...updates } as Service;
        setServices(services.map((s) => (s.id === id ? updated : s)));
        await apiFetch(`/api/services/${id}`, { name: updated.name, description: updated.description, price: updated.price, ctaType: updated.cta_type }, 'PUT');
    };

    const handleDelete = async (id: number) => {
        setServices(services.filter((s) => s.id !== id));
        await apiFetch(`/api/services/${id}`, undefined, 'DELETE');
    };

    if (loading) return <div className="text-center py-20 text-black">Loading...</div>;

    return (
        <div className="max-w-2xl space-y-6">
            <ProductsServicesTabs />
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold">Services</h1>
                <button onClick={handleAdd} className="bg-[#000000] text-white px-4 py-2 rounded-full font-semibold flex items-center gap-2 hover:bg-[#000000]/90">
                    <Plus size={18} /> Add service
                </button>
            </div>

            {!isPro && (
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center justify-between gap-4">
                    <p className="text-sm text-amber-800 flex items-center gap-2">
                        <Crown size={16} /> Services are a Pro feature — visible on your public profile once you upgrade.
                    </p>
                    <Link href="/dashboard/subscription" className="text-sm font-semibold bg-amber-600 text-white px-4 py-2 rounded-full whitespace-nowrap hover:bg-amber-700">
                        Upgrade
                    </Link>
                </div>
            )}
            {error && <div className="bg-red-50 text-red-500 p-3 rounded-lg text-sm">{error}</div>}

            {services.length === 0 ? (
                <div className="bg-white rounded-3xl p-8 text-center text-black shadow-sm">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Briefcase size={32} className="text-gray-400" />
                    </div>
                    List what you offer &mdash; consulting, design work, bookings, anything visitors can request.
                </div>
            ) : (
                <div className="space-y-4">
                    {services.map((s) => (
                        <div key={s.id} className="bg-white rounded-2xl p-4 shadow-sm space-y-2">
                            <div className="flex gap-2">
                                <input
                                    value={s.name}
                                    onChange={(e) => handleUpdate(s.id, { name: e.target.value })}
                                    placeholder="Service name"
                                    className="flex-1 font-semibold outline-none bg-transparent"
                                />
                                <button onClick={() => handleDelete(s.id)} className="text-gray-400 hover:text-red-500">
                                    <Trash2 size={18} />
                                </button>
                            </div>
                            <textarea
                                value={s.description || ''}
                                onChange={(e) => handleUpdate(s.id, { description: e.target.value })}
                                placeholder="Description"
                                className="w-full text-sm text-gray-600 outline-none bg-gray-50 rounded-lg p-2"
                            />
                            <div className="flex gap-2">
                                <input
                                    value={s.price || ''}
                                    onChange={(e) => handleUpdate(s.id, { price: e.target.value })}
                                    placeholder="Price (optional)"
                                    className="flex-1 text-sm px-3 py-2 rounded-lg bg-gray-50 outline-none"
                                />
                                <select value={s.cta_type} onChange={(e) => handleUpdate(s.id, { cta_type: e.target.value })} className="text-sm px-3 py-2 rounded-lg bg-gray-50 outline-none">
                                    <option value="contact">Contact</option>
                                    <option value="quote">Request Quote</option>
                                    <option value="book">Book</option>
                                </select>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default function ServicesPage() {
    return (
        <DashboardLayout>
            <ServicesInner />
        </DashboardLayout>
    );
}
