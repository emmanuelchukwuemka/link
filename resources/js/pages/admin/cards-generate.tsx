import { useState, useEffect } from 'react';
import { Link, router } from '@inertiajs/react';
import { ChevronRight, Info, Upload } from 'lucide-react';
import AdminLayout from '@/layouts/admin-layout';
import { apiFetch } from '@/lib/api';

type RealProduct = { id: number; name: string; length: number | null; width: number | null; colors: string[] };
type Business = { id: number; name: string };
type Order = { id: number; orderNumber: string };

const PRODUCT_META = {
    mini: { label: 'Mini', matchName: 'TapConnect Mini' },
    standard: { label: 'Standard', matchName: 'TapConnect Standard' },
    wristband: { label: 'Wristband', matchName: 'TapConnect Wristband' },
};

const QUANTITY_PRESETS = [10, 25, 50, 100, 250];

function CardChip() {
    return <div className="w-9 h-6 rounded-[4px] bg-[#181818]" />;
}

function AdminGenerateCardsInner() {
    const [tab, setTab] = useState<'batch' | 'one' | 'csv'>('batch');
    const [products, setProducts] = useState<Record<string, RealProduct>>({});
    const [businesses, setBusinesses] = useState<Business[]>([]);
    const [orders, setOrders] = useState<Order[]>([]);
    const [employees, setEmployees] = useState<{ id: number; displayName: string | null; username: string }[]>([]);

    const [product, setProduct] = useState<'mini' | 'standard' | 'wristband'>('standard');
    const [color, setColor] = useState('');
    const [qty, setQty] = useState(100);
    const [reserve, setReserve] = useState(false);
    const [businessId, setBusinessId] = useState('');
    const [orderId, setOrderId] = useState('');
    const [batchLabel, setBatchLabel] = useState('');
    const [assignEmployeeId, setAssignEmployeeId] = useState('');

    const [generating, setGenerating] = useState(false);
    const [error, setError] = useState('');
    const [csvFile, setCsvFile] = useState<File | null>(null);
    const [csvError, setCsvError] = useState('');
    const [csvImporting, setCsvImporting] = useState(false);

    useEffect(() => {
        Promise.all([fetch('/api/admin/products').then((r) => r.json()), fetch('/api/admin/businesses').then((r) => r.json()), fetch('/api/admin/orders').then((r) => r.json())]).then(([productsData, businessesData, ordersData]) => {
            const map: Record<string, RealProduct> = {};
            for (const [key, meta] of Object.entries(PRODUCT_META)) {
                const p = (productsData.products || []).find((x: { name: string }) => x.name === meta.matchName);
                if (p) map[key] = { id: p.id, name: p.name, length: p.length, width: p.width, colors: p.colors ? JSON.parse(p.colors) : [] };
            }
            setProducts(map);
            setBusinesses(businessesData.businesses || []);
            setOrders((ordersData.orders || []).slice(0, 30).map((o: { id: number; order_number: string }) => ({ id: o.id, orderNumber: o.order_number })));
        });
    }, []);

    useEffect(() => {
        const colors = products[product]?.colors || [];
        if (colors.length && !colors.includes(color)) setColor(colors[0]);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [product, products]);

    useEffect(() => {
        setAssignEmployeeId('');
        if (!businessId) {
            setEmployees([]);
            return;
        }
        fetch(`/api/admin/businesses/${businessId}/employees`)
            .then((r) => r.json())
            .then((d) => setEmployees(d.employees || []));
    }, [businessId]);

    const currentProduct = products[product];
    const dimensionLabel = currentProduct?.length && currentProduct?.width ? `${currentProduct.length} × ${currentProduct.width} cm` : 'One size';

    const [sampleIds, setSampleIds] = useState<string[]>([]);
    useEffect(() => {
        setSampleIds(
            Array.from({ length: Math.min(3, qty) }, () => {
                const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
                let s = '';
                for (let i = 0; i < 6; i++) s += chars[Math.floor(Math.random() * chars.length)];
                return `TC-${s}`;
            }),
        );
    }, [qty, tab]);

    const linkedOrder = orders.find((o) => o.id === Number(orderId));

    const handleGenerate = async () => {
        setGenerating(true);
        setError('');
        try {
            const { ok, data } = await apiFetch('/api/cards', {
                count: tab === 'one' ? 1 : qty,
                product,
                color: color || null,
                businessId: reserve && businessId ? businessId : undefined,
                orderId: reserve && orderId ? orderId : undefined,
                batchLabel: batchLabel || undefined,
            });
            if (!ok) throw new Error((data.error as string) || 'Could not generate cards');

            const cards = data.cards as { code: string }[];

            if (reserve && assignEmployeeId && cards?.[0]) {
                await apiFetch(`/api/cards/${cards[0].code}`, { action: 'assign', userId: assignEmployeeId }, 'PATCH');
            }

            const rows = ['Card ID,Tap URL', ...cards.map((c) => `${c.code},https://tapconnect.ng/c/${c.code}`)];
            const blob = new Blob([rows.join('\n')], { type: 'text/csv' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `tapconnect-cards-${Date.now()}.csv`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            URL.revokeObjectURL(url);

            router.visit('/admin/cards');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Something went wrong');
        } finally {
            setGenerating(false);
        }
    };

    const handleCsvImport = async () => {
        if (!csvFile) return;
        setCsvImporting(true);
        setCsvError('');
        try {
            const text = await csvFile.text();
            const lines = text
                .split('\n')
                .map((l) => l.trim())
                .filter(Boolean);
            const header = lines[0].split(',').map((h) => h.trim().toLowerCase());
            const codeIdx = header.indexOf('code');
            const productIdx = header.indexOf('product');
            const colorIdx = header.indexOf('color');
            if (codeIdx === -1) throw new Error('CSV must have a "code" column');

            for (const line of lines.slice(1)) {
                const cells = line.split(',').map((c) => c.trim());
                const code = cells[codeIdx]?.toUpperCase();
                if (!code) continue;
                await apiFetch('/api/cards/import-one', {
                    code,
                    product: productIdx !== -1 ? cells[productIdx]?.toLowerCase() : 'standard',
                    color: colorIdx !== -1 ? cells[colorIdx] : null,
                });
            }
            router.visit('/admin/cards');
        } catch (err) {
            setCsvError(err instanceof Error ? err.message : 'Could not import that file');
        } finally {
            setCsvImporting(false);
        }
    };

    return (
        <div className="space-y-6 max-w-6xl">
            <div className="flex items-center gap-1.5 text-xs font-medium text-gray-400">
                <Link href="/admin/cards" className="hover:text-black">
                    TapConnect Cards
                </Link>
                <ChevronRight size={12} />
                <span className="text-gray-600 font-semibold">Add cards</span>
            </div>

            <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-black mb-1">Add cards</h1>
                <p className="text-gray-600 text-sm">Create card IDs, then program each chip with its tap URL.</p>
            </div>

            <div className="inline-flex bg-gray-100 rounded-xl p-1 gap-1">
                {(
                    [
                        ['batch', 'Generate a batch'],
                        ['one', 'Add one card'],
                        ['csv', 'Import CSV'],
                    ] as const
                ).map(([key, label]) => (
                    <button key={key} onClick={() => setTab(key)} className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${tab === key ? 'bg-white text-black shadow-sm' : 'text-gray-500 hover:text-black'}`}>
                        {label}
                    </button>
                ))}
            </div>

            {tab === 'csv' ? (
                <div className="bg-white rounded-3xl p-6 shadow-sm max-w-xl space-y-4">
                    <div>
                        <h2 className="font-bold text-lg mb-1">Import cards from CSV</h2>
                        <p className="text-sm text-gray-500">
                            Columns: <code className="bg-gray-100 px-1.5 py-0.5 rounded">code</code> (required), <code className="bg-gray-100 px-1.5 py-0.5 rounded">product</code>, <code className="bg-gray-100 px-1.5 py-0.5 rounded">color</code>. Use
                            this when chips were already manufactured with pre-printed IDs.
                        </p>
                    </div>
                    {csvError && <div className="bg-red-50 text-red-500 p-3 rounded-lg text-sm">{csvError}</div>}
                    <label className="flex items-center gap-2 border-2 border-dashed border-gray-200 rounded-xl p-6 cursor-pointer hover:border-gray-300 justify-center text-sm font-semibold text-gray-600">
                        <Upload size={16} />
                        {csvFile ? csvFile.name : 'Choose a CSV file'}
                        <input type="file" accept=".csv,text/csv" className="hidden" onChange={(e) => setCsvFile(e.target.files?.[0] || null)} />
                    </label>
                    <button onClick={handleCsvImport} disabled={!csvFile || csvImporting} className="w-full bg-black text-white py-3 rounded-xl font-semibold disabled:opacity-50">
                        {csvImporting ? 'Importing...' : 'Import cards'}
                    </button>
                </div>
            ) : (
                <div className="grid lg:grid-cols-[1fr_380px] gap-5 items-start">
                    <div className="bg-white rounded-3xl shadow-sm divide-y divide-gray-100">
                        <div className="p-6">
                            <h3 className="font-bold mb-1">Product</h3>
                            <p className="text-sm text-gray-500 mb-4">Which physical product are these chips going into?</p>
                            <div className="grid grid-cols-3 gap-3">
                                {(Object.keys(PRODUCT_META) as Array<keyof typeof PRODUCT_META>).map((key) => (
                                    <button key={key} onClick={() => setProduct(key)} className={`flex items-center gap-3 p-4 rounded-xl border-2 text-left transition-colors ${product === key ? 'border-black' : 'border-gray-200 hover:border-gray-300'}`}>
                                        <CardChip />
                                        <div className="flex-1 min-w-0">
                                            <p className="font-semibold text-sm">{PRODUCT_META[key].label}</p>
                                            <p className="text-xs text-gray-400">{key === product ? dimensionLabel : products[key]?.length ? `${products[key].length} × ${products[key].width} cm` : 'One size'}</p>
                                        </div>
                                        <div className={`w-4 h-4 rounded-full border-2 shrink-0 ${product === key ? 'border-black bg-black' : 'border-gray-300'}`} />
                                    </button>
                                ))}
                            </div>
                        </div>

                        {(currentProduct?.colors.length || 0) > 0 && (
                            <div className="p-6">
                                <h3 className="font-bold mb-1">Color</h3>
                                <p className="text-sm text-gray-500 mb-4">Only colors offered for {PRODUCT_META[product].label} are shown.</p>
                                <div className="flex gap-3">
                                    {currentProduct!.colors.map((c) => (
                                        <button key={c} onClick={() => setColor(c)} className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl border-2 font-semibold text-sm transition-colors ${color === c ? 'border-black' : 'border-gray-200 hover:border-gray-300'}`}>
                                            <span className="w-4 h-4 rounded-full border border-gray-300" style={{ backgroundColor: c.toLowerCase() === 'black' ? '#181818' : c.toLowerCase() === 'white' ? '#fff' : c }} />
                                            {c}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {tab === 'batch' && (
                            <div className="p-6">
                                <h3 className="font-bold mb-1">How many cards?</h3>
                                <p className="text-sm text-gray-500 mb-4">Each card gets its own unique ID. Up to 1,000 per batch.</p>
                                <div className="flex items-center gap-2 mb-3">
                                    <button onClick={() => setQty((q) => Math.max(1, q - 1))} className="w-10 h-10 rounded-lg border border-gray-200 font-bold hover:bg-gray-50">
                                        &minus;
                                    </button>
                                    <input type="number" value={qty} onChange={(e) => setQty(Math.min(1000, Math.max(1, parseInt(e.target.value, 10) || 1)))} className="w-24 text-center text-lg font-bold border border-gray-200 rounded-lg py-2 outline-none" />
                                    <button onClick={() => setQty((q) => Math.min(1000, q + 1))} className="w-10 h-10 rounded-lg border border-gray-200 font-bold hover:bg-gray-50">
                                        +
                                    </button>
                                </div>
                                <div className="flex gap-2">
                                    {QUANTITY_PRESETS.map((n) => (
                                        <button key={n} onClick={() => setQty(n)} className={`px-3 py-1.5 rounded-full text-xs font-semibold ${qty === n ? 'bg-black text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                                            {n}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="p-6">
                            <h3 className="font-bold mb-1">Reserve for a business</h3>
                            <p className="text-sm text-gray-500 mb-4">Optional. Use this when the batch is for a company&apos;s team order.</p>
                            <label className="flex items-center gap-3 cursor-pointer mb-4">
                                <button type="button" onClick={() => setReserve((r) => !r)} className={`w-11 h-6 rounded-full relative transition-colors shrink-0 ${reserve ? 'bg-black' : 'bg-gray-300'}`}>
                                    <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-all ${reserve ? 'left-[22px]' : 'left-0.5'}`} />
                                </button>
                                <span className="font-semibold text-sm">Reserve these cards for a business</span>
                            </label>

                            {reserve && (
                                <div className="grid sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-500 mb-1.5">Business</label>
                                        <select value={businessId} onChange={(e) => setBusinessId(e.target.value)} className="w-full px-3 py-2.5 rounded-lg bg-gray-100 outline-none text-sm">
                                            <option value="">Select a business&hellip;</option>
                                            {businesses.map((b) => (
                                                <option key={b.id} value={b.id}>
                                                    {b.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-500 mb-1.5">Linked order (optional)</label>
                                        <select value={orderId} onChange={(e) => setOrderId(e.target.value)} className="w-full px-3 py-2.5 rounded-lg bg-gray-100 outline-none text-sm">
                                            <option value="">No linked order</option>
                                            {orders.map((o) => (
                                                <option key={o.id} value={o.id}>
                                                    #{o.orderNumber}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    {tab === 'one' && employees.length > 0 && (
                                        <div className="sm:col-span-2">
                                            <label className="block text-xs font-semibold text-gray-500 mb-1.5">Assign directly to a team member (optional)</label>
                                            <select value={assignEmployeeId} onChange={(e) => setAssignEmployeeId(e.target.value)} className="w-full px-3 py-2.5 rounded-lg bg-gray-100 outline-none text-sm">
                                                <option value="">Leave in business pool</option>
                                                {employees.map((e) => (
                                                    <option key={e.id} value={e.id}>
                                                        {e.displayName || e.username}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        <div className="p-6">
                            <h3 className="font-bold mb-1">Batch label</h3>
                            <p className="text-sm text-gray-500 mb-3">Optional. Helps you find this batch later.</p>
                            <input value={batchLabel} onChange={(e) => setBatchLabel(e.target.value)} placeholder="e.g. Oct 2026 · Grand Palace team order" className="w-full px-4 py-3 rounded-lg bg-gray-100 outline-none text-sm" />
                        </div>
                    </div>

                    <div className="bg-white rounded-3xl shadow-sm p-6 sticky top-6 space-y-5">
                        <div>
                            <h3 className="font-bold">Summary</h3>
                            <p className="text-sm text-gray-500">Review before generating.</p>
                        </div>

                        {error && <div className="bg-red-50 text-red-500 p-3 rounded-lg text-sm">{error}</div>}

                        <p className="text-4xl font-bold">
                            {tab === 'one' ? 1 : qty} card{(tab === 'one' ? 1 : qty) === 1 ? '' : 's'}
                        </p>

                        <div className="space-y-2.5 text-sm">
                            <div className="flex justify-between">
                                <span className="text-gray-500">Product</span>
                                <span className="font-semibold">
                                    {PRODUCT_META[product].label}
                                    {color ? ` · ${color}` : ''}
                                </span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-gray-500">Status after creation</span>
                                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${reserve && businessId ? 'bg-blue-50 text-blue-600' : 'bg-gray-100 text-gray-600'}`}>{reserve && businessId ? 'Reserved' : 'Unassigned'}</span>
                            </div>
                            {reserve && businessId && (
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Business pool</span>
                                    <span className="font-semibold">{businesses.find((b) => b.id === Number(businessId))?.name}</span>
                                </div>
                            )}
                            {reserve && linkedOrder && (
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Order</span>
                                    <span className="font-semibold">#{linkedOrder.orderNumber}</span>
                                </div>
                            )}
                        </div>

                        <div className="bg-gray-50 rounded-xl p-4">
                            <div className="flex justify-between text-xs font-semibold text-gray-400 mb-2">
                                <span>Sample IDs</span>
                                <span>Tap URL to program</span>
                            </div>
                            <div className="space-y-1.5">
                                {sampleIds.map((id) => (
                                    <div key={id} className="flex justify-between text-xs">
                                        <span className="font-mono font-bold">{id}</span>
                                        <span className="font-mono text-gray-400">tapconnect.ng/c/{id}</span>
                                    </div>
                                ))}
                            </div>
                            {qty > 3 && tab === 'batch' && <p className="text-xs text-gray-400 mt-2">+ {qty - 3} more</p>}
                        </div>

                        <div className="flex items-start gap-2.5 bg-blue-50 rounded-xl p-3.5">
                            <Info size={15} className="text-blue-500 shrink-0 mt-0.5" />
                            <p className="text-xs text-blue-700">After generating, a CSV of IDs and tap URLs downloads automatically &mdash; load it into your NFC programming tool. Each chip must hold its own URL.</p>
                        </div>

                        <div className="flex gap-3">
                            <Link href="/admin/cards" className="flex-1 text-center py-3 rounded-xl border border-gray-200 font-semibold text-sm hover:bg-gray-50">
                                Cancel
                            </Link>
                            <button onClick={handleGenerate} disabled={generating || (reserve && !businessId)} className="flex-1 bg-black text-white py-3 rounded-xl font-semibold text-sm hover:bg-gray-800 disabled:opacity-50">
                                {generating ? 'Generating...' : `Generate ${tab === 'one' ? 1 : qty} card${(tab === 'one' ? 1 : qty) === 1 ? '' : 's'}`}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default function AdminGenerateCardsPage() {
    return (
        <AdminLayout>
            <AdminGenerateCardsInner />
        </AdminLayout>
    );
}
