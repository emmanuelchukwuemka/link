import { Head, Link } from '@inertiajs/react';
import { Truck, RefreshCw, CreditCard, ChevronRight, Sparkles, CheckCircle, Info } from 'lucide-react';
import { ShopHeader } from '@/components/shop-header';
import { ProductGallery } from '@/components/product-gallery';
import { ProductActions } from '@/components/product-actions';
import { ProductCard, type GridProduct } from '@/components/product-card';

type ProductDetail = {
    id: number;
    slug: string;
    name: string;
    subtitle: string | null;
    category: string;
    description: string | null;
    images: string[];
    colors: string[];
    priceRegular: number;
    priceSale: number | null;
    currentPrice: number;
    discountPct: number;
    customizationPrice: number;
    stock: number;
    length: number | null;
    width: number | null;
};

export default function ProductPage({ product, relatedProducts }: { product: ProductDetail; relatedProducts: GridProduct[] }) {
    return (
        <>
            <Head title={`${product.name} | TapConnect Marketplace`} />
            <div className="min-h-screen bg-[#E8E5E0]">
                <ShopHeader />

                <main className="max-w-7xl mx-auto pt-4 pb-20 px-3 sm:px-6">
                    <nav className="flex items-center gap-1.5 text-xs text-[#66635F] mb-4 overflow-x-auto whitespace-nowrap">
                        <Link href="/" className="hover:text-black">
                            Home
                        </Link>
                        <ChevronRight size={12} />
                        <Link href="/marketplace" className="hover:text-black">
                            Marketplace
                        </Link>
                        <ChevronRight size={12} />
                        <Link href={`/marketplace?cat=${encodeURIComponent(product.category)}#catalog`} className="hover:text-black font-semibold text-[#181818]">
                            {product.category}
                        </Link>
                        <ChevronRight size={12} />
                        <span className="text-[#181818] font-bold truncate max-w-xs">{product.name}</span>
                    </nav>

                    <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-4 items-start">
                        <div className="bg-white rounded-lg border border-[#D4D0C9] shadow-sm p-4 sm:p-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <ProductGallery images={product.images} category={product.category} productName={product.name} />

                                <div className="flex flex-col justify-between">
                                    <div>
                                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                                            <span className="bg-[#181818] text-white text-[11px] font-bold px-2 py-0.5 rounded">Official Store</span>
                                            <span className="bg-[#E8E5E0] text-[#181818] text-[11px] font-semibold px-2 py-0.5 rounded">{product.category}</span>
                                        </div>

                                        <h1 className="text-xl sm:text-2xl font-bold text-[#181818] leading-snug mb-2">{product.name}</h1>

                                        {product.subtitle && <p className="text-xs sm:text-sm text-[#66635F] mb-4 leading-relaxed">{product.subtitle}</p>}

                                        <div className="mb-4">
                                            <div className="flex items-baseline gap-3 flex-wrap">
                                                <span className="text-2xl sm:text-3xl font-black text-[#181818]">&#8358;{product.currentPrice.toLocaleString()}</span>
                                                {product.priceSale && (
                                                    <>
                                                        <span className="text-base text-[#66635F] line-through">&#8358;{product.priceRegular.toLocaleString()}</span>
                                                        <span className="bg-[#181818] text-white text-xs font-extrabold px-2 py-0.5 rounded">-{product.discountPct}%</span>
                                                    </>
                                                )}
                                            </div>
                                            {product.priceSale && <p className="text-xs font-bold text-[#181818] mt-1">You save &#8358;{(product.priceRegular - product.priceSale).toLocaleString()}</p>}
                                            <p className="text-[11px] text-[#66635F] mt-1 flex items-center gap-1">
                                                <CheckCircle size={12} className="text-[#181818]" />
                                                {product.stock > 0 ? 'In stock · Ready for dispatch' : 'Made to order'}
                                            </p>
                                        </div>

                                        {(product.length || product.width) && (
                                            <div className="bg-[#E8E5E0] rounded p-2.5 text-xs text-[#66635F] mb-4 flex items-center gap-2 border border-[#D4D0C9]">
                                                <Info size={14} className="text-[#66635F]" />
                                                <span>
                                                    Dimensions: {product.length ? `${product.length}cm L` : ''}
                                                    {product.length && product.width ? ' x ' : ''}
                                                    {product.width ? `${product.width}cm W` : ''} &middot; Standard Card Profile
                                                </span>
                                            </div>
                                        )}
                                    </div>

                                    <ProductActions
                                        productId={product.id}
                                        slug={product.slug}
                                        name={product.name}
                                        image={product.images[0] || null}
                                        unitPrice={product.currentPrice}
                                        customizationPrice={product.customizationPrice}
                                        colors={product.colors}
                                    />
                                </div>
                            </div>

                            {product.description && (
                                <div className="mt-10 pt-8 border-t border-[#D4D0C9]">
                                    <h3 className="text-base font-bold text-[#181818] uppercase tracking-wider mb-3">Product Description &amp; Technical Specifications</h3>
                                    <div className="text-xs sm:text-sm text-[#66635F] leading-relaxed space-y-3 max-w-3xl">
                                        <p>{product.description}</p>
                                        <p>
                                            All TapConnect smart cards and wearables utilize high-frequency induction transponders compatible with iPhone XS and newer, and all NFC-enabled Android devices. No battery or
                                            charging required. Profiles can be edited and updated anytime through your free TapConnect online dashboard.
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="space-y-4">
                            <div className="bg-white rounded-lg border border-[#D4D0C9] shadow-sm p-4 text-xs space-y-4">
                                <h3 className="font-bold text-[#181818] uppercase tracking-wider text-[11px] pb-2 border-b border-[#D4D0C9]">DELIVERY &amp; RETURNS</h3>

                                <div className="flex items-start gap-3">
                                    <span className="p-2 rounded-md bg-[#E8E5E0] text-[#181818] shrink-0 mt-0.5">
                                        <Truck size={18} />
                                    </span>
                                    <div>
                                        <p className="font-bold text-[#181818]">Door Delivery</p>
                                        <p className="text-[#66635F] mt-0.5 leading-snug">Delivery across Lagos (1-2 days), Abuja, Port Harcourt &amp; Nationwide (2-4 days).</p>
                                        <p className="font-semibold text-[#181818] mt-1">Free shipping on orders over &#8358;30,000</p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-3 pt-2 border-t border-[#D4D0C9]">
                                    <span className="p-2 rounded-md bg-[#E8E5E0] text-[#181818] shrink-0 mt-0.5">
                                        <RefreshCw size={18} />
                                    </span>
                                    <div>
                                        <p className="font-bold text-[#181818]">7-Day Free Replacement</p>
                                        <p className="text-[#66635F] mt-0.5 leading-snug">If any smart card has an NFC defect, we replace it immediately for free.</p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-3 pt-2 border-t border-[#D4D0C9]">
                                    <span className="p-2 rounded-md bg-[#E8E5E0] text-[#181818] shrink-0 mt-0.5">
                                        <CreditCard size={18} />
                                    </span>
                                    <div>
                                        <p className="font-bold text-[#181818]">100% Secure Checkout</p>
                                        <p className="text-[#66635F] mt-0.5 leading-snug">Powered by Paystack with 256-bit bank encryption.</p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white rounded-lg border border-[#D4D0C9] shadow-sm p-4 text-xs space-y-3">
                                <h3 className="font-bold text-[#181818] uppercase tracking-wider text-[11px] pb-2 border-b border-[#D4D0C9]">SELLER INFORMATION</h3>
                                <div>
                                    <p className="font-extrabold text-[#181818] text-sm">TapConnect Official Store</p>
                                    <p className="text-[#66635F] text-[11px]">Certified Smart Hardware Manufacturer</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {relatedProducts.length > 0 && (
                        <div className="mt-8 bg-white rounded-lg border border-[#D4D0C9] shadow-sm p-4 sm:p-6">
                            <div className="flex items-center justify-between mb-4 pb-2 border-b border-[#D4D0C9]">
                                <h2 className="text-base sm:text-lg font-bold text-[#181818] flex items-center gap-2">
                                    <Sparkles size={18} className="text-[#181818]" />
                                    Customers Also Viewed
                                </h2>
                                <Link href="/marketplace#catalog" className="text-xs font-bold text-[#181818] hover:underline uppercase">
                                    See All Products &rarr;
                                </Link>
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
                                {relatedProducts.map((p) => (
                                    <ProductCard key={p.id} p={p} layout="grid" />
                                ))}
                            </div>
                        </div>
                    )}
                </main>
            </div>
        </>
    );
}
