import { Link } from '@inertiajs/react';
import { ShieldCheck } from 'lucide-react';
import { fallbackVisual, getCategoryVisual } from '@/lib/productVisual';
import { WishlistButton, AddToCartButton } from './marketplace-interactive';
import { ImageWithFallback } from '@/components/image-with-fallback';

export type GridProduct = {
    id: number;
    slug: string;
    name: string;
    subtitle: string | null;
    category: string;
    brand?: string;
    image: string | null;
    colors: string[];
    priceRegular: number;
    priceSale: number | null;
    customizationPrice: number;
    discountPct: number;
    isBestSeller: boolean;
    isNew: boolean;
    stock?: number;
    createdAt: number;
};

const SWATCH_COLORS: Record<string, string> = {
    Black: '#171717',
    'Matte Black': '#1C1917',
    'Stealth Black': '#000000',
    'Glossy Black': '#111827',
    White: '#FFFFFF',
    'Pearl White': '#F8FAFC',
    Brown: '#6B4226',
    'Cognac Brown': '#78350F',
    'Espresso Brown': '#451A03',
    Silver: '#B8B8B8',
    'Brushed Silver': '#94A3B8',
    Gold: '#CA8A04',
    '24K Mirror Gold': '#CA8A04',
    'Rose Gold': '#E11D48',
    'Natural Bamboo': '#B8875A',
    'Dark Walnut': '#593B2B',
    'Natural Cherry': '#9A3412',
    'Ebony Black': '#111111',
    'Emerald Green': '#059669',
    'Midnight Navy': '#1E3A8A',
    'Electric Blue': '#2563EB',
    'Signal Red': '#DC2626',
};

function swatchColor(name: string) {
    return SWATCH_COLORS[name] || '#D4D0C9';
}

