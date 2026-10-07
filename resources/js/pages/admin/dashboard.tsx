import { useState, useEffect } from 'react';
import { Link } from '@inertiajs/react';
import { Users, Building2, UserPlus, ShoppingCart, CreditCard, Wallet, TrendingUp, TrendingDown, Package, ClipboardList, Truck, Megaphone, ExternalLink, Crown } from 'lucide-react';
import AdminLayout from '@/layouts/admin-layout';
import { apiFetch } from '@/lib/api';

type Me = { username: string; displayName: string | null };

type Stat = { value: number; change: number; series: number[] };

type Overview = {
    stats: {
        users: Stat;
        businesses: Stat;
        employees: Stat;
        orders: Stat;
        cardsSold: Stat;
        revenue: Stat;
    };
    revenueChart: { dates: string[]; productSales: number[]; subscriptions: number[] };
    userGrowthChart: { dates: string[]; individuals: number[]; businesses: number[]; employees: number[] };
    recentUsers: { id: number; name: string; username: string; email: string; accountType: string; createdAt: string; isActive: boolean }[];
    recentOrders: { id: number; orderNumber: string; customerName: string; total: number; status: string; productSummary: string }[];
    topProducts: { id: number; name: string; image: string | null; unitsSold: number; revenue: number }[];
    subscriptionOverview: { active: number; expiringSoon: number; expired: number; total: number };
    orderStatusOverview: { pending: number; processing: number; shipped: number; delivered: number };
    trafficSources: { nfcTap: number; qrCode: number; website: number; total: number };
};

const ORDER_STATUS_COLORS: Record<string, string> = {
    order_placed: 'bg-gray-100 text-gray-700',
    payment_confirmed: 'bg-blue-100 text-blue-700',
    profile_setup_required: 'bg-amber-100 text-amber-700',
    profile_completed: 'bg-blue-100 text-blue-700',
    preparing: 'bg-blue-100 text-blue-700',
    in_production: 'bg-purple-100 text-purple-700',
    quality_check: 'bg-purple-100 text-purple-700',
    shipped: 'bg-indigo-100 text-indigo-700',
    out_for_delivery: 'bg-indigo-100 text-indigo-700',
    delivered: 'bg-green-100 text-green-700',
    activated: 'bg-green-100 text-green-700',
};

function Sparkline({ data, positive }: { data: number[]; positive: boolean }) {
    const max = Math.max(...data, 1);
    const points = data.map((v, i) => `${(i / (data.length - 1)) * 100},${28 - (v / max) * 24}`).join(' ');
    return (
        <svg viewBox="0 0 100 28" className="w-full h-7" preserveAspectRatio="none">
            <polyline points={points} fill="none" stroke={positive ? '#16a34a' : '#dc2626'} strokeWidth="2" vectorEffect="non-scaling-stroke" />
        </svg>
    );
}

