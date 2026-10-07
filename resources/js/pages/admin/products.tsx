import { useState, useEffect, useMemo } from 'react';
import { Link } from '@inertiajs/react';
import { Plus, Trash2, Package, X, Pencil, ImageOff, Ruler, Palette, CheckCircle2, XCircle, Upload, MoreVertical, ChevronLeft, ChevronRight, Copy, Tag } from 'lucide-react';
import AdminLayout from '@/layouts/admin-layout';
import { ImageUploader } from '@/components/image-uploader';
import { apiFetch } from '@/lib/api';

type Product = {
    id: number;
    name: string;
    slug: string;
    subtitle: string | null;
    category: string;
    sku: string | null;
    stock: number;
    description: string | null;
    images: string | null;
    length: number | null;
    width: number | null;
    colors: string | null;
    price_regular: number;
    price_sale: number | null;
    production_time: string;
    availability: string;
    customization_price: number;
};

type Draft = {
    id?: number;
    name: string;
    subtitle: string;
    category: string;
    sku: string;
    stock: string;
    description: string;
    images: string[];
    length: string;
    width: string;
    colors: string;
    priceRegular: string;
    priceSale: string;
    productionTime: string;
    availability: string;
    customizationPrice: string;
};

type CategoryTreeNode = { id: number; name: string; parentId: number | null; children: CategoryTreeNode[] };

const AVAILABILITY = ['available', 'out_of_stock', 'coming_soon', 'hidden'];
const PAGE_SIZE = 8;
const LOW_STOCK_THRESHOLD = 100;

const STATUS_LABELS: Record<string, string> = {
    available: 'Active',
    out_of_stock: 'Out of Stock',
    coming_soon: 'Coming Soon',
    hidden: 'Hidden',
};

const STATUS_COLORS: Record<string, string> = {
    available: 'bg-green-100 text-green-700',
    out_of_stock: 'bg-red-100 text-red-600',
    coming_soon: 'bg-amber-100 text-amber-700',
    hidden: 'bg-gray-100 text-gray-700',
};

const CATEGORY_COLORS: Record<string, string> = {
    'TapConnect Cards': 'bg-blue-100 text-blue-700',
    Wristbands: 'bg-purple-100 text-purple-700',
    Accessories: 'bg-amber-100 text-amber-700',
    'Custom Designs': 'bg-pink-100 text-pink-700',
};
const FALLBACK_CATEGORY_COLORS = ['bg-teal-100 text-teal-700', 'bg-indigo-100 text-indigo-700', 'bg-orange-100 text-orange-700', 'bg-cyan-100 text-cyan-700'];

function categoryColor(category: string): string {
    if (CATEGORY_COLORS[category]) return CATEGORY_COLORS[category];
    let hash = 0;
    for (let i = 0; i < category.length; i++) hash = (hash * 31 + category.charCodeAt(i)) >>> 0;
    return FALLBACK_CATEGORY_COLORS[hash % FALLBACK_CATEGORY_COLORS.length];
}

const EMPTY_DRAFT: Draft = {
    name: '',
    subtitle: '',
    category: 'TapConnect Cards',
    sku: '',
    stock: '0',
    description: '',
    images: [],
    length: '',
    width: '',
    colors: '',
    priceRegular: '',
    priceSale: '',
    productionTime: '3-5 business days',
    availability: 'available',
    customizationPrice: '5000',
};

function toDraft(p: Product): Draft {
    return {
        id: p.id,
        name: p.name,
        subtitle: p.subtitle || '',
        category: p.category,
        sku: p.sku || '',
        stock: p.stock.toString(),
        description: p.description || '',
        images: p.images ? JSON.parse(p.images) : [],
        length: p.length?.toString() || '',
        width: p.width?.toString() || '',
        colors: p.colors ? JSON.parse(p.colors).join(', ') : '',
        priceRegular: p.price_regular.toString(),
        priceSale: p.price_sale?.toString() || '',
        productionTime: p.production_time,
        availability: p.availability,
        customizationPrice: p.customization_price.toString(),
    };
}

