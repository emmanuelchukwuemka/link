import { useState, useEffect } from 'react';
import { Building2, Plus, Trash2, CreditCard, Users2, Eye, Smartphone, QrCode, MessageSquareText, Phone, Mail, Crown } from 'lucide-react';
import DashboardLayout from '@/layouts/dashboard-layout';
import { ImageUploader } from '@/components/image-uploader';
import { ImageWithFallback } from '@/components/image-with-fallback';
import { apiFetch } from '@/lib/api';

type BusinessPlanName = 'free' | 'tier10' | 'tier25' | 'tier50' | 'tier100' | 'enterprise';

const BUSINESS_PLANS: Record<BusinessPlanName, { label: string; employeeLimit: number; priceNaira: number | null }> = {
    free: { label: 'Free', employeeLimit: 3, priceNaira: 0 },
    tier10: { label: 'Team 10', employeeLimit: 10, priceNaira: 50000 },
    tier25: { label: 'Team 25', employeeLimit: 25, priceNaira: 100000 },
    tier50: { label: 'Team 50', employeeLimit: 50, priceNaira: 180000 },
    tier100: { label: 'Team 100', employeeLimit: 100, priceNaira: 300000 },
    enterprise: { label: 'Enterprise', employeeLimit: Infinity, priceNaira: null },
};

type Business = {
    name: string;
    logo_url: string | null;
    description: string | null;
    website: string | null;
    phone: string | null;
    whatsapp: string | null;
    email: string | null;
    address: string | null;
    category: string | null;
    business_hours: string | null;
    plan: string;
    plan_expires_at: string | null;
};

type Employee = {
    id: number;
    username: string;
    email: string;
    displayName: string | null;
    jobTitle: string | null;
    department: string | null;
    cards: { id: number; code: string }[];
};

type CardRow = {
    id: number;
    code: string;
    status: string;
    user: { id: number; username: string; displayName: string | null } | null;
};

type EmployeeStats = {
    id: number;
    username: string;
    displayName: string | null;
    jobTitle: string | null;
    views: number;
    nfcTaps: number;
    qrScans: number;
    leads: number;
};

type BusinessLead = {
    id: number;
    name: string;
    phone: string | null;
    email: string | null;
    status: string;
    created_at: string;
    owner: { username: string; displayName: string | null } | null;
};

type BulkCreated = { displayName: string; username: string; email: string; tempPassword: string };
type BulkSkipped = { row: number; reason: string };
type BulkResult = { created: BulkCreated[]; skipped: BulkSkipped[] };

