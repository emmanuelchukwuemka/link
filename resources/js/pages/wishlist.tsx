import { useEffect, useState } from 'react';
import { Head, Link } from '@inertiajs/react';
import { Heart } from 'lucide-react';
import { ShopHeader } from '@/components/shop-header';
import { ProductCard, type GridProduct } from '@/components/product-card';
import { getWishlist } from '@/lib/wishlist';

type RawProduct = {
    id: number;
    slug: string;
    name: string;
    subtitle: string | null;
    category: string;
    images: string | null;
    colors: string | null;
    price_regular: number;
    price_sale: number | null;
    customization_price: number;
    created_at: string;
};

function toGridProduct(p: RawProduct): GridProduct {
    const colors: string[] = p.colors ? JSON.parse(p.colors) : [];
    const images: string[] = p.images ? JSON.parse(p.images) : [];

    return {
        id: p.id,
        slug: p.slug,
        name: p.name,
        subtitle: p.subtitle,
        category: p.category,
        image: images[0] || null,
        colors,
        priceRegular: p.price_regular,
        priceSale: p.price_sale,
        customizationPrice: p.customization_price,
        discountPct: p.price_sale ? Math.round((1 - p.price_sale / p.price_regular) * 100) : 0,
        isBestSeller: false,
        isNew: false,
        createdAt: new Date(p.created_at).getTime(),
    };
}

export default function WishlistPage() {
    const [products, setProducts] = useState<GridProduct[] | null>(null);

    useEffect(() => {
        const load = async () => {
            const ids = new Set(getWishlist());
            if (ids.size === 0) {
                setProducts([]);
                return;
            }
            const res = await fetch('/api/products');
            const data = await res.json();
            const all: RawProduct[] = data.products || [];
            setProducts(all.filter((p) => ids.has(p.id)).map(toGridProduct));
        };
        load();
        window.addEventListener('wishlist-updated', load);
        return () => window.removeEventListener('wishlist-updated', load);
    }, []);

    return (
        <>
            <Head title="My Wishlist | TapConnect" />
            <div className="min-h-screen bg-gray-50">
                <ShopHeader />

                <div className="max-w-6xl mx-auto pt-10 pb-20 px-4 sm:px-6">
                    <h1 className="text-2xl sm:text-3xl font-bold text-[#111111] mb-2">My Wishlist</h1>
                    <p className="text-gray-500 text-sm mb-8">Products you&apos;ve saved for later.</p>

                    {products === null ? null : products.length === 0 ? (
                        <div className="text-center py-24">
                            <span className="inline-flex w-14 h-14 rounded-full bg-gray-100 items-center justify-center mb-4">
                                <Heart size={22} className="text-gray-400" />
                            </span>
                            <p className="text-gray-500 font-medium mb-4">Your wishlist is empty.</p>
                            <Link href="/marketplace" className="text-sm font-semibold underline hover:text-black">
                                Browse the shop
                            </Link>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                            {products.map((p) => (
                                <ProductCard key={p.id} p={p} />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}
