import { useState, useEffect } from 'react';
import { Link, router } from '@inertiajs/react';
import DashboardLayout from '@/layouts/dashboard-layout';
import { apiFetch } from '@/lib/api';

function DeleteAccountModal({ onClose }: { onClose: () => void }) {
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [deleting, setDeleting] = useState(false);

    const handleDelete = async (e: React.FormEvent) => {
        e.preventDefault();
        setDeleting(true);
        setError('');
        const { ok, data } = await apiFetch('/api/profile/account', { password }, 'DELETE');
        if (!ok) {
            setError((data.error as string) || 'Could not delete your account.');
            setDeleting(false);
            return;
        }
        router.visit('/');
    };

    return (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-white rounded-3xl p-6 w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
                <h2 className="text-lg font-bold mb-1 text-red-600">Delete your account?</h2>
                <p className="text-sm text-black mb-4">This permanently deletes your profile(s), links, cards, orders and all other data. This cannot be undone.</p>
                <form onSubmit={handleDelete} className="space-y-3">
                    <div>
                        <label className="block text-xs font-semibold text-black mb-1">Confirm your password</label>
                        <input
                            autoFocus
                            required
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-3 py-2.5 rounded-lg bg-gray-100 outline-none text-sm text-black"
                        />
                    </div>
                    {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">{error}</div>}
                    <div className="flex gap-3 pt-2">
                        <button type="button" onClick={onClose} className="flex-1 bg-gray-100 text-black py-2.5 rounded-full font-semibold text-sm hover:bg-gray-200">
                            Cancel
                        </button>
                        <button type="submit" disabled={deleting} className="flex-1 bg-red-600 text-white py-2.5 rounded-full font-semibold text-sm hover:bg-red-700 disabled:opacity-60">
                            {deleting ? 'Deleting...' : 'Delete Account'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

function SettingsInner() {
    const [profile, setProfile] = useState({
        email: '',
        username: '',
        accountType: 'individual',
        plan: 'free',
        planExpiresAt: null as string | null,
        phone: '',
        whatsapp: '',
        website: '',
        address: '',
        businessHours: '',
        leadFormEnabled: false,
    });
    const [showDelete, setShowDelete] = useState(false);

    useEffect(() => {
        fetch('/api/auth/me')
            .then((res) => res.json())
            .then((data) => {
                if (data.user) {
                    setProfile({
                        email: data.user.email || '',
                        username: data.user.username || '',
                        accountType: data.user.account_type || 'individual',
                        plan: data.user.plan || 'free',
                        planExpiresAt: data.user.plan_expires_at || null,
                        phone: data.user.phone || '',
                        whatsapp: data.user.whatsapp || '',
                        website: data.user.website || '',
                        address: data.user.address || '',
                        businessHours: data.user.business_hours || '',
                        leadFormEnabled: !!data.user.lead_form_enabled,
                    });
                }
            });
    }, []);

    const handleUpdate = async (updates: Record<string, string | boolean>) => {
        setProfile({ ...profile, ...updates });
        try {
            await apiFetch('/api/profile', updates, 'PUT');
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div className="max-w-2xl space-y-8">
            <h1 className="text-2xl font-bold">My Account</h1>

            <div className="bg-white rounded-3xl p-6 shadow-sm space-y-6">
                <div>
                    <h2 className="text-xl font-bold mb-1">Account Information</h2>
                    <p className="text-black text-sm mb-4">View and update your personal details.</p>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Username</label>
                        <input type="text" value={profile.username} disabled className="w-full px-4 py-3 rounded-lg bg-gray-100 border-transparent text-black cursor-not-allowed outline-none" />
                        <p className="text-xs text-black mt-1">Username cannot be changed currently.</p>
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Email</label>
                        <input type="email" value={profile.email} disabled className="w-full px-4 py-3 rounded-lg bg-gray-100 border-transparent text-black cursor-not-allowed outline-none" />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Account Type</label>
                        <input
                            type="text"
                            value={profile.accountType.replace('_', ' ')}
                            disabled
                            className="w-full px-4 py-3 rounded-lg bg-gray-100 border-transparent text-black cursor-not-allowed outline-none capitalize"
                        />
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-3xl p-6 shadow-sm space-y-4">
                <h2 className="text-xl font-bold mb-1">Contact Details</h2>
                <p className="text-black text-sm mb-2">Shown on your public profile&apos;s contact actions.</p>
                <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Phone</label>
                        <input
                            type="tel"
                            value={profile.phone}
                            onChange={(e) => handleUpdate({ phone: e.target.value })}
                            className="w-full px-4 py-3 rounded-lg bg-gray-100 border-transparent focus:bg-white focus:border-[#000000] focus:ring-2 focus:ring-[#000000]/20 outline-none transition-all"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">WhatsApp</label>
                        <input
                            type="tel"
                            value={profile.whatsapp}
                            onChange={(e) => handleUpdate({ whatsapp: e.target.value })}
                            className="w-full px-4 py-3 rounded-lg bg-gray-100 border-transparent focus:bg-white focus:border-[#000000] focus:ring-2 focus:ring-[#000000]/20 outline-none transition-all"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Website</label>
                        <input
                            type="url"
                            value={profile.website}
                            onChange={(e) => handleUpdate({ website: e.target.value })}
                            className="w-full px-4 py-3 rounded-lg bg-gray-100 border-transparent focus:bg-white focus:border-[#000000] focus:ring-2 focus:ring-[#000000]/20 outline-none transition-all"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Address</label>
                        <input
                            type="text"
                            value={profile.address}
                            onChange={(e) => handleUpdate({ address: e.target.value })}
                            className="w-full px-4 py-3 rounded-lg bg-gray-100 border-transparent focus:bg-white focus:border-[#000000] focus:ring-2 focus:ring-[#000000]/20 outline-none transition-all"
                        />
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-3xl p-6 shadow-sm space-y-4">
                <h2 className="text-xl font-bold mb-1">Mini Website</h2>
                <p className="text-black text-sm mb-2">Extra sections shown on your public profile.</p>
                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Business Hours</label>
                    <textarea
                        value={profile.businessHours}
                        onChange={(e) => handleUpdate({ businessHours: e.target.value })}
                        placeholder={'Monday–Friday\n8:00 AM–6:00 PM'}
                        className="w-full px-4 py-3 rounded-lg bg-gray-100 border-transparent focus:bg-white focus:border-[#000000] focus:ring-2 focus:ring-[#000000]/20 outline-none transition-all min-h-[80px]"
                    />
                </div>
                <div className="flex items-center justify-between bg-gray-50 rounded-lg px-4 py-3">
                    <div>
                        <p className="font-semibold text-sm">Lead capture form</p>
                        <p className="text-xs text-black">Let visitors send you their name, phone and a message.</p>
                    </div>
                    <button
                        onClick={() => handleUpdate({ leadFormEnabled: !profile.leadFormEnabled })}
                        className={`w-12 h-6 rounded-full relative transition-colors ${profile.leadFormEnabled ? 'bg-green-500' : 'bg-gray-300'}`}
                    >
                        <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-all ${profile.leadFormEnabled ? 'left-[26px]' : 'left-0.5'}`} />
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-3xl p-6 shadow-sm flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-bold mb-1 capitalize">{profile.plan} plan</h2>
                    <p className="text-black text-sm">
                        {profile.plan === 'pro' && profile.planExpiresAt ? `Renews/expires ${new Date(profile.planExpiresAt).toLocaleDateString()}` : 'Upgrade to unlock advanced customization, analytics and commerce features.'}
                    </p>
                </div>
                <Link href="/dashboard/subscription" className="bg-black text-white px-5 py-2.5 rounded-full font-semibold hover:bg-gray-800 whitespace-nowrap">
                    Manage plan
                </Link>
            </div>

            <div className="bg-white rounded-3xl p-6 shadow-sm border border-red-100">
                <h2 className="text-xl font-bold text-red-600 mb-1">Danger Zone</h2>
                <p className="text-black text-sm mb-4">Permanently delete your account and all data.</p>

                <button onClick={() => setShowDelete(true)} className="bg-red-50 text-red-600 px-6 py-3 rounded-lg font-semibold hover:bg-red-100 transition-colors">
                    Delete Account
                </button>
            </div>

            {showDelete && <DeleteAccountModal onClose={() => setShowDelete(false)} />}
        </div>
    );
}

export default function SettingsPage() {
    return (
        <DashboardLayout>
            <SettingsInner />
        </DashboardLayout>
    );
}
