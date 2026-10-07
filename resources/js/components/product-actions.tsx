import { useState } from 'react';
import { router } from '@inertiajs/react';
import { Minus, Plus, ShoppingCart, Zap, Check } from 'lucide-react';
import { addToCart } from '@/lib/cart';
import { ImageUploader } from '@/components/image-uploader';

export function ProductActions({
    productId,
    slug,
    name,
    image,
    unitPrice,
    customizationPrice,
    colors,
}: {
    productId: number;
    slug: string;
    name: string;
    image: string | null;
    unitPrice: number;
    customizationPrice: number;
    colors: string[];
}) {
    const [color, setColor] = useState(colors[0] || '');
    const [customization, setCustomization] = useState(false);
    const [customizationNotes, setCustomizationNotes] = useState('');
    const [customizationFileUrl, setCustomizationFileUrl] = useState('');
    const [quantity, setQuantity] = useState(1);
    const [added, setAdded] = useState(false);

    const handleAdd = () => {
        addToCart({
            productId,
            name,
            slug,
            image,
            unitPrice,
            color: color || undefined,
            customization,
            customizationPrice,
            customizationNotes: customization ? customizationNotes || undefined : undefined,
            customizationFileUrl: customization ? customizationFileUrl || undefined : undefined,
            quantity,
        });
        setAdded(true);
        setTimeout(() => setAdded(false), 1600);
    };

    const handleBuyNow = () => {
        handleAdd();
        router.visit('/checkout');
    };

    return (
        <div className="space-y-5 pt-3 border-t border-[#D4D0C9]">
            {colors.length > 0 && (
                <div>
                    <p className="text-xs font-bold text-[#181818] uppercase tracking-wider mb-2">
                        Select Color / Finish: <span className="text-[#181818]">{color}</span>
                    </p>
                    <div className="flex flex-wrap gap-2">
                        {colors.map((c) => (
                            <button
                                key={c}
                                onClick={() => setColor(c)}
                                className={`px-3 py-1.5 rounded-md border text-xs font-semibold transition-all ${
                                    color === c ? 'border-[#181818] bg-[#E8E5E0] text-[#181818] ring-1 ring-[#181818]' : 'border-[#D4D0C9] text-[#181818] hover:border-[#181818] bg-white'
                                }`}
                            >
                                {c}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {customizationPrice > 0 && (
                <div className="bg-[#E8E5E0] rounded-lg p-3.5 border border-[#D4D0C9]">
                    <label className="flex items-center gap-2.5 cursor-pointer select-none">
                        <input type="checkbox" checked={customization} onChange={(e) => setCustomization(e.target.checked)} className="w-4 h-4 accent-[#181818] rounded" />
                        <span className="text-xs sm:text-sm font-bold text-[#181818]">Add Custom Name / Logo Engraving (+&#8358;{customizationPrice.toLocaleString()})</span>
                    </label>

                    {customization && (
                        <div className="mt-3 space-y-2.5 pl-6 border-l-2 border-[#181818]">
                            <textarea
                                value={customizationNotes}
                                onChange={(e) => setCustomizationNotes(e.target.value)}
                                placeholder="Enter custom text, full name, or job title to be engraved..."
                                className="w-full text-xs px-3 py-2 rounded-md bg-white border border-[#D4D0C9] outline-none focus:border-[#181818] min-h-[60px]"
                            />
                            <div className="flex items-center gap-2">
                                {customizationFileUrl && <img src={customizationFileUrl} alt="Design upload" className="w-10 h-10 rounded object-cover border border-[#D4D0C9]" />}
                                <ImageUploader
                                    label={customizationFileUrl ? 'Replace Logo File' : 'Upload Vector / PNG Logo'}
                                    onUploaded={setCustomizationFileUrl}
                                    className="bg-white border border-[#D4D0C9] text-[#181818] px-3 py-1.5 rounded-md font-bold text-xs hover:bg-[#E8E5E0] flex items-center gap-1 shadow-xs"
                                />
                            </div>
                        </div>
                    )}
                </div>
            )}

            <div className="flex items-center gap-4">
                <span className="text-xs font-bold text-[#181818] uppercase tracking-wider">Quantity:</span>
                <div className="flex items-center border border-[#D4D0C9] rounded-md overflow-hidden bg-white">
                    <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="w-8 h-8 flex items-center justify-center hover:bg-[#E8E5E0] text-[#66635F] transition-colors" aria-label="Decrease quantity">
                        <Minus size={14} />
                    </button>
                    <span className="w-10 text-center font-bold text-xs sm:text-sm">{quantity}</span>
                    <button onClick={() => setQuantity(quantity + 1)} className="w-8 h-8 flex items-center justify-center hover:bg-[#E8E5E0] text-[#66635F] transition-colors" aria-label="Increase quantity">
                        <Plus size={14} />
                    </button>
                </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <button
                    onClick={handleAdd}
                    className={`flex-1 flex items-center justify-center gap-2 py-3.5 px-6 rounded-md font-extrabold text-sm uppercase tracking-wider transition-all duration-200 shadow-sm active:scale-[0.98] ${
                        added ? 'bg-[#181818] text-white' : 'bg-[#181818] hover:bg-[#181818] text-white hover:shadow-md'
                    }`}
                >
                    {added ? (
                        <>
                            <Check size={18} className="stroke-[3]" /> Added to Cart
                        </>
                    ) : (
                        <>
                            <ShoppingCart size={18} /> Add to Cart
                        </>
                    )}
                </button>
                <button onClick={handleBuyNow} className="flex-1 flex items-center justify-center gap-2 bg-[#181818] hover:bg-[#181818]/90 text-white py-3.5 px-6 rounded-md font-extrabold text-sm uppercase tracking-wider transition-colors shadow-sm active:scale-[0.98]">
                    <Zap size={18} className="fill-[#FFFFFF] text-[#FFFFFF]" /> Buy Now
                </button>
            </div>
        </div>
    );
}
