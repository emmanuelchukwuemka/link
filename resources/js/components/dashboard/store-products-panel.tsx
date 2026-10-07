import { useState, useEffect } from 'react';
import { Link } from '@inertiajs/react';
import { Plus, Trash2, Store, Crown } from 'lucide-react';
import { ImageUploader } from '@/components/image-uploader';
import { ProductsServicesTabs } from '@/components/products-services-tabs';
import { apiFetch } from '@/lib/api';

type VariantGroup = { name: string; options: string[] };

type Product = {
    id: number;
    name: string;
    description: string | null;
    image_url: string | null;
    price: number;
    discount_price: number | null;
    category: string | null;
    availability: string;
    variants: string | null;
};

const AVAILABILITY = ['available', 'out_of_stock', 'coming_soon', 'hidden'];

function parseVariants(raw: string | null): VariantGroup[] {
    if (!raw) return [];
    try {
        return JSON.parse(raw);
    } catch {
        return [];
    }
}

function VariantEditor({ variants, onChange }: { variants: string | null; onChange: (json: string) => void }) {
    const groups = parseVariants(variants);
    const [name, setName] = useState('');
    const [options, setOptions] = useState('');

    const addGroup = () => {
        if (!name.trim() || !options.trim()) return;
        const next = [...groups, { name: name.trim(), options: options.split(',').map((o) => o.trim()).filter(Boolean) }];
        onChange(JSON.stringify(next));
        setName('');
        setOptions('');
    };

    const removeGroup = (i: number) => {
        const next = groups.filter((_, idx) => idx !== i);
        onChange(JSON.stringify(next));
    };

    return (
        <div className="space-y-2 bg-gray-50 rounded-lg p-2">
            <p className="text-xs font-semibold text-black">Variants</p>
            {groups.map((g, i) => (
                <div key={i} className="flex items-center justify-between text-xs bg-white rounded px-2 py-1">
                    <span>
                        <strong>{g.name}:</strong> {g.options.join(', ')}
                    </span>
                    <button onClick={() => removeGroup(i)} className="text-gray-400 hover:text-red-500">
                        <Trash2 size={12} />
                    </button>
                </div>
            ))}
            <div className="flex gap-1">
                <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Color" className="w-1/3 text-xs px-2 py-1 rounded bg-white outline-none" />
                <input
                    value={options}
                    onChange={(e) => setOptions(e.target.value)}
                    placeholder="Black, White"
                    className="flex-1 text-xs px-2 py-1 rounded bg-white outline-none"
                />
                <button onClick={addGroup} className="text-xs px-2 py-1 rounded bg-black text-white font-semibold">
                    +
                </button>
            </div>
        </div>
    );
}

type Category = { id: number; name: string };

