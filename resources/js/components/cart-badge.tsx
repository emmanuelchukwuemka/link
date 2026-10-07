import { useState, useEffect } from 'react';
import { Link } from '@inertiajs/react';
import { ShoppingCart } from 'lucide-react';
import { getCart, cartCount } from '@/lib/cart';

export function CartBadge({ invert = false, accent = false }: { invert?: boolean; accent?: boolean }) {
    const [count, setCount] = useState(0);

    useEffect(() => {
        const update = () => setCount(cartCount(getCart()));
        update();
        window.addEventListener('cart-updated', update);
        return () => window.removeEventListener('cart-updated', update);
    }, []);

    const badgeClasses = accent ? 'bg-[#22C55E] text-white' : invert ? 'bg-black text-white' : 'bg-white text-black';

    return (
        <Link href="/cart" className={`relative p-2 rounded-full transition-colors ${invert ? 'hover:bg-black/5' : 'hover:bg-white/10'}`} aria-label="View cart">
            <ShoppingCart size={20} strokeWidth={1.75} className={invert ? 'text-black' : 'text-white'} />
            {count > 0 && (
                <span className={`absolute -top-0.5 -right-0.5 w-4 h-4 text-[10px] font-bold rounded-full flex items-center justify-center ${badgeClasses}`}>
                    {count > 9 ? '9+' : count}
                </span>
            )}
        </Link>
    );
}