function BusinessInner() {
    const [business, setBusiness] = useState<Business | null>(null);
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [cards, setCards] = useState<CardRow[]>([]);
    const [stats, setStats] = useState<EmployeeStats[]>([]);
    const [leads, setLeads] = useState<BusinessLead[]>([]);
    const [newEmployee, setNewEmployee] = useState({ username: '', email: '', password: '', displayName: '', jobTitle: '', department: '' });
    const [empError, setEmpError] = useState('');
    const [loading, setLoading] = useState(true);
    const [upgrading, setUpgrading] = useState<string | null>(null);
    const [upgradeError, setUpgradeError] = useState('');
    const [bulkError, setBulkError] = useState('');
    const [bulkResult, setBulkResult] = useState<BulkResult | null>(null);

    const load = async () => {
        const [bRes, eRes, cRes, sRes, lRes] = await Promise.all([
            fetch('/api/business'),
            fetch('/api/business/employees'),
            fetch('/api/business/cards'),
            fetch('/api/business/analytics'),
            fetch('/api/business/leads'),
        ]);
        const bData = await bRes.json();
        const eData = await eRes.json();
        const cData = await cRes.json();
        const sData = await sRes.json();
        const lData = await lRes.json();
        if (bData.business) setBusiness(bData.business);
        if (eData.employees) setEmployees(eData.employees);
        if (cData.cards) setCards(cData.cards);
        if (sData.employees) setStats(sData.employees);
        if (lData.leads) setLeads(lData.leads);
        setLoading(false);
    };

    useEffect(() => {
        load();
    }, []);

    const updateBusiness = async (updates: Partial<Business> & { logoUrl?: string }) => {
        setBusiness(business ? { ...business, ...updates, logo_url: updates.logoUrl ?? business.logo_url } : null);
        await apiFetch('/api/business', updates, 'PUT');
    };

    const handleAddEmployee = async (e: React.FormEvent) => {
        e.preventDefault();
        setEmpError('');
        const { ok, data } = await apiFetch('/api/business/employees', newEmployee);
        if (!ok) {
            setEmpError((data.error as string) || 'Could not add employee');
            return;
        }
        setNewEmployee({ username: '', email: '', password: '', displayName: '', jobTitle: '', department: '' });
        load();
    };

    const handleBulkUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setBulkError('');
        setBulkResult(null);
        const csv = await file.text();
        const { ok, data } = await apiFetch('/api/business/employees/bulk', { csv });
        if (!ok) {
            setBulkError((data.error as string) || 'Upload failed');
        } else {
            setBulkResult(data as unknown as BulkResult);
            load();
        }
        e.target.value = '';
    };

    const handleRemoveEmployee = async (id: number) => {
        await apiFetch(`/api/business/employees/${id}`, undefined, 'DELETE');
        load();
    };

    const handleAssignCard = async (code: string, employeeId: string) => {
        await apiFetch(`/api/business/cards/${code}/assign`, { employeeId: employeeId || null }, 'PATCH');
        load();
    };

    const handleUpgradePlan = async (plan: BusinessPlanName) => {
        setUpgrading(plan);
        setUpgradeError('');
        const { data } = await apiFetch('/api/business/subscriptions/checkout', { plan });
        if (data.authorizationUrl) {
            window.location.href = data.authorizationUrl as string;
            return;
        }
        setUpgradeError((data.error as string) || 'Could not start checkout. Please try again.');
        setUpgrading(null);
    };

    if (loading) return <div className="text-center py-20 text-black">Loading...</div>;
    if (!business) return <div className="text-center py-20 text-black">No business found on this account.</div>;

    return (
        <div className="max-w-4xl space-y-10">
            <div className="flex items-center gap-3">
                <Building2 size={26} />
                <h1 className="text-2xl font-bold">Business</h1>
            </div>

            {/* Company profile */}
            <section className="bg-white rounded-3xl p-6 shadow-sm space-y-4">
                <h2 className="font-bold text-lg">Company Profile</h2>
                <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-xl bg-black overflow-hidden flex items-center justify-center font-bold text-white shrink-0">
                        <ImageWithFallback src={business.logo_url} alt="Logo" className="w-full h-full object-cover" fallback={business.name?.charAt(0) || 'B'} />
                    </div>
                    <ImageUploader
                        label="Upload logo"
                        onUploaded={(url) => updateBusiness({ logoUrl: url })}
                        className="bg-gray-100 text-gray-700 px-4 py-2 rounded-full font-semibold text-sm hover:bg-gray-200 flex items-center gap-2"
                    />
                </div>
                <div className="grid sm:grid-cols-2 gap-3">
                    <input value={business.name} onChange={(e) => updateBusiness({ name: e.target.value })} placeholder="Business name" className="px-4 py-3 rounded-lg bg-gray-100 outline-none" />
                    <input value={business.category || ''} onChange={(e) => updateBusiness({ category: e.target.value })} placeholder="Category" className="px-4 py-3 rounded-lg bg-gray-100 outline-none" />
                    <input value={business.website || ''} onChange={(e) => updateBusiness({ website: e.target.value })} placeholder="Website" className="px-4 py-3 rounded-lg bg-gray-100 outline-none" />
                    <input value={business.phone || ''} onChange={(e) => updateBusiness({ phone: e.target.value })} placeholder="Phone" className="px-4 py-3 rounded-lg bg-gray-100 outline-none" />
                    <input value={business.whatsapp || ''} onChange={(e) => updateBusiness({ whatsapp: e.target.value })} placeholder="WhatsApp" className="px-4 py-3 rounded-lg bg-gray-100 outline-none" />
                    <input value={business.email || ''} onChange={(e) => updateBusiness({ email: e.target.value })} placeholder="Contact email" className="px-4 py-3 rounded-lg bg-gray-100 outline-none" />
                    <input value={business.address || ''} onChange={(e) => updateBusiness({ address: e.target.value })} placeholder="Address" className="px-4 py-3 rounded-lg bg-gray-100 outline-none sm:col-span-2" />
                </div>
                <textarea value={business.description || ''} onChange={(e) => updateBusiness({ description: e.target.value })} placeholder="Description" className="w-full px-4 py-3 rounded-lg bg-gray-100 outline-none min-h-[80px]" />
            </section>

            {/* Plan & Billing */}
            <section className="bg-white rounded-3xl p-6 shadow-sm space-y-4">
                <h2 className="font-bold text-lg flex items-center gap-2">
                    <Crown size={18} className="text-amber-500" /> Plan &amp; Billing
                </h2>
                <p className="text-sm text-black">
                    Currently on <strong className="capitalize">{BUSINESS_PLANS[business.plan as BusinessPlanName]?.label || business.plan}</strong>{' '}
                    &middot; {employees.length} / {BUSINESS_PLANS[business.plan as BusinessPlanName]?.employeeLimit ?? '?'} team members used
                    {business.plan_expires_at && ` · renews ${new Date(business.plan_expires_at).toLocaleDateString()}`}
                </p>

                {upgradeError && <p className="text-sm text-red-600">{upgradeError}</p>}

                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    {(Object.keys(BUSINESS_PLANS) as BusinessPlanName[])
                        .filter((p) => p !== 'free')
                        .map((p) => {
                            const cfg = BUSINESS_PLANS[p];
                            const isCurrent = business.plan === p;
                            return (
                                <div key={p} className={`rounded-2xl p-4 border-2 ${isCurrent ? 'border-black' : 'border-gray-100'}`}>
                                    <p className="font-bold text-sm">{cfg.label}</p>
                                    <p className="text-xs text-black mb-2">Up to {cfg.employeeLimit === Infinity ? 'unlimited' : cfg.employeeLimit} employees</p>
                                    <p className="font-bold mb-3">{cfg.priceNaira === null ? 'Contact us' : `₦${cfg.priceNaira.toLocaleString()}/yr`}</p>
                                    {isCurrent ? (
                                        <span className="text-xs font-semibold text-green-600">Current plan</span>
                                    ) : cfg.priceNaira === null ? (
                                        <a href="mailto:sales@tapconnect.ng" className="text-xs font-semibold text-black underline">
                                            Contact sales
                                        </a>
                                    ) : (
                                        <button
                                            onClick={() => handleUpgradePlan(p)}
                                            disabled={upgrading === p}
                                            className="text-xs font-semibold bg-black text-white px-3 py-1.5 rounded-full hover:bg-gray-800 disabled:opacity-60"
                                        >
                                            {upgrading === p ? 'Loading...' : 'Upgrade'}
                                        </button>
                                    )}
                                </div>
                            );
                        })}
                </div>
            </section>

            {/* Team */}
            <section className="space-y-4">
                <h2 className="font-bold text-lg flex items-center gap-2">
                    <Users2 size={18} /> Team ({employees.length})
                </h2>

                <form onSubmit={handleAddEmployee} className="bg-white rounded-3xl p-6 shadow-sm space-y-3">
                    <p className="font-semibold text-sm">Add employee</p>
                    {empError && <div className="bg-red-50 text-red-500 p-2 rounded text-sm">{empError}</div>}
                    <div className="grid sm:grid-cols-2 gap-3">
                        <input required value={newEmployee.displayName} onChange={(e) => setNewEmployee({ ...newEmployee, displayName: e.target.value })} placeholder="Full name" className="px-3 py-2 rounded-lg bg-gray-100 outline-none text-sm" />
                        <input value={newEmployee.jobTitle} onChange={(e) => setNewEmployee({ ...newEmployee, jobTitle: e.target.value })} placeholder="Job title" className="px-3 py-2 rounded-lg bg-gray-100 outline-none text-sm" />
                        <input value={newEmployee.department} onChange={(e) => setNewEmployee({ ...newEmployee, department: e.target.value })} placeholder="Department (optional)" className="px-3 py-2 rounded-lg bg-gray-100 outline-none text-sm" />
                        <input required value={newEmployee.username} onChange={(e) => setNewEmployee({ ...newEmployee, username: e.target.value })} placeholder="Username" className="px-3 py-2 rounded-lg bg-gray-100 outline-none text-sm" />
                        <input required type="email" value={newEmployee.email} onChange={(e) => setNewEmployee({ ...newEmployee, email: e.target.value })} placeholder="Email" className="px-3 py-2 rounded-lg bg-gray-100 outline-none text-sm" />
                        <input required type="password" value={newEmployee.password} onChange={(e) => setNewEmployee({ ...newEmployee, password: e.target.value })} placeholder="Temporary password" className="px-3 py-2 rounded-lg bg-gray-100 outline-none text-sm sm:col-span-2" />
                    </div>
                    <button type="submit" className="bg-black text-white px-4 py-2 rounded-full font-semibold text-sm flex items-center gap-2 hover:bg-gray-800">
                        <Plus size={16} /> Add to team
                    </button>
                </form>

                <div className="bg-white rounded-3xl p-6 shadow-sm space-y-3">
                    <p className="font-semibold text-sm">Bulk upload (CSV)</p>
                    <p className="text-xs text-black">Columns: Full name, Email, Phone, Job title, Department, Profile photo (URL), Card ID (all optional except name/email). First row must be a header.</p>
                    {bulkError && <div className="bg-red-50 text-red-500 p-2 rounded text-sm">{bulkError}</div>}
                    <input type="file" accept=".csv,text/csv" onChange={handleBulkUpload} className="text-sm" />
                    {bulkResult && (
                        <div className="space-y-3 pt-2">
                            {bulkResult.created.length > 0 && (
                                <div>
                                    <p className="text-xs font-semibold text-green-700 mb-1">{bulkResult.created.length} account(s) created — share these temporary passwords:</p>
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-xs">
                                            <thead>
                                                <tr className="text-left text-black">
                                                    <th className="pr-3 py-1">Name</th>
                                                    <th className="pr-3 py-1">Username</th>
                                                    <th className="pr-3 py-1">Email</th>
                                                    <th className="pr-3 py-1">Temp Password</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {bulkResult.created.map((c) => (
                                                    <tr key={c.username} className="border-t border-gray-50">
                                                        <td className="pr-3 py-1">{c.displayName}</td>
                                                        <td className="pr-3 py-1 font-mono">@{c.username}</td>
                                                        <td className="pr-3 py-1">{c.email}</td>
                                                        <td className="pr-3 py-1 font-mono">{c.tempPassword}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                            {bulkResult.skipped.length > 0 && (
                                <div>
                                    <p className="text-xs font-semibold text-amber-700 mb-1">{bulkResult.skipped.length} row(s) skipped:</p>
                                    <ul className="text-xs text-black list-disc pl-4">
                                        {bulkResult.skipped.map((s, i) => (
                                            <li key={i}>
                                                Row {s.row}: {s.reason}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <div className="space-y-2">
                    {employees.map((emp) => (
                        <div key={emp.id} className="bg-white rounded-2xl p-4 shadow-sm flex items-center justify-between">
                            <div>
                                <p className="font-semibold text-sm">
                                    {emp.displayName} <span className="text-black font-normal">@{emp.username}</span>
                                </p>
                                <p className="text-xs text-black">
                                    {emp.jobTitle || '—'}
                                    {emp.department ? ` · ${emp.department}` : ''} &middot; {emp.cards.length} card(s)
                                </p>
                            </div>
                            <button onClick={() => handleRemoveEmployee(emp.id)} className="text-gray-400 hover:text-red-500">
                                <Trash2 size={16} />
                            </button>
                        </div>
                    ))}
                    {employees.length === 0 && <p className="text-sm text-black">No employees yet.</p>}
                </div>
            </section>

            {/* Cards */}
            <section className="space-y-4">
                <h2 className="font-bold text-lg flex items-center gap-2">
                    <CreditCard size={18} /> Cards ({cards.length})
                </h2>
                <p className="text-sm text-black -mt-2">Cards become available here once TapConnect assigns them to your business. Assign each one to a team member.</p>
                <div className="space-y-2">
                    {cards.map((card) => (
                        <div key={card.id} className="bg-white rounded-2xl p-4 shadow-sm flex items-center justify-between gap-3">
                            <span className="font-mono font-semibold text-sm">{card.code}</span>
                            <select
                                value={card.user?.id || ''}
                                onChange={(e) => handleAssignCard(card.code, e.target.value)}
                                className="text-sm px-3 py-2 rounded-lg bg-gray-100 outline-none"
                            >
                                <option value="">Unassigned</option>
                                {employees.map((emp) => (
                                    <option key={emp.id} value={emp.id}>
                                        {emp.displayName || emp.username}
                                    </option>
                                ))}
                            </select>
                        </div>
                    ))}
                    {cards.length === 0 && <p className="text-sm text-black">No cards assigned to your business yet.</p>}
                </div>
            </section>

            {/* Team analytics */}
            <section className="space-y-4">
                <h2 className="font-bold text-lg">Team Engagement</h2>
                <div className="bg-white rounded-3xl shadow-sm overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="text-left text-black border-b border-gray-100">
                                <th className="p-4 font-semibold">Employee</th>
                                <th className="p-4 font-semibold">
                                    <Eye size={14} className="inline mr-1" />
                                    Views
                                </th>
                                <th className="p-4 font-semibold">
                                    <Smartphone size={14} className="inline mr-1" />
                                    NFC Taps
                                </th>
                                <th className="p-4 font-semibold">
                                    <QrCode size={14} className="inline mr-1" />
                                    QR Scans
                                </th>
                                <th className="p-4 font-semibold">
                                    <MessageSquareText size={14} className="inline mr-1" />
                                    Leads
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {stats.map((s) => (
                                <tr key={s.id} className="border-b border-gray-50 last:border-0">
                                    <td className="p-4 font-medium">{s.displayName || s.username}</td>
                                    <td className="p-4">{s.views}</td>
                                    <td className="p-4">{s.nfcTaps}</td>
                                    <td className="p-4">{s.qrScans}</td>
                                    <td className="p-4">{s.leads}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {stats.length === 0 && <p className="text-sm text-black p-4">No team activity yet.</p>}
                </div>
                <p className="text-xs text-black">Engagement reflects profile activity only — not proof of sales or personal marketing effort.</p>
            </section>

            {/* Team leads */}
            <section className="space-y-4">
                <h2 className="font-bold text-lg flex items-center gap-2">
                    <MessageSquareText size={18} /> Team Leads ({leads.length})
                </h2>
                <p className="text-sm text-black -mt-2">Enquiries submitted to any employee&apos;s profile, visible to business admins.</p>
                <div className="space-y-2">
                    {leads.map((lead) => (
                        <div key={lead.id} className="bg-white rounded-2xl p-4 shadow-sm flex items-start justify-between gap-4">
                            <div>
                                <p className="font-semibold text-sm">{lead.name}</p>
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
                                <p className="text-xs text-black mt-1">
                                    For @{lead.owner?.username} &middot; {new Date(lead.created_at).toLocaleDateString()}
                                </p>
                            </div>
                            <span className="text-xs font-semibold px-3 py-1 rounded-full bg-gray-100 text-gray-600 capitalize whitespace-nowrap">{lead.status}</span>
                        </div>
                    ))}
                    {leads.length === 0 && <p className="text-sm text-black">No leads yet.</p>}
                </div>
            </section>
        </div>
    );
}

export default function BusinessPage() {
    return (
        <DashboardLayout>
            <BusinessInner />
        </DashboardLayout>
    );
}
