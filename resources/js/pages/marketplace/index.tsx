import { Head } from '@inertiajs/react';
import { ShopHeader } from '@/components/shop-header';
import { MarketplaceApp } from '@/components/marketplace-app';
import type { GridProduct } from '@/components/product-card';
import type { CategoryNode } from '@/lib/categoryTree';

export default function MarketplacePage({ products, categories }: { products: GridProduct[]; categories: CategoryNode[] }) {
    return (
        <>
            <Head title="TapConnect Marketplace | Nigeria's Premier Smart NFC E-Commerce Store" />
            <div className="min-h-screen bg-[#E8E5E0] text-[#181818]">
                <ShopHeader />

                <main className="max-w-7xl mx-auto pt-3 pb-20 px-2 sm:px-4 lg:px-6">
                    <MarketplaceApp products={products} categories={categories} />
                </main>
            </div>
        </>
    );
}
