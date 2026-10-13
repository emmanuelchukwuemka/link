import { useState, useEffect } from 'react';
import { UserCog, Ban, CheckCircle2, Plus } from 'lucide-react';
import AdminLayout from '@/layouts/admin-layout';
import { apiFetch } from '@/lib/api';

type StaffRow = {
    id: number;
    username: string | null;
    displayName: string | null;
    email: string;
    permissions: string[];
    isActive: boolean;
    createdAt: string;
};

// Mirrors App\Support\StaffPermissions — update both together if a new
// grantable section is added.
const PERMISSIONS: { key: string; label: string }[] = [
    { key: 'manage_profiles', label: 'Set up & manage user profiles' },
    { key: 'process_orders', label: 'View & process orders' },
];

function AddStaffModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
    const [values, setValues] = useState<Record<string, string>>({});
    const [permissions, setPermissions] = useState<string[]>([]);
    const [error, setError] = useState('');
    const [saving, setSaving] = useState(false);

    const togglePermission = (key: string) => {
        setPermissions((prev) => (prev.includes(key) ? prev.filter((p) => p !== key) : [...prev, key]));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setError('');
        const { ok, data } = await apiFetch('/api/admin/staff', { ...values, permissions });
        if (!ok) {
            setError((data.error as string) || 'Failed to create staff account');
            setSaving(false);
            return;
        }
        onCreated();
    };

    return (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-white rounded-3xl p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
                <h2 className="text-lg font-bold mb-4 text-black">Add Staff</h2>
                {error && <div className="bg-red-50 text-red-500 p-3 rounded-lg mb-4 text-sm">{error}</div>}
                <form onSubmit={handleSubmit} className="space-y-3">
                    <div>
                        <label className="block text-xs font-semibold text-black mb-1">Full Name</label>
                        <input required value={values.displayName || ''} onChange={(e) => setValues({ ...values, displayName: e.target.value })} className="w-full px-3 py-2.5 rounded-lg bg-gray-100 outline-none text-sm text-black" />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-black mb-1">Username</label>
                        <input required value={values.username || ''} onChange={(e) => setValues({ ...values, username: e.target.value })} className="w-full px-3 py-2.5 rounded-lg bg-gray-100 outline-none text-sm text-black" />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-black mb-1">Email</label>
                        <input required type="email" value={values.email || ''} onChange={(e) => setValues({ ...values, email: e.target.value })} className="w-full px-3 py-2.5 rounded-lg bg-gray-100 outline-none text-sm text-black" />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-black mb-1">Temporary Password</label>
                        <input required type="password" value={values.password || ''} onChange={(e) => setValues({ ...values, password: e.target.value })} className="w-full px-3 py-2.5 rounded-lg bg-gray-100 outline-none text-sm text-black" />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-black mb-2">Access</label>
                        <div className="space-y-2">
                            {PERMISSIONS.map((p) => (
                                <label key={p.key} className="flex items-center gap-2 text-sm text-black cursor-pointer">
                                    <input type="checkbox" checked={permissions.includes(p.key)} onChange={() => togglePermission(p.key)} className="rounded" />
                                    {p.label}
                                </label>
                            ))}
                        </div>
                    </div>
                    <div className="flex gap-3 pt-2">
                        <button type="button" onClick={onClose} className="flex-1 bg-gray-100 text-black py-2.5 rounded-full font-semibold text-sm hover:bg-gray-200">
                            Cancel
                        </button>
                        <button type="submit" disabled={saving} className="flex-1 bg-black text-white py-2.5 rounded-full font-semibold text-sm hover:bg-gray-800 disabled:opacity-60">
                            {saving ? 'Saving...' : 'Create'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

function AdminStaffInner() {
    const [staff, setStaff] = useState<StaffRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [busyId, setBusyId] = useState<number | null>(null);
    const [showAdd, setShowAdd] = useState(false);

    const load = () => {
        setLoading(true);
        fetch('/api/admin/staff')
            .then((res) => res.json())
            .then((data) => {
                if (data.staff) setStaff(data.staff);
                setLoading(false);
            });
    };

    useEffect(() => {
        load();
    }, []);

    const toggleActive = async (s: StaffRow) => {
        setBusyId(s.id);
        try {
            await apiFetch(`/api/admin/staff/${s.id}`, { isActive: !s.isActive }, 'PATCH');
            setStaff(staff.map((x) => (x.id === s.id ? { ...x, isActive: !x.isActive } : x)));
        } finally {
            setBusyId(null);
        }
    };

    const togglePermission = async (s: StaffRow, key: string) => {
        const next = s.permissions.includes(key) ? s.permissions.filter((p) => p !== key) : [...s.permissions, key];
        setBusyId(s.id);
        try {
            await apiFetch(`/api/admin/staff/${s.id}`, { permissions: next }, 'PATCH');
            setStaff(staff.map((x) => (x.id === s.id ? { ...x, permissions: next } : x)));
        } finally {
            setBusyId(null);
        }
    };

    if (loading) return <div className="text-center py-20 text-black">Loading...</div>;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between gap-3">
                <h1 className="text-2xl font-bold flex items-center gap-2">
                    <UserCog size={24} /> Staff ({staff.length})
                </h1>
                <button onClick={() => setShowAdd(true)} className="flex items-center gap-1.5 bg-black text-white text-sm font-semibold px-4 py-2.5 rounded-full hover:bg-gray-800">
                    <Plus size={15} /> Add Staff
                </button>
            </div>

            <p className="text-sm text-gray-600 max-w-2xl">Staff accounts log in like any other user but see a cut-down admin panel — only the sections you grant them below. Toggle access any time.</p>

            <div className="bg-white rounded-2xl shadow-sm overflow-x-auto">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="text-left text-black border-b border-gray-100">
                            <th className="p-4 font-semibold">Staff</th>
                            <th className="p-4 font-semibold">Access</th>
                            <th className="p-4 font-semibold">Status</th>
                            <th className="p-4 font-semibold"></th>
                        </tr>
                    </thead>
                    <tbody>
                        {staff.map((s) => (
                            <tr key={s.id} className="border-b border-gray-50 last:border-0">
                                <td className="p-4">
                                    <p className="font-medium">{s.displayName || s.username}</p>
                                    <p className="text-xs text-black">
                                        @{s.username} &middot; {s.email}
                                    </p>
                                </td>
                                <td className="p-4">
                                    <div className="flex flex-col gap-1.5">
                                        {PERMISSIONS.map((p) => (
                                            <label key={p.key} className="flex items-center gap-2 text-xs text-black cursor-pointer">
                                                <input type="checkbox" checked={s.permissions.includes(p.key)} disabled={busyId === s.id} onChange={() => togglePermission(s, p.key)} className="rounded" />
                                                {p.label}
                                            </label>
                                        ))}
                                    </div>
                                </td>
                                <td className="p-4">
                                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${s.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>{s.isActive ? 'Active' : 'Suspended'}</span>
                                </td>
                                <td className="p-4">
                                    <button
                                        onClick={() => toggleActive(s)}
                                        disabled={busyId === s.id}
                                        className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full whitespace-nowrap disabled:opacity-50 ${s.isActive ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-green-50 text-green-700 hover:bg-green-100'}`}
                                    >
                                        {s.isActive ? (
                                            <>
                                                <Ban size={13} /> Suspend
                                            </>
                                        ) : (
                                            <>
                                                <CheckCircle2 size={13} /> Reactivate
                                            </>
                                        )}
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {staff.length === 0 && <p className="text-black text-center py-10">No staff accounts yet.</p>}
            </div>

            {showAdd && (
                <AddStaffModal
                    onClose={() => setShowAdd(false)}
                    onCreated={() => {
                        setShowAdd(false);
                        load();
                    }}
                />
            )}
        </div>
    );
}

export default function AdminStaffPage() {
    return (
        <AdminLayout>
            <AdminStaffInner />
        </AdminLayout>
    );
}