export function ProductCard({ p, className = '', layout = 'grid' }: { p: GridProduct; className?: string; layout?: 'grid' | 'list' | 'flash' }) {
    const visual = p.image ? { photo: p.image } : fallbackVisual(p.category);
    const catVisual = getCategoryVisual(p.category);
    const CategoryIcon = catVisual.icon;
    const currentPrice = p.priceSale ?? p.priceRegular;
    const discount = p.discountPct;

    if (layout === 'flash') {
        return (
            <div className={`group bg-white rounded-lg border border-[#D4D0C9] shadow-xs hover:shadow-md transition-all flex flex-col p-3 ${className}`}>
                <div className="relative aspect-square rounded-md overflow-hidden bg-[#E8E5E0] flex items-center justify-center mb-2.5 border border-[#D4D0C9]/50">
                    <Link href={`/marketplace/${p.slug}`} className="w-full h-full flex items-center justify-center">
                        <ImageWithFallback
                            src={'photo' in visual ? visual.photo : null}
                            alt={p.name}
                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                            fallback={
                                <div className="w-16 h-16 rounded-full bg-white shadow-xs flex items-center justify-center text-[#181818]">
                                    <CategoryIcon size={28} className="text-[#181818]" />
                                </div>
                            }
                        />
                    </Link>

                    {discount > 0 && <span className="absolute top-2 left-2 bg-[#181818] text-white text-[11px] font-extrabold px-1.5 py-0.5 rounded shadow-xs">-{discount}%</span>}

                    <div className="absolute top-2 right-2">
                        <WishlistButton productId={p.id} />
                    </div>
                </div>

                <div className="flex flex-col flex-1">
                    <Link href={`/marketplace/${p.slug}`} className="text-xs sm:text-sm font-bold text-[#181818] hover:text-[#66635F] line-clamp-2 leading-snug mb-1 transition-colors">
                        {p.name}
                    </Link>

                    <div className="flex items-baseline gap-1.5 flex-wrap mb-1.5">
                        <span className="font-extrabold text-sm sm:text-base text-[#181818]">&#8358;{currentPrice.toLocaleString()}</span>
                        {p.priceSale && <span className="text-xs text-[#66635F] line-through">&#8358;{p.priceRegular.toLocaleString()}</span>}
                    </div>

                    <div className="mt-auto pt-2">
                        <AddToCartButton productId={p.id} name={p.name} slug={p.slug} image={p.image} unitPrice={currentPrice} customizationPrice={p.customizationPrice} color={p.colors[0]} />
                    </div>
                </div>
            </div>
        );
    }

    if (layout === 'list') {
        return (
            <div className={`group bg-white rounded-lg border border-[#D4D0C9] shadow-xs hover:shadow-md transition-all flex flex-col sm:flex-row p-3.5 sm:p-4 gap-4 ${className}`}>
                <div className="relative w-full sm:w-44 aspect-square rounded-md overflow-hidden bg-[#E8E5E0] shrink-0 flex items-center justify-center border border-[#D4D0C9]">
                    <Link href={`/marketplace/${p.slug}`} className="w-full h-full flex items-center justify-center">
                        <ImageWithFallback
                            src={'photo' in visual ? visual.photo : null}
                            alt={p.name}
                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                            fallback={
                                <div className="w-16 h-16 rounded-full bg-white shadow-xs flex items-center justify-center text-[#181818]">
                                    <CategoryIcon size={28} className="text-[#181818]" />
                                </div>
                            }
                        />
                    </Link>

                    {discount > 0 && <span className="absolute top-2 left-2 bg-[#181818] text-white text-[11px] font-extrabold px-1.5 py-0.5 rounded shadow-xs">-{discount}%</span>}

                    <div className="absolute top-2 right-2">
                        <WishlistButton productId={p.id} />
                    </div>
                </div>

                <div className="flex-1 flex flex-col justify-between min-w-0">
                    <div>
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span className="text-[11px] font-bold text-[#66635F] uppercase tracking-wide">{p.category}</span>
                            {p.brand && (
                                <span className="inline-flex items-center gap-0.5 bg-[#E8E5E0] text-[#66635F] text-[10px] font-medium px-1.5 py-0.5 rounded border border-[#D4D0C9]">
                                    <ShieldCheck size={10} /> {p.brand}
                                </span>
                            )}
                        </div>

                        <Link href={`/marketplace/${p.slug}`} className="text-base font-bold text-[#181818] hover:text-[#66635F] leading-snug line-clamp-1 mb-1 block transition-colors">
                            {p.name}
                        </Link>

                        {p.subtitle && <p className="text-xs text-[#66635F] line-clamp-2 mb-3 leading-relaxed">{p.subtitle}</p>}
                    </div>

                    <div className="flex items-center justify-between gap-4 pt-2 border-t border-[#D4D0C9] flex-wrap">
                        <div>
                            <div className="flex items-baseline gap-2">
                                <span className="font-extrabold text-xl text-[#181818]">&#8358;{currentPrice.toLocaleString()}</span>
                                {p.priceSale && <span className="text-sm text-[#66635F] line-through">&#8358;{p.priceRegular.toLocaleString()}</span>}
                            </div>
                            {p.priceSale && <p className="text-[11px] font-semibold text-[#181818]">Save &#8358;{(p.priceRegular - p.priceSale).toLocaleString()}</p>}
                        </div>

                        <div className="w-36">
                            <AddToCartButton productId={p.id} name={p.name} slug={p.slug} image={p.image} unitPrice={currentPrice} customizationPrice={p.customizationPrice} color={p.colors[0]} />
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className={`group bg-white rounded-lg border border-[#D4D0C9] shadow-xs hover:shadow-md transition-all duration-300 flex flex-col overflow-hidden relative ${className}`}>
            <div className="relative aspect-square bg-[#E8E5E0] flex items-center justify-center overflow-hidden border-b border-[#D4D0C9]">
                <Link href={`/marketplace/${p.slug}`} className="w-full h-full flex items-center justify-center">
                    <ImageWithFallback
                        src={'photo' in visual ? visual.photo : null}
                        alt={p.name}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        fallback={
                            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white shadow-xs border border-[#D4D0C9] flex items-center justify-center transition-transform duration-300 group-hover:scale-105">
                                <CategoryIcon size={32} className="text-[#181818]" />
                            </div>
                        }
                    />
                </Link>

                <div className="absolute top-2 left-2 flex flex-col gap-1 items-start pointer-events-none">
                    {discount > 0 && <span className="bg-[#181818] text-white text-[10px] sm:text-xs font-black px-1.5 py-0.5 rounded shadow-xs">-{discount}%</span>}
                    {p.isBestSeller && <span className="bg-[#181818] text-white text-[10px] font-bold px-1.5 py-0.5 rounded shadow-xs">BEST SELLER</span>}
                    {!p.isBestSeller && p.isNew && <span className="bg-[#E8E5E0] text-[#181818] border border-[#D4D0C9] text-[10px] font-bold px-1.5 py-0.5 rounded shadow-xs">NEW</span>}
                </div>

                <div className="absolute top-2 right-2 z-10">
                    <WishlistButton productId={p.id} />
                </div>

                <div className="absolute bottom-2 right-2 bg-[#181818]/75 backdrop-blur-xs text-[#FFFFFF] text-[9px] font-semibold px-1.5 py-0.5 rounded pointer-events-none flex items-center gap-1">
                    <CategoryIcon size={10} />
                    <span>{catVisual.badgeLabel}</span>
                </div>
            </div>

            <div className="p-3 sm:p-3.5 flex flex-col flex-1 justify-between bg-white">
                <div>
                    <div className="flex items-center justify-between gap-1 mb-1">
                        <span className="text-[10px] font-bold text-[#66635F] uppercase tracking-wider truncate">{p.category}</span>
                    </div>

                    <Link href={`/marketplace/${p.slug}`} className="font-bold text-xs sm:text-sm text-[#181818] hover:text-[#66635F] leading-snug line-clamp-2 mb-2 transition-colors block" title={p.name}>
                        {p.name}
                    </Link>

                    {p.colors && p.colors.length > 0 && (
                        <div className="flex items-center gap-1 mb-2.5">
                            {p.colors.slice(0, 4).map((c) => (
                                <span key={c} title={c} className="w-2.5 h-2.5 rounded-full ring-1 ring-[#181818]/20 shadow-xs" style={{ backgroundColor: swatchColor(c) }} />
                            ))}
                            {p.colors.length > 4 && <span className="text-[9px] text-[#66635F] font-bold">+{p.colors.length - 4}</span>}
                        </div>
                    )}
                </div>

                <div className="pt-2 border-t border-[#D4D0C9]">
                    <div className="flex items-baseline gap-1.5 mb-2.5 flex-wrap">
                        <span className="font-extrabold text-sm sm:text-base text-[#181818]">&#8358;{currentPrice.toLocaleString()}</span>
                        {p.priceSale && <span className="text-[11px] sm:text-xs text-[#66635F] line-through">&#8358;{p.priceRegular.toLocaleString()}</span>}
                    </div>

                    <AddToCartButton productId={p.id} name={p.name} slug={p.slug} image={p.image} unitPrice={currentPrice} customizationPrice={p.customizationPrice} color={p.colors[0]} />
                </div>
            </div>
        </div>
    );
}