export function StoreProductsPanel({ showTabs = true, showHeading = true }: { showTabs?: boolean; showHeading?: boolean }) {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [categories, setCategories] = useState<Category[]>([]);
    const [isPro, setIsPro] = useState(false);
    const [error, setError] = useState('');

    const load = async () => {
        const res = await fetch('/api/store-products');
        const data = await res.json();
        if (data.products) setProducts(data.products);
        setLoading(false);
    };

    const loadCategories = async () => {
        const res = await fetch('/api/store-categories');
        const data = await res.json();
        if (data.categories) setCategories(data.categories);
    };

    useEffect(() => {
        load();
        loadCategories();
        fetch('/api/auth/me')
            .then((res) => res.json())
            .then((data) => {
                if (data.user) {
                    setIsPro(data.user.plan === 'pro' && (!data.user.plan_expires_at || new Date(data.user.plan_expires_at) > new Date()));
                }
            });
    }, []);

    const addProduct = async () => {
        setError('');
        const { ok, data } = await apiFetch('/api/store-products', { name: '', price: 0 });
        if (!ok) {
            setError((data.error as string) || 'Could not add product');
            return;
        }
        if (data.product) setProducts([...products, data.product as Product]);
    };

    const updateProduct = async (id: number, updates: Partial<Product>) => {
        const updated = { ...products.find((p) => p.id === id), ...updates } as Product;
        setProducts(products.map((p) => (p.id === id ? updated : p)));
        await apiFetch(
            `/api/store-products/${id}`,
            {
                name: updated.name,
                description: updated.description,
                imageUrl: updated.image_url,
                price: updated.price,
                discountPrice: updated.discount_price,
                category: updated.category,
                availability: updated.availability,
                variants: updated.variants,
            },
            'PUT',
        );
    };

    const deleteProduct = async (id: number) => {
        setProducts(products.filter((p) => p.id !== id));
        await apiFetch(`/api/store-products/${id}`, undefined, 'DELETE');
    };

    if (loading) return <div className="text-center py-20 text-black">Loading...</div>;

    return (
        <div className="max-w-3xl space-y-6">
            {showTabs && <ProductsServicesTabs />}

            {!isPro && (
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center justify-between gap-4">
                    <p className="text-sm text-amber-800 flex items-center gap-2">
                        <Crown size={16} /> Selling products from your shop is a Pro feature.
                    </p>
                    <Link href="/dashboard/subscription" className="text-sm font-semibold bg-amber-600 text-white px-4 py-2 rounded-full whitespace-nowrap hover:bg-amber-700">
                        Upgrade
                    </Link>
                </div>
            )}
            {error && <div className="bg-red-50 text-red-500 p-3 rounded-lg text-sm">{error}</div>}

            <div className="flex justify-between items-center">
                {showHeading && (
                    <div>
                        <h1 className="text-2xl font-bold">My Store</h1>
                        <p className="text-black text-sm mt-1">Products shown on your profile. Visitors order directly via WhatsApp.</p>
                    </div>
                )}
                {isPro ? (
                    <button onClick={addProduct} className="bg-[#000000] text-white px-4 py-2 rounded-full font-semibold flex items-center gap-2 hover:bg-[#000000]/90 whitespace-nowrap ml-auto">
                        <Plus size={18} /> Add product
                    </button>
                ) : (
                    <Link
                        href="/dashboard/subscription"
                        className="bg-gray-100 text-gray-500 px-4 py-2 rounded-full font-semibold flex items-center gap-2 hover:bg-gray-200 whitespace-nowrap ml-auto"
                    >
                        <Crown size={16} className="text-amber-500" /> Add product
                    </Link>
                )}
            </div>

            {products.length === 0 ? (
                <div className="bg-white rounded-3xl p-8 text-center text-black shadow-sm">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Store size={32} className="text-gray-400" />
                    </div>
                    No products yet. Add your first product to start selling from your profile.
                </div>
            ) : (
                <div className="grid sm:grid-cols-2 gap-4">
                    {products.map((p) => (
                        <div key={p.id} className="bg-white rounded-2xl p-4 shadow-sm space-y-2">
                            <div className="flex gap-2">
                                <input
                                    value={p.name}
                                    onChange={(e) => updateProduct(p.id, { name: e.target.value })}
                                    placeholder="Product name"
                                    className="flex-1 font-semibold outline-none bg-transparent"
                                />
                                <button onClick={() => deleteProduct(p.id)} className="text-gray-400 hover:text-red-500">
                                    <Trash2 size={18} />
                                </button>
                            </div>
                            <div className="flex items-center gap-2">
                                {p.image_url && <img src={p.image_url} alt="" className="w-12 h-12 rounded-lg object-cover shrink-0" />}
                                <input
                                    value={p.image_url || ''}
                                    onChange={(e) => updateProduct(p.id, { image_url: e.target.value })}
                                    placeholder="Image URL"
                                    className="flex-1 text-sm px-3 py-2 rounded-lg bg-gray-50 outline-none"
                                />
                                <ImageUploader
                                    label="Upload"
                                    onUploaded={(url) => updateProduct(p.id, { image_url: url })}
                                    className="bg-gray-100 text-gray-700 px-3 py-2 rounded-lg font-semibold text-xs hover:bg-gray-200 flex items-center gap-1 shrink-0"
                                />
                            </div>
                            <textarea
                                value={p.description || ''}
                                onChange={(e) => updateProduct(p.id, { description: e.target.value })}
                                placeholder="Description"
                                className="w-full text-sm text-gray-600 outline-none bg-gray-50 rounded-lg p-2"
                            />
                            <div className="grid grid-cols-2 gap-2">
                                <input
                                    type="number"
                                    value={p.price}
                                    onChange={(e) => updateProduct(p.id, { price: parseFloat(e.target.value) || 0 })}
                                    placeholder="Price"
                                    className="text-sm px-3 py-2 rounded-lg bg-gray-50 outline-none"
                                />
                                <input
                                    type="number"
                                    value={p.discount_price ?? ''}
                                    onChange={(e) => updateProduct(p.id, { discount_price: e.target.value ? parseFloat(e.target.value) : null })}
                                    placeholder="Discount price"
                                    className="text-sm px-3 py-2 rounded-lg bg-gray-50 outline-none"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <select
                                    value={p.category || ''}
                                    onChange={(e) => updateProduct(p.id, { category: e.target.value || null })}
                                    className="text-sm px-3 py-2 rounded-lg bg-gray-50 outline-none"
                                >
                                    <option value="">No category</option>
                                    {p.category && !categories.some((c) => c.name === p.category) && <option value={p.category}>{p.category}</option>}
                                    {categories.map((c) => (
                                        <option key={c.id} value={c.name}>
                                            {c.name}
                                        </option>
                                    ))}
                                </select>
                                <select
                                    value={p.availability}
                                    onChange={(e) => updateProduct(p.id, { availability: e.target.value })}
                                    className="text-sm px-3 py-2 rounded-lg bg-gray-50 outline-none capitalize"
                                >
                                    {AVAILABILITY.map((a) => (
                                        <option key={a} value={a}>
                                            {a.replace('_', ' ')}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <VariantEditor variants={p.variants} onChange={(json) => updateProduct(p.id, { variants: json })} />
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