function draftFromProductAsCopy(p: Product): Draft {
    const d = toDraft(p);
    return { ...d, id: undefined, name: `${p.name} (Copy)`, sku: '' };
}

function ProductModal({
    draft,
    categories,
    categoryTree,
    onClose,
    onSave,
    onDelete,
}: {
    draft: Draft;
    categories: string[];
    categoryTree: CategoryTreeNode[];
    onClose: () => void;
    onSave: (draft: Draft) => Promise<string | void>;
    onDelete?: () => void;
}) {
    const [values, setValues] = useState<Draft>(draft);
    const [error, setError] = useState('');
    const [saving, setSaving] = useState(false);
    const isEdit = !!draft.id;

    const set = <K extends keyof Draft>(key: K, value: Draft[K]) => setValues((v) => ({ ...v, [key]: value }));

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!values.name.trim() || !values.priceRegular) {
            setError('Name and regular price are required');
            return;
        }
        setSaving(true);
        setError('');
        const err = await onSave(values);
        if (err) {
            setError(err);
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between px-6 pt-6 pb-4 sticky top-0 bg-white z-10">
                    <h2 className="text-lg font-bold text-black">{isEdit ? 'Edit Product' : 'Add Product'}</h2>
                    <button onClick={onClose} className="p-1.5 text-gray-500 hover:text-black rounded-lg hover:bg-gray-100">
                        <X size={18} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="px-6 pb-6 space-y-4">
                    {error && <div className="bg-red-50 text-red-500 p-3 rounded-lg text-sm">{error}</div>}

                    <div>
                        <label className="block text-xs font-semibold text-black mb-1.5">Images</label>
                        <div className="flex flex-wrap gap-3">
                            {values.images.map((url, i) => (
                                <div key={url} className="relative w-20 h-20 rounded-xl overflow-hidden bg-gray-100 group">
                                    <img src={url} alt="" className="w-full h-full object-cover" />
                                    <button
                                        type="button"
                                        onClick={() => set('images', values.images.filter((_, idx) => idx !== i))}
                                        className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <X size={12} />
                                    </button>
                                </div>
                            ))}
                            <ImageUploader
                                label="Add"
                                onUploaded={(url) => set('images', [...values.images, url])}
                                className="w-20 h-20 rounded-xl border-2 border-dashed border-gray-200 text-gray-500 hover:border-gray-300 hover:text-black flex flex-col items-center justify-center gap-1 text-[11px] font-semibold"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-black mb-1.5">Product Name</label>
                        <input required value={values.name} onChange={(e) => set('name', e.target.value)} className="w-full px-3 py-2.5 rounded-lg bg-gray-100 outline-none text-sm text-black" />
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-black mb-1.5">Subtitle</label>
                        <input value={values.subtitle} onChange={(e) => set('subtitle', e.target.value)} placeholder="e.g. TapConnect Card • Wooden" className="w-full px-3 py-2.5 rounded-lg bg-gray-100 outline-none text-sm text-black" />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-semibold text-black mb-1.5">Category</label>
                            <select required value={values.category} onChange={(e) => set('category', e.target.value)} className="w-full px-3 py-2.5 rounded-lg bg-gray-100 outline-none text-sm text-black">
                                {!categories.includes(values.category) && <option value={values.category}>{values.category}</option>}
                                {categoryTree.map((root) => (
                                    <optgroup key={root.id} label={root.name}>
                                        <option value={root.name}>{root.name}</option>
                                        {root.children.map((child) => (
                                            <option key={child.id} value={child.name}>
                                                &mdash; {child.name}
                                            </option>
                                        ))}
                                    </optgroup>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-black mb-1.5">SKU</label>
                            <input value={values.sku} onChange={(e) => set('sku', e.target.value)} placeholder="TC-CARD-MINI" className="w-full px-3 py-2.5 rounded-lg bg-gray-100 outline-none text-sm text-black" />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-black mb-1.5">Description</label>
                        <textarea value={values.description} onChange={(e) => set('description', e.target.value)} rows={3} className="w-full px-3 py-2.5 rounded-lg bg-gray-100 outline-none text-sm text-black resize-none" />
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                        <div>
                            <label className="block text-xs font-semibold text-black mb-1.5">Regular Price (₦)</label>
                            <input required type="number" value={values.priceRegular} onChange={(e) => set('priceRegular', e.target.value)} className="w-full px-3 py-2.5 rounded-lg bg-gray-100 outline-none text-sm text-black" />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-black mb-1.5">Sale Price (₦)</label>
                            <input type="number" value={values.priceSale} onChange={(e) => set('priceSale', e.target.value)} className="w-full px-3 py-2.5 rounded-lg bg-gray-100 outline-none text-sm text-black" />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-black mb-1.5">Stock</label>
                            <input type="number" value={values.stock} onChange={(e) => set('stock', e.target.value)} className="w-full px-3 py-2.5 rounded-lg bg-gray-100 outline-none text-sm text-black" />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-semibold text-black mb-1.5">Customization Fee (₦)</label>
                            <input type="number" value={values.customizationPrice} onChange={(e) => set('customizationPrice', e.target.value)} className="w-full px-3 py-2.5 rounded-lg bg-gray-100 outline-none text-sm text-black" />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-black mb-1.5">Status</label>
                            <select value={values.availability} onChange={(e) => set('availability', e.target.value)} className="w-full px-3 py-2.5 rounded-lg bg-gray-100 outline-none text-sm text-black">
                                {AVAILABILITY.map((a) => (
                                    <option key={a} value={a}>
                                        {STATUS_LABELS[a]}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-black mb-1.5 flex items-center gap-1">
                            <Palette size={13} /> Colors (comma-separated)
                        </label>
                        <input value={values.colors} onChange={(e) => set('colors', e.target.value)} placeholder="Black, White, Rose Gold" className="w-full px-3 py-2.5 rounded-lg bg-gray-100 outline-none text-sm text-black" />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-semibold text-black mb-1.5 flex items-center gap-1">
                                <Ruler size={13} /> Length (mm)
                            </label>
                            <input type="number" value={values.length} onChange={(e) => set('length', e.target.value)} className="w-full px-3 py-2.5 rounded-lg bg-gray-100 outline-none text-sm text-black" />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-black mb-1.5 flex items-center gap-1">
                                <Ruler size={13} /> Width (mm)
                            </label>
                            <input type="number" value={values.width} onChange={(e) => set('width', e.target.value)} className="w-full px-3 py-2.5 rounded-lg bg-gray-100 outline-none text-sm text-black" />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-black mb-1.5">Production Time</label>
                        <input value={values.productionTime} onChange={(e) => set('productionTime', e.target.value)} className="w-full px-3 py-2.5 rounded-lg bg-gray-100 outline-none text-sm text-black" />
                    </div>

                    <div className="flex gap-3 pt-2">
                        {isEdit && onDelete && (
                            <button type="button" onClick={onDelete} className="px-4 py-2.5 rounded-full font-semibold text-sm text-red-600 bg-red-50 hover:bg-red-100 flex items-center gap-1.5">
                                <Trash2 size={14} /> Delete
                            </button>
                        )}
                        <div className="flex-1" />
                        <button type="button" onClick={onClose} className="px-5 py-2.5 rounded-full font-semibold text-sm bg-gray-100 text-black hover:bg-gray-200">
                            Cancel
                        </button>
                        <button type="submit" disabled={saving} className="px-5 py-2.5 rounded-full font-semibold text-sm bg-green-600 text-white hover:bg-green-700 disabled:opacity-60">
                            {saving ? 'Saving...' : isEdit ? 'Save Changes' : 'Create Product'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

function AdminProductsInner() {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [modalDraft, setModalDraft] = useState<Draft | null>(null);
    const [category, setCategory] = useState<string | null>(null);
    const [page, setPage] = useState(1);
    const [selected, setSelected] = useState<Set<number>>(new Set());
    const [menuOpenId, setMenuOpenId] = useState<number | null>(null);
    const [importing, setImporting] = useState(false);
    const [importError, setImportError] = useState('');
    const [categoryTree, setCategoryTree] = useState<CategoryTreeNode[]>([]);

    useEffect(() => {
        fetch('/api/admin/products')
            .then((res) => res.json())
            .then((data) => {
                if (data.products) setProducts(data.products);
                setLoading(false);
            });
        fetch('/api/admin/categories')
            .then((res) => res.json())
            .then((data) => {
                if (data.categories) setCategoryTree(data.categories);
            });
    }, []);

    const categoryCounts = useMemo(() => {
        const counts: Record<string, number> = {};
        for (const p of products) counts[p.category] = (counts[p.category] || 0) + 1;
        return counts;
    }, [products]);

    const categories = useMemo(() => {
        const names = new Set<string>();
        const walk = (nodes: CategoryTreeNode[]) =>
            nodes.forEach((n) => {
                names.add(n.name);
                walk(n.children);
            });
        walk(categoryTree);
        products.forEach((p) => names.add(p.category));
        return Array.from(names).sort();
    }, [categoryTree, products]);

    const handleSave = async (draft: Draft): Promise<string | void> => {
        const payload = {
            name: draft.name,
            subtitle: draft.subtitle || null,
            category: draft.category || 'TapConnect Cards',
            sku: draft.sku || null,
            stock: draft.stock,
            description: draft.description || null,
            images: draft.images,
            length: draft.length || null,
            width: draft.width || null,
            colors: draft.colors
                ? draft.colors
                      .split(',')
                      .map((c) => c.trim())
                      .filter(Boolean)
                : [],
            priceRegular: draft.priceRegular,
            priceSale: draft.priceSale || null,
            productionTime: draft.productionTime,
            availability: draft.availability,
            customizationPrice: draft.customizationPrice,
        };

        if (draft.id) {
            const { ok, data } = await apiFetch(`/api/admin/products/${draft.id}`, payload, 'PUT');
            if (!ok) return (data.error as string) || 'Could not save product';
            setProducts(products.map((p) => (p.id === draft.id ? (data.product as Product) : p)));
        } else {
            const { ok, data } = await apiFetch('/api/admin/products', payload);
            if (!ok) return (data.error as string) || 'Could not create product';
            setProducts([data.product as Product, ...products]);
        }
        setModalDraft(null);
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Delete this product? This cannot be undone.')) return;
        const { ok, data } = await apiFetch(`/api/admin/products/${id}`, undefined, 'DELETE');
        if (ok) {
            setProducts(products.filter((p) => p.id !== id));
            setModalDraft(null);
            setSelected((s) => {
                const next = new Set(s);
                next.delete(id);
                return next;
            });
        } else {
            alert((data.error as string) || 'Could not delete product');
        }
        setMenuOpenId(null);
    };

    const handleBulkDelete = async () => {
        if (!confirm(`Delete ${selected.size} product(s)? This cannot be undone.`)) return;
        const ids = Array.from(selected);
        const results = await Promise.all(ids.map((id) => apiFetch(`/api/admin/products/${id}`, undefined, 'DELETE')));
        const deletedIds = ids.filter((_, i) => results[i].ok);
        setProducts(products.filter((p) => !deletedIds.includes(p.id)));
        setSelected(new Set());
        if (deletedIds.length < ids.length) alert('Some products could not be deleted because they have existing orders.');
    };

    const handleDuplicate = async (p: Product) => {
        setMenuOpenId(null);
        await handleSave(draftFromProductAsCopy(p));
    };

    const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setImporting(true);
        setImportError('');
        try {
            const text = await file.text();
            const lines = text
                .split('\n')
                .map((l) => l.trim())
                .filter(Boolean);
            const header = lines[0].split(',').map((h) => h.trim().toLowerCase());
            const rows = lines.slice(1).map((line) => {
                const cells = line.split(',').map((c) => c.trim());
                const row: Record<string, string> = {};
                header.forEach((h, i) => {
                    row[h] = cells[i] || '';
                });
                return row;
            });

            const created: Product[] = [];
            for (const row of rows) {
                if (!row.name || !row.priceregular) continue;
                const { ok, data } = await apiFetch('/api/admin/products', {
                    name: row.name,
                    subtitle: row.subtitle || null,
                    category: row.category || 'TapConnect Cards',
                    sku: row.sku || null,
                    stock: row.stock || '0',
                    priceRegular: row.priceregular,
                    priceSale: row.pricesale || null,
                });
                if (ok) created.push(data.product as Product);
            }
            setProducts((prev) => [...created, ...prev]);
        } catch {
            setImportError('Could not read that file. Expected a CSV with columns: name, category, sku, priceRegular, priceSale, stock, subtitle');
        } finally {
            setImporting(false);
            e.target.value = '';
        }
    };

    if (loading) return <div className="text-center py-20 text-black">Loading...</div>;

    const counts = {
        total: products.length,
        available: products.filter((p) => p.availability === 'available').length,
        out_of_stock: products.filter((p) => p.availability === 'out_of_stock').length,
    };
    const catalogValue = products.reduce((sum, p) => sum + (p.price_sale ?? p.price_regular), 0);

    const filtered = category ? products.filter((p) => p.category === category) : products;
    const totalPages = Math.max(Math.ceil(filtered.length / PAGE_SIZE), 1);
    const currentPage = Math.min(page, totalPages);
    const pageItems = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

    const toggleSelectAll = () => {
        if (pageItems.every((p) => selected.has(p.id))) {
            setSelected((s) => {
                const next = new Set(s);
                pageItems.forEach((p) => next.delete(p.id));
                return next;
            });
        } else {
            setSelected((s) => {
                const next = new Set(s);
                pageItems.forEach((p) => next.add(p.id));
                return next;
            });
        }
    };
    const toggleSelect = (id: number) => {
        setSelected((s) => {
            const next = new Set(s);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap justify-between items-start gap-3">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-black">Products</h1>
                    <p className="text-gray-600 text-sm mt-1">Manage your TapConnect physical products, prices, inventory and more.</p>
                </div>
                <div className="flex items-center gap-3">
                    <Link href="/admin/categories" className="bg-white border border-gray-200 text-black px-4 py-2.5 rounded-full font-semibold text-sm flex items-center gap-2 hover:bg-gray-50 whitespace-nowrap">
                        <Tag size={16} /> Categories
                    </Link>
                    <label className="bg-white border border-gray-200 text-black px-4 py-2.5 rounded-full font-semibold text-sm flex items-center gap-2 hover:bg-gray-50 cursor-pointer whitespace-nowrap">
                        <Upload size={16} /> {importing ? 'Importing...' : 'Import'}
                        <input type="file" accept=".csv,text/csv" onChange={handleImport} disabled={importing} className="hidden" />
                    </label>
                    <button onClick={() => setModalDraft(EMPTY_DRAFT)} className="bg-green-600 text-white px-4 py-2.5 rounded-full font-semibold flex items-center gap-2 hover:bg-green-700 whitespace-nowrap">
                        <Plus size={18} /> Add Product
                    </button>
                </div>
            </div>
            {importError && <div className="bg-red-50 text-red-500 p-3 rounded-lg text-sm">{importError}</div>}

            <div className="grid grid-cols-3 gap-3">
                <div className="p-4 rounded-2xl shadow-sm bg-white flex flex-col items-center text-center gap-1">
                    <Package size={20} className="text-gray-700" />
                    <span className="text-xl font-bold text-black">{counts.total}</span>
                    <span className="text-xs text-gray-600">Total Products</span>
                </div>
                <div className="p-4 rounded-2xl shadow-sm bg-white flex flex-col items-center text-center gap-1">
                    <CheckCircle2 size={20} className="text-green-600" />
                    <span className="text-xl font-bold text-black">{counts.available}</span>
                    <span className="text-xs text-gray-600">Active</span>
                </div>
                <div className="p-4 rounded-2xl shadow-sm bg-white flex flex-col items-center text-center gap-1">
                    <XCircle size={20} className="text-red-500" />
                    <span className="text-xl font-bold text-black">{counts.out_of_stock}</span>
                    <span className="text-xs text-gray-600">Out of Stock</span>
                </div>
            </div>

            <div className="bg-white rounded-3xl p-5 shadow-sm flex flex-wrap items-center justify-between gap-3">
                <div>
                    <p className="text-sm font-semibold text-black mb-0.5">Total Catalog Value</p>
                    <p className="text-2xl font-bold text-black">₦{catalogValue.toLocaleString()}</p>
                </div>
                <p className="text-xs text-gray-600 max-w-xs">
                    Sum of current selling price across all {counts.total} product{counts.total === 1 ? '' : 's'}
                </p>
            </div>

            <div className="flex flex-wrap gap-2">
                <button
                    onClick={() => {
                        setCategory(null);
                        setPage(1);
                    }}
                    className={`flex items-center gap-2 px-4 py-2 rounded-full font-semibold text-sm transition-colors ${category === null ? 'bg-green-600 text-white' : 'bg-white text-black border border-gray-200 hover:bg-gray-50'}`}
                >
                    All Products
                    <span className={`text-xs px-1.5 py-0.5 rounded-full ${category === null ? 'bg-white/20' : 'bg-gray-100'}`}>{counts.total}</span>
                </button>
                {categories.map((c) => (
                    <button
                        key={c}
                        onClick={() => {
                            setCategory(c);
                            setPage(1);
                        }}
                        className={`flex items-center gap-2 px-4 py-2 rounded-full font-semibold text-sm transition-colors ${category === c ? 'bg-green-600 text-white' : 'bg-white text-black border border-gray-200 hover:bg-gray-50'}`}
                    >
                        {c}
                        <span className={`text-xs px-1.5 py-0.5 rounded-full ${category === c ? 'bg-white/20' : 'bg-gray-100'}`}>{categoryCounts[c] || 0}</span>
                    </button>
                ))}
            </div>

            {selected.size > 0 && (
                <div className="bg-black rounded-2xl px-5 py-3 flex items-center justify-between gap-3">
                    <span className="text-white text-sm font-semibold">{selected.size} selected</span>
                    <div className="flex items-center gap-2">
                        <button onClick={() => setSelected(new Set())} className="text-white/70 hover:text-white text-sm font-semibold px-3 py-1.5">
                            Clear
                        </button>
                        <button onClick={handleBulkDelete} className="bg-red-600 text-white text-sm font-semibold px-4 py-1.5 rounded-full hover:bg-red-700 flex items-center gap-1.5">
                            <Trash2 size={14} /> Delete Selected
                        </button>
                    </div>
                </div>
            )}

            {filtered.length === 0 ? (
                <div className="bg-white rounded-3xl p-8 text-center text-black shadow-sm">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Package size={32} className="text-gray-400" />
                    </div>
                    No products in this view yet.
                </div>
            ) : (
                <div className="bg-white rounded-3xl shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="text-left text-black border-b border-gray-100">
                                    <th className="p-4 w-10">
                                        <input type="checkbox" checked={pageItems.length > 0 && pageItems.every((p) => selected.has(p.id))} onChange={toggleSelectAll} className="w-4 h-4 rounded accent-black" />
                                    </th>
                                    <th className="p-4 font-semibold">Product</th>
                                    <th className="p-4 font-semibold">Category</th>
                                    <th className="p-4 font-semibold">Price</th>
                                    <th className="p-4 font-semibold">Stock</th>
                                    <th className="p-4 font-semibold">Status</th>
                                    <th className="p-4 font-semibold">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {pageItems.map((p) => {
                                    const images: string[] = p.images ? JSON.parse(p.images) : [];
                                    return (
                                        <tr key={p.id} className="border-b border-gray-50 last:border-0">
                                            <td className="p-4">
                                                <input type="checkbox" checked={selected.has(p.id)} onChange={() => toggleSelect(p.id)} className="w-4 h-4 rounded accent-black" />
                                            </td>
                                            <td className="p-4">
                                                <div className="flex items-center gap-3 min-w-[200px]">
                                                    <div className="w-11 h-11 rounded-lg bg-gray-100 overflow-hidden shrink-0 flex items-center justify-center">
                                                        {images[0] ? <img src={images[0]} alt="" className="w-full h-full object-cover" /> : <ImageOff size={16} className="text-gray-300" />}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="font-semibold text-black truncate">{p.name}</p>
                                                        <p className="text-xs text-gray-600 truncate">{p.subtitle || '—'}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full whitespace-nowrap ${categoryColor(p.category)}`}>{p.category}</span>
                                            </td>
                                            <td className="p-4 whitespace-nowrap">
                                                {p.price_sale ? (
                                                    <span className="flex items-center gap-2">
                                                        <span className="text-gray-500 line-through text-xs">₦{p.price_regular.toLocaleString()}</span>
                                                        <span className="font-bold text-black">₦{p.price_sale.toLocaleString()}</span>
                                                    </span>
                                                ) : (
                                                    <span className="font-bold text-black">₦{p.price_regular.toLocaleString()}</span>
                                                )}
                                            </td>
                                            <td className={`p-4 font-semibold ${p.stock < LOW_STOCK_THRESHOLD ? 'text-red-600' : 'text-green-600'}`}>{p.stock}</td>
                                            <td className="p-4">
                                                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full whitespace-nowrap ${STATUS_COLORS[p.availability]}`}>{STATUS_LABELS[p.availability]}</span>
                                            </td>
                                            <td className="p-4">
                                                <div className="flex items-center gap-2">
                                                    <button onClick={() => setModalDraft(toDraft(p))} className="text-xs font-semibold px-3 py-1.5 rounded-full border border-gray-200 text-black hover:bg-gray-50 flex items-center gap-1.5 whitespace-nowrap">
                                                        <Pencil size={12} /> Edit
                                                    </button>
                                                    <div className="relative">
                                                        <button onClick={() => setMenuOpenId(menuOpenId === p.id ? null : p.id)} className="p-1.5 rounded-lg border border-gray-200 text-black hover:bg-gray-50">
                                                            <MoreVertical size={14} />
                                                        </button>
                                                        {menuOpenId === p.id && (
                                                            <div className="absolute right-0 mt-1 w-36 bg-white rounded-xl shadow-xl border border-gray-100 py-1 z-20">
                                                                <button onClick={() => handleDuplicate(p)} className="w-full text-left flex items-center gap-2 px-3 py-2 text-xs font-semibold text-black hover:bg-gray-50">
                                                                    <Copy size={12} /> Duplicate
                                                                </button>
                                                                <button onClick={() => handleDelete(p.id)} className="w-full text-left flex items-center gap-2 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50">
                                                                    <Trash2 size={12} /> Delete
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-3 p-4 border-t border-gray-100">
                        <p className="text-xs text-gray-600">
                            Showing {(currentPage - 1) * PAGE_SIZE + 1} to {Math.min(currentPage * PAGE_SIZE, filtered.length)} of {filtered.length} products
                        </p>
                        <div className="flex items-center gap-1.5">
                            <button onClick={() => setPage(Math.max(currentPage - 1, 1))} disabled={currentPage === 1} className="p-1.5 rounded-lg border border-gray-200 text-black disabled:opacity-40 hover:bg-gray-50">
                                <ChevronLeft size={14} />
                            </button>
                            {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
                                <button key={n} onClick={() => setPage(n)} className={`w-7 h-7 rounded-lg text-xs font-semibold ${n === currentPage ? 'bg-green-600 text-white' : 'text-black hover:bg-gray-50 border border-gray-200'}`}>
                                    {n}
                                </button>
                            ))}
                            <button onClick={() => setPage(Math.min(currentPage + 1, totalPages))} disabled={currentPage === totalPages} className="p-1.5 rounded-lg border border-gray-200 text-black disabled:opacity-40 hover:bg-gray-50">
                                <ChevronRight size={14} />
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {modalDraft && <ProductModal draft={modalDraft} categories={categories} categoryTree={categoryTree} onClose={() => setModalDraft(null)} onSave={handleSave} onDelete={modalDraft.id ? () => handleDelete(modalDraft.id!) : undefined} />}
        </div>
    );
}

export default function AdminProductsPage() {
    return (
        <AdminLayout>
            <AdminProductsInner />
        </AdminLayout>
    );
}