function StatCard({
    label,
    value,
    change,
    series,
    icon: Icon,
    iconBg,
    iconColor,
    format,
}: {
    label: string;
    value: number;
    change: number;
    series: number[];
    icon: React.ElementType;
    iconBg: string;
    iconColor: string;
    format?: (n: number) => string;
}) {
    const positive = change >= 0;
    return (
        <div className="bg-white p-5 rounded-3xl shadow-sm">
            <div className="flex items-center gap-3 mb-3">
                <span className={`w-11 h-11 rounded-full flex items-center justify-center shrink-0 ${iconBg}`}>
                    <Icon size={19} className={iconColor} />
                </span>
                <div className="min-w-0">
                    <p className="text-xs font-medium text-gray-700 truncate">{label}</p>
                    <p className="text-xl font-bold leading-tight text-black">{format ? format(value) : value.toLocaleString()}</p>
                </div>
            </div>
            <div className="flex items-center justify-between gap-2">
                <span className={`text-xs font-semibold flex items-center gap-1 ${positive ? 'text-green-600' : 'text-red-500'}`}>
                    {positive ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
                    {Math.abs(change)}%
                </span>
                <div className="w-16">
                    <Sparkline data={series} positive={positive} />
                </div>
            </div>
        </div>
    );
}

function DualAreaChart({ dates, a, b, aLabel, bLabel }: { dates: string[]; a: number[]; b: number[]; aLabel: string; bLabel: string }) {
    const max = Math.max(...a, ...b, 1);
    const w = 300,
        h = 120;
    const toPoints = (series: number[]) => series.map((v, i) => `${(i / (series.length - 1)) * w},${h - (v / max) * (h - 8) - 4}`);
    const aPoints = toPoints(a);
    const bPoints = toPoints(b);
    const aLine = `M${aPoints.join(' L')}`;
    const bLine = `M${bPoints.join(' L')}`;
    const aArea = `${aLine} L${w},${h} L0,${h} Z`;
    const step = Math.max(Math.floor(dates.length / 6), 1);

    return (
        <div>
            <div className="flex items-center gap-4 mb-2 text-xs font-medium text-gray-700">
                <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-green-500" /> {aLabel}
                </span>
                <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-500" /> {bLabel}
                </span>
            </div>
            <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-40" preserveAspectRatio="none">
                <defs>
                    <linearGradient id="revGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#16a34a" stopOpacity="0.18" />
                        <stop offset="100%" stopColor="#16a34a" stopOpacity="0" />
                    </linearGradient>
                </defs>
                <path d={aArea} fill="url(#revGradient)" stroke="none" />
                <path d={aLine} fill="none" stroke="#16a34a" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
                <path d={bLine} fill="none" stroke="#3b82f6" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
            </svg>
            <div className="flex justify-between text-[11px] text-gray-600 mt-1">
                {dates
                    .filter((_, i) => i % step === 0)
                    .map((d) => (
                        <span key={d}>{new Date(d).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                    ))}
            </div>
        </div>
    );
}

function StackedBarChart({ dates, individuals, businesses, employees }: { dates: string[]; individuals: number[]; businesses: number[]; employees: number[] }) {
    const totals = dates.map((_, i) => individuals[i] + businesses[i] + employees[i]);
    const max = Math.max(...totals, 1);

    return (
        <div>
            <div className="flex items-center gap-4 mb-2 text-xs font-medium text-gray-700 flex-wrap">
                <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-500" /> Individuals
                </span>
                <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-green-500" /> Businesses
                </span>
                <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-purple-500" /> Employees
                </span>
            </div>
            <div className="flex items-end gap-2 h-40">
                {dates.map((d, i) => {
                    const h = 140;
                    const iH = max ? (individuals[i] / max) * h : 0;
                    const bH = max ? (businesses[i] / max) * h : 0;
                    const eH = max ? (employees[i] / max) * h : 0;
                    return (
                        <div key={d} className="flex-1 flex flex-col items-center gap-1.5">
                            <div className="w-full flex flex-col-reverse rounded-t-md overflow-hidden" style={{ height: h }}>
                                <div style={{ height: iH }} className="w-full bg-blue-500" />
                                <div style={{ height: bH }} className="w-full bg-green-500" />
                                <div style={{ height: eH }} className="w-full bg-purple-500" />
                            </div>
                            <span className="text-[10px] text-gray-600">{new Date(d).toLocaleDateString(undefined, { weekday: 'short' })}</span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

function Donut({ segments, total }: { segments: { label: string; value: number; color: string }[]; total: number }) {
    const size = 120,
        stroke = 16,
        r = (size - stroke) / 2,
        c = 2 * Math.PI * r;
    const arcs = segments.reduce<Array<{ label: string; value: number; color: string; dash: number; offset: number }>>((acc, s) => {
        const dash = (total > 0 ? s.value / total : 0) * c;
        const offset = acc.length > 0 ? acc[acc.length - 1].offset + acc[acc.length - 1].dash : 0;
        return [...acc, { ...s, dash, offset }];
    }, []);
    return (
        <div className="flex items-center gap-5">
            <div className="relative shrink-0" style={{ width: size, height: size }}>
                <svg viewBox={`0 0 ${size} ${size}`} className="w-full h-full -rotate-90">
                    <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#f3f4f6" strokeWidth={stroke} />
                    {arcs.map((s) => (
                        <circle key={s.label} cx={size / 2} cy={size / 2} r={r} fill="none" stroke={s.color} strokeWidth={stroke} strokeDasharray={`${s.dash} ${c - s.dash}`} strokeDashoffset={-s.offset} strokeLinecap="butt" />
                    ))}
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-xl font-bold text-black">{total.toLocaleString()}</span>
                    <span className="text-[10px] text-gray-600">Total</span>
                </div>
            </div>
            <div className="space-y-1.5 min-w-0">
                {segments.map((s) => (
                    <div key={s.label} className="flex items-center gap-2 text-xs">
                        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: s.color }} />
                        <span className="text-gray-700 truncate">{s.label}</span>
                        <span className="font-semibold text-black ml-auto">{s.value.toLocaleString()}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

function CreateModal({
    title,
    fields,
    onClose,
    onSubmit,
}: {
    title: string;
    fields: { name: string; label: string; type?: string; options?: { value: string; label: string }[] }[];
    onClose: () => void;
    onSubmit: (data: Record<string, string>) => Promise<string | void>;
}) {
    const [values, setValues] = useState<Record<string, string>>({});
    const [error, setError] = useState('');
    const [saving, setSaving] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setError('');
        const err = await onSubmit(values);
        if (err) {
            setError(err);
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-white rounded-3xl p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
                <h2 className="text-lg font-bold mb-4 text-black">{title}</h2>
                {error && <div className="bg-red-50 text-red-500 p-3 rounded-lg mb-4 text-sm">{error}</div>}
                <form onSubmit={handleSubmit} className="space-y-3">
                    {fields.map((f) => (
                        <div key={f.name}>
                            <label className="block text-xs font-semibold text-black mb-1">{f.label}</label>
                            {f.type === 'select' ? (
                                <select required value={values[f.name] || ''} onChange={(e) => setValues({ ...values, [f.name]: e.target.value })} className="w-full px-3 py-2.5 rounded-lg bg-gray-100 outline-none text-sm text-black">
                                    <option value="">Select...</option>
                                    {f.options?.map((o) => (
                                        <option key={o.value} value={o.value}>
                                            {o.label}
                                        </option>
                                    ))}
                                </select>
                            ) : (
                                <input required type={f.type || 'text'} value={values[f.name] || ''} onChange={(e) => setValues({ ...values, [f.name]: e.target.value })} className="w-full px-3 py-2.5 rounded-lg bg-gray-100 outline-none text-sm text-black" />
                            )}
                        </div>
                    ))}
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

function AddUserModal({ businesses, onClose, onSubmit }: { businesses: { id: number; name: string }[]; onClose: () => void; onSubmit: (data: Record<string, string>) => Promise<string | void> }) {
    const [values, setValues] = useState<Record<string, string>>({ accountType: 'individual' });
    const [error, setError] = useState('');
    const [saving, setSaving] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setError('');
        const err = await onSubmit(values);
        if (err) {
            setError(err);
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-white rounded-3xl p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
                <h2 className="text-lg font-bold mb-4 text-black">Add User</h2>
                {error && <div className="bg-red-50 text-red-500 p-3 rounded-lg mb-4 text-sm">{error}</div>}
                <form onSubmit={handleSubmit} className="space-y-3">
                    <div>
                        <label className="block text-xs font-semibold text-black mb-1">Account Type</label>
                        <select value={values.accountType} onChange={(e) => setValues({ ...values, accountType: e.target.value })} className="w-full px-3 py-2.5 rounded-lg bg-gray-100 outline-none text-sm text-black">
                            <option value="individual">Individual</option>
                            <option value="employee">Employee</option>
                        </select>
                    </div>
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
                    {values.accountType === 'employee' && (
                        <div>
                            <label className="block text-xs font-semibold text-black mb-1">Business</label>
                            <select required value={values.businessId || ''} onChange={(e) => setValues({ ...values, businessId: e.target.value })} className="w-full px-3 py-2.5 rounded-lg bg-gray-100 outline-none text-sm text-black">
                                <option value="">Select...</option>
                                {businesses.map((b) => (
                                    <option key={b.id} value={b.id}>
                                        {b.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}
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

function AdminDashboardInner() {
    const [me, setMe] = useState<Me | null>(null);
    const [data, setData] = useState<Overview | null>(null);
    const [loading, setLoading] = useState(true);
    const [businesses, setBusinesses] = useState<{ id: number; name: string }[]>([]);
    const [modal, setModal] = useState<'user' | 'business' | null>(null);

    const load = () => {
        Promise.all([fetch('/api/auth/me').then((r) => r.json()), fetch('/api/admin/dashboard').then((r) => r.json()), fetch('/api/admin/businesses').then((r) => r.json())]).then(([meData, overview, biz]) => {
            if (meData.user) setMe(meData.user);
            setData(overview);
            if (biz.businesses) setBusinesses(biz.businesses);
            setLoading(false);
        });
    };

    useEffect(() => {
        load();
    }, []);

    if (loading || !data) return <div className="text-center py-20 text-black">Loading...</div>;

    const today = new Date().toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' });

    const quickActions = [
        { name: 'Add User', icon: UserPlus, onClick: () => setModal('user') },
        { name: 'Add Business', icon: Building2, onClick: () => setModal('business') },
        { name: 'Add Product', icon: Package, href: '/admin/products' },
        { name: 'Add Delivery Zone', icon: Truck, href: '/admin/delivery-zones' },
        { name: 'View Orders', icon: ClipboardList, href: '/admin/orders' },
        { name: 'Send Notification', icon: Megaphone, href: '/admin/notifications' },
    ];

    const createUser = async (values: Record<string, string>) => {
        const { ok, data: d } = await apiFetch('/api/admin/users', values);
        if (!ok) return (d.error as string) || 'Failed to create user';
        setModal(null);
        load();
    };

    const createBusiness = async (values: Record<string, string>) => {
        const { ok, data: d } = await apiFetch('/api/admin/businesses', values);
        if (!ok) return (d.error as string) || 'Failed to create business';
        setModal(null);
        load();
    };

    return (
        <div className="space-y-6">
            <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm flex flex-wrap items-center justify-between gap-4">
                <div>
                    <p className="text-gray-700 mb-1">Welcome back,</p>
                    <h1 className="text-2xl sm:text-3xl font-bold text-black mb-1">{me?.displayName || me?.username || 'Admin'} 👋</h1>
                    <p className="text-gray-700 text-sm">Here&apos;s what&apos;s happening on TapConnect today.</p>
                </div>
                <div className="flex items-center gap-3">
                    <span className="hidden sm:flex items-center gap-2 bg-gray-100 text-black text-sm font-medium px-4 py-2.5 rounded-full">{today}</span>
                    <a href="/" target="_blank" rel="noopener noreferrer" className="bg-black text-white px-5 py-2.5 rounded-full font-semibold text-sm hover:bg-gray-800 inline-flex items-center gap-1.5 whitespace-nowrap">
                        View Website <ExternalLink size={14} />
                    </a>
                </div>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                <StatCard label="Total Users" value={data.stats.users.value} change={data.stats.users.change} series={data.stats.users.series} icon={Users} iconBg="bg-blue-50" iconColor="text-blue-600" />
                <StatCard label="Businesses" value={data.stats.businesses.value} change={data.stats.businesses.change} series={data.stats.businesses.series} icon={Building2} iconBg="bg-green-50" iconColor="text-green-600" />
                <StatCard label="Employees" value={data.stats.employees.value} change={data.stats.employees.change} series={data.stats.employees.series} icon={UserPlus} iconBg="bg-purple-50" iconColor="text-purple-600" />
                <StatCard label="Total Orders" value={data.stats.orders.value} change={data.stats.orders.change} series={data.stats.orders.series} icon={ShoppingCart} iconBg="bg-amber-50" iconColor="text-amber-600" />
                <StatCard label="TapConnect Cards Sold" value={data.stats.cardsSold.value} change={data.stats.cardsSold.change} series={data.stats.cardsSold.series} icon={CreditCard} iconBg="bg-indigo-50" iconColor="text-indigo-600" />
                <StatCard label="Total Revenue" value={data.stats.revenue.value} change={data.stats.revenue.change} series={data.stats.revenue.series} icon={Wallet} iconBg="bg-emerald-50" iconColor="text-emerald-600" format={(n) => `₦${n.toLocaleString()}`} />
            </div>

            <div className="grid lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1 bg-white p-5 rounded-3xl shadow-sm">
                    <h2 className="font-bold mb-4 text-black">Revenue Overview</h2>
                    <DualAreaChart dates={data.revenueChart.dates} a={data.revenueChart.productSales} b={data.revenueChart.subscriptions} aLabel="Product Sales" bLabel="Subscriptions" />
                </div>
                <div className="lg:col-span-1 bg-white p-5 rounded-3xl shadow-sm">
                    <h2 className="font-bold mb-4 text-black">User Growth</h2>
                    <StackedBarChart dates={data.userGrowthChart.dates} individuals={data.userGrowthChart.individuals} businesses={data.userGrowthChart.businesses} employees={data.userGrowthChart.employees} />
                </div>
                <div className="lg:col-span-1 bg-white p-5 rounded-3xl shadow-sm">
                    <h2 className="font-bold mb-4 text-black">Quick Actions</h2>
                    <div className="grid grid-cols-3 gap-3">
                        {quickActions.map(({ name, icon: Icon, href, onClick }) => {
                            const content = (
                                <>
                                    <span className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                                        <Icon size={18} className="text-black" />
                                    </span>
                                    <span className="text-xs font-semibold text-center text-black">{name}</span>
                                </>
                            );
                            return href ? (
                                <Link key={name} href={href} className="flex flex-col items-center text-center gap-2 p-3 rounded-2xl border border-gray-100 hover:border-gray-200 hover:bg-gray-50 transition-colors">
                                    {content}
                                </Link>
                            ) : (
                                <button key={name} onClick={onClick} className="flex flex-col items-center text-center gap-2 p-3 rounded-2xl border border-gray-100 hover:border-gray-200 hover:bg-gray-50 transition-colors">
                                    {content}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            <div className="grid lg:grid-cols-3 gap-6">
                <div className="bg-white p-5 rounded-3xl shadow-sm overflow-x-auto">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="font-bold text-black">Recent Users</h2>
                        <Link href="/admin/users" className="text-xs font-semibold text-black hover:underline">
                            View All
                        </Link>
                    </div>
                    <table className="w-full text-xs">
                        <thead>
                            <tr className="text-left text-black border-b border-gray-100">
                                <th className="pb-2 font-semibold">Name</th>
                                <th className="pb-2 font-semibold">Type</th>
                                <th className="pb-2 font-semibold">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.recentUsers.map((u) => (
                                <tr key={u.id} className="border-b border-gray-50 last:border-0">
                                    <td className="py-2.5">
                                        <div className="flex items-center gap-2">
                                            <span className="w-7 h-7 rounded-full bg-black text-white flex items-center justify-center text-[11px] font-bold shrink-0">{u.name.charAt(0).toUpperCase()}</span>
                                            <div className="min-w-0">
                                                <p className="font-medium text-black truncate">{u.name}</p>
                                                <p className="text-gray-600 truncate">{u.email}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="py-2.5 capitalize text-black whitespace-nowrap">{u.accountType.replace('_', ' ')}</td>
                                    <td className="py-2.5">
                                        <span className={`px-2 py-0.5 rounded-full font-semibold whitespace-nowrap ${u.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>{u.isActive ? 'Active' : 'Suspended'}</span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="bg-white p-5 rounded-3xl shadow-sm overflow-x-auto">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="font-bold text-black">Recent Orders</h2>
                        <Link href="/admin/orders" className="text-xs font-semibold text-black hover:underline">
                            View All
                        </Link>
                    </div>
                    <table className="w-full text-xs">
                        <thead>
                            <tr className="text-left text-black border-b border-gray-100">
                                <th className="pb-2 font-semibold">Order</th>
                                <th className="pb-2 font-semibold">Amount</th>
                                <th className="pb-2 font-semibold">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.recentOrders.map((o) => (
                                <tr key={o.id} className="border-b border-gray-50 last:border-0">
                                    <td className="py-2.5">
                                        <p className="font-medium text-black">#{o.orderNumber}</p>
                                        <p className="text-gray-600 truncate max-w-[140px]">
                                            {o.customerName} &middot; {o.productSummary}
                                        </p>
                                    </td>
                                    <td className="py-2.5 font-semibold text-black whitespace-nowrap">₦{o.total.toLocaleString()}</td>
                                    <td className="py-2.5">
                                        <span className={`px-2 py-0.5 rounded-full font-semibold capitalize whitespace-nowrap ${ORDER_STATUS_COLORS[o.status] || 'bg-gray-100 text-gray-700'}`}>{o.status.replace(/_/g, ' ')}</span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="bg-white p-5 rounded-3xl shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="font-bold text-black">Top Products</h2>
                        <Link href="/admin/products" className="text-xs font-semibold text-black hover:underline">
                            View All
                        </Link>
                    </div>
                    <div className="space-y-3">
                        {data.topProducts.length === 0 ? (
                            <p className="text-sm text-black text-center py-6">No sales yet.</p>
                        ) : (
                            data.topProducts.map((p, i) => (
                                <div key={p.id} className="flex items-center gap-3">
                                    <span className="w-5 text-xs font-bold text-gray-600 shrink-0">{i + 1}</span>
                                    <div className="w-10 h-10 rounded-lg bg-gray-100 overflow-hidden shrink-0 flex items-center justify-center">
                                        {p.image ? <img src={p.image} alt="" className="w-full h-full object-cover" /> : <Package size={16} className="text-gray-400" />}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="text-sm font-medium text-black truncate">{p.name}</p>
                                        <p className="text-xs text-gray-600">{p.unitsSold} sold</p>
                                    </div>
                                    <p className="text-sm font-semibold text-black shrink-0">₦{p.revenue.toLocaleString()}</p>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            <div className="grid lg:grid-cols-3 gap-6">
                <div className="bg-white p-5 rounded-3xl shadow-sm">
                    <h2 className="font-bold mb-4 text-black flex items-center gap-2">
                        <Crown size={16} className="text-amber-500" /> Subscription Overview
                    </h2>
                    <Donut
                        total={data.subscriptionOverview.total}
                        segments={[
                            { label: 'Active', value: data.subscriptionOverview.active, color: '#16a34a' },
                            { label: 'Expiring Soon', value: data.subscriptionOverview.expiringSoon, color: '#f59e0b' },
                            { label: 'Expired', value: data.subscriptionOverview.expired, color: '#dc2626' },
                        ]}
                    />
                </div>
                <div className="bg-white p-5 rounded-3xl shadow-sm">
                    <h2 className="font-bold mb-4 text-black">Order Status</h2>
                    <Donut
                        total={data.orderStatusOverview.pending + data.orderStatusOverview.processing + data.orderStatusOverview.shipped + data.orderStatusOverview.delivered}
                        segments={[
                            { label: 'Delivered', value: data.orderStatusOverview.delivered, color: '#16a34a' },
                            { label: 'Shipped', value: data.orderStatusOverview.shipped, color: '#6366f1' },
                            { label: 'Processing', value: data.orderStatusOverview.processing, color: '#3b82f6' },
                            { label: 'Pending', value: data.orderStatusOverview.pending, color: '#f59e0b' },
                        ]}
                    />
                </div>
                <div className="bg-white p-5 rounded-3xl shadow-sm">
                    <h2 className="font-bold mb-4 text-black">Traffic Sources</h2>
                    <Donut
                        total={data.trafficSources.total}
                        segments={[
                            { label: 'NFC Tap', value: data.trafficSources.nfcTap, color: '#3b82f6' },
                            { label: 'Website', value: data.trafficSources.website, color: '#16a34a' },
                            { label: 'QR Code', value: data.trafficSources.qrCode, color: '#a855f7' },
                        ]}
                    />
                </div>
            </div>

            {modal === 'user' && <AddUserModal businesses={businesses} onClose={() => setModal(null)} onSubmit={createUser} />}

            {modal === 'business' && (
                <CreateModal
                    title="Add Business"
                    fields={[
                        { name: 'businessName', label: 'Business Name' },
                        { name: 'displayName', label: "Owner's Full Name" },
                        { name: 'username', label: "Owner's Username" },
                        { name: 'email', label: "Owner's Email", type: 'email' },
                        { name: 'password', label: 'Temporary Password', type: 'password' },
                    ]}
                    onClose={() => setModal(null)}
                    onSubmit={createBusiness}
                />
            )}
        </div>
    );
}

export default function AdminDashboardPage() {
    return (
        <AdminLayout>
            <AdminDashboardInner />
        </AdminLayout>
    );
}
