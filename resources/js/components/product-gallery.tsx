import { useState } from 'react';
import { fallbackVisual, getCategoryVisual } from '@/lib/productVisual';
import { ImageWithFallback } from '@/components/image-with-fallback';

export function ProductGallery({ images, category, productName }: { images: string[]; category: string; productName: string }) {
    const [active, setActive] = useState(0);
    const selected = images[active];
    const fallback = fallbackVisual(category);
    const catVisual = getCategoryVisual(category);
    const CategoryIcon = catVisual.icon;

    const iconFallback = (
        <div className="w-24 h-24 rounded-3xl bg-white shadow-md flex items-center justify-center">
            <CategoryIcon size={44} style={{ color: catVisual.accentColor }} />
        </div>
    );

    return (
        <div>
            <div className="aspect-square bg-[#E8E5E0] rounded-2xl border border-[#D4D0C9] shadow-sm flex items-center justify-center overflow-hidden">
                <ImageWithFallback
                    src={selected ?? ('photo' in fallback ? fallback.photo : null)}
                    alt={productName}
                    className="w-full h-full object-cover"
                    fallback={iconFallback}
                />
            </div>

            {images.length > 1 && (
                <div className="grid grid-cols-6 gap-2 mt-3">
                    {images.map((img, i) => (
                        <button key={img} onClick={() => setActive(i)} className={`aspect-square rounded-lg overflow-hidden border-2 transition-colors ${active === i ? 'border-[#181818]' : 'border-transparent hover:border-[#D4D0C9]'}`}>
                            <ImageWithFallback
                                src={img}
                                alt={`${productName} ${i + 1}`}
                                className="w-full h-full object-cover"
                                fallback={<div className="w-full h-full bg-[#E8E5E0] flex items-center justify-center"><CategoryIcon size={16} style={{ color: catVisual.accentColor }} /></div>}
                            />
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
