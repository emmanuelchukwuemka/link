import { useState, useEffect } from 'react';
import { Head, Link } from '@inertiajs/react';
import { getCart, cartTotal, clearCart, type CartItem } from '@/lib/cart';
import { ShopHeader } from '@/components/shop-header';
import { apiFetch } from '@/lib/api';

type DeliveryZone = { id: number; name: string; fee: number };

export default function CheckoutPage() {
    const [items, setItems] = useState<CartItem[]>([]);
    const [zones, setZones] = useState<DeliveryZone[]>([]);
    const [form, setForm] = useState({
        customerName: '',
        customerEmail: '',
        customerPhone: '',
        state: '',
        city: '',
        address: '',
        deliveryInstructions: '',
    });
    const [deliveryPaymentMethod, setDeliveryPaymentMethod] = useState<'prepaid' | 'cash_on_delivery'>('prepaid');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        setItems(getCart());
        fetch('/api/delivery-zones')
            .then((res) => res.json())
            .then((data) => {
                if (data.zones) setZones(data.zones);
            });
        fetch('/api/auth/me')
            .then((res) => res.json())
            .then((data) => {
                if (data.user) {
                    setForm((f) => ({
                        ...f,
                        customerName: f.customerName || data.user.name || '',
                        customerEmail: f.customerEmail || data.user.email || '',
                        customerPhone: f.customerPhone || data.user.phone || '',
                    }));
                }
            })
            .catch(() => {});
    }, []);

    const subtotal = cartTotal(items);
    const zone = zones.find((z) => z.name.toLowerCase() === form.city.trim().toLowerCase());
    const deliveryFee = zone?.fee ?? zones.find((z) => z.name === 'Other')?.fee ?? 0;
    const total = subtotal + deliveryFee;
    const chargeNow = deliveryPaymentMethod === 'cash_on_delivery' ? subtotal : total;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const { ok, data } = await apiFetch('/api/orders', {
                items: items.map((i) => ({
                    productId: i.productId,
                    color: i.color,
                    customization: i.customization,
                    quantity: i.quantity,
                    customizationNotes: i.customizationNotes,
                    customizationFileUrl: i.customizationFileUrl,
                })),
                ...form,
                deliveryPaymentMethod: deliveryFee > 0 ? deliveryPaymentMethod : 'prepaid',
            });
            if (!ok) throw new Error((data.error as string) || 'Could not place order');

            clearCart();

            if (data.authorizationUrl) {
                window.location.href = data.authorizationUrl as string;
            } else {
                const order = data.order as { orderNumber: string };
                window.location.href = `/orders/${order.orderNumber}`;
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Something went wrong');
            setLoading(false);
        }
    };

    if (items.length === 0) {
        return (
            <>
                <Head title="Checkout | TapConnect" />
                <div className="min-h-screen bg-[#E8E5E0]">
                    <ShopHeader />
                    <div className="pt-24 px-4 text-center">
                        <h1 className="text-2xl font-bold text-[#181818] mb-3">Your cart is empty</h1>
                        <div className="flex items-center justify-center gap-4 text-sm">
                            <Link href="/" className="text-[#66635F] font-semibold hover:text-black hover:underline">
                                Go home
                            </Link>
                            <span className="text-[#D4D0C9]">&middot;</span>
                            <Link href="/marketplace" className="text-black font-semibold hover:underline">
                                Browse the marketplace
                            </Link>
                        </div>
                    </div>
                </div>
            </>
        );
    }

    return (
        <>
            <Head title="Checkout | TapConnect" />
            <div className="min-h-screen bg-[#E8E5E0]">
                <ShopHeader />
                <div className="max-w-3xl mx-auto pt-16 pb-20 px-4 grid md:grid-cols-[1fr_320px] gap-8 items-start">
                    <form onSubmit={handleSubmit} className="bg-white rounded-3xl p-6 shadow-sm space-y-4 min-w-0">
                        <h1 className="text-2xl font-bold mb-2">Checkout</h1>

                        {error && <div className="bg-red-50 text-red-500 p-3 rounded-lg text-sm">{error}</div>}

                        <div className="grid sm:grid-cols-2 gap-3">
                            <input required placeholder="Full name" value={form.customerName} onChange={(e) => setForm({ ...form, customerName: e.target.value })} className="px-4 py-3 rounded-lg bg-[#E8E5E0] outline-none" />
                            <input
                                required
                                type="tel"
                                placeholder="Phone number"
                                value={form.customerPhone}
                                onChange={(e) => setForm({ ...form, customerPhone: e.target.value })}
                                className="px-4 py-3 rounded-lg bg-[#E8E5E0] outline-none"
                            />
                        </div>
                        <input required type="email" placeholder="Email" value={form.customerEmail} onChange={(e) => setForm({ ...form, customerEmail: e.target.value })} className="w-full px-4 py-3 rounded-lg bg-[#E8E5E0] outline-none" />

                        <div className="grid sm:grid-cols-2 gap-3">
                            <input required placeholder="State" value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} className="px-4 py-3 rounded-lg bg-[#E8E5E0] outline-none" />
                            <input
                                required
                                list="city-zones"
                                placeholder="City"
                                value={form.city}
                                onChange={(e) => setForm({ ...form, city: e.target.value })}
                                className="px-4 py-3 rounded-lg bg-[#E8E5E0] outline-none"
                            />
                            <datalist id="city-zones">
                                {zones.map((z) => (
                                    <option key={z.id} value={z.name} />
                                ))}
                            </datalist>
                        </div>

                        <textarea required placeholder="Delivery address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="w-full px-4 py-3 rounded-lg bg-[#E8E5E0] outline-none min-h-[80px]" />
                        <textarea
                            placeholder="Additional delivery instructions (optional)"
                            value={form.deliveryInstructions}
                            onChange={(e) => setForm({ ...form, deliveryInstructions: e.target.value })}
                            className="w-full px-4 py-3 rounded-lg bg-[#E8E5E0] outline-none min-h-[60px]"
                        />

                        {deliveryFee > 0 && (
                            <div>
                                <p className="text-sm font-semibold text-[#181818] mb-2">How do you want to pay?</p>
                                <div className="space-y-2">
                                    <label className={`flex items-center justify-between gap-3 px-4 py-3 rounded-lg border cursor-pointer ${deliveryPaymentMethod === 'prepaid' ? 'border-[#181818] bg-[#E8E5E0]' : 'border-[#D4D0C9]'}`}>
                                        <span className="flex items-center gap-3">
                                            <input type="radio" name="deliveryPaymentMethod" checked={deliveryPaymentMethod === 'prepaid'} onChange={() => setDeliveryPaymentMethod('prepaid')} className="accent-[#181818]" />
                                            <span className="text-sm">
                                                Pay product + delivery now
                                                <span className="block text-xs text-[#66635F]">One payment, nothing to pay on arrival.</span>
                                            </span>
                                        </span>
                                        <span className="font-semibold text-sm whitespace-nowrap">&#8358;{total.toLocaleString()}</span>
                                    </label>
                                    <label className={`flex items-center justify-between gap-3 px-4 py-3 rounded-lg border cursor-pointer ${deliveryPaymentMethod === 'cash_on_delivery' ? 'border-[#181818] bg-[#E8E5E0]' : 'border-[#D4D0C9]'}`}>
                                        <span className="flex items-center gap-3">
                                            <input type="radio" name="deliveryPaymentMethod" checked={deliveryPaymentMethod === 'cash_on_delivery'} onChange={() => setDeliveryPaymentMethod('cash_on_delivery')} className="accent-[#181818]" />
                                            <span className="text-sm">
                                                Pay for the product only now
                                                <span className="block text-xs text-[#66635F]">Pay &#8358;{deliveryFee.toLocaleString()} delivery fee in cash when it arrives.</span>
                                            </span>
                                        </span>
                                        <span className="font-semibold text-sm whitespace-nowrap">&#8358;{subtotal.toLocaleString()}</span>
                                    </label>
                                </div>
                            </div>
                        )}

                        <button type="submit" disabled={loading} className="w-full bg-[#181818] text-white py-4 rounded-full font-semibold text-lg hover:bg-[#181818]/90 disabled:opacity-60">
                            {loading ? 'Placing order...' : `Pay ₦${chargeNow.toLocaleString()}`}
                        </button>
                    </form>

                    <div className="bg-white rounded-3xl p-6 shadow-sm space-y-3">
                        <h2 className="font-bold text-lg mb-2">Order Summary</h2>
                        {items.map((item, i) => (
                            <div key={i} className="flex justify-between text-sm">
                                <span className="text-[#66635F]">
                                    {item.name} &times;{item.quantity}
                                </span>
                                <span className="font-medium">&#8358;{((item.unitPrice + (item.customization ? item.customizationPrice : 0)) * item.quantity).toLocaleString()}</span>
                            </div>
                        ))}
                        <div className="border-t border-[#D4D0C9] pt-3 flex justify-between text-sm">
                            <span className="text-[#66635F]">Delivery</span>
                            <span className={`font-medium ${deliveryFee === 0 ? 'text-green-600' : ''}`}>{deliveryFee === 0 ? 'Free' : `₦${deliveryFee.toLocaleString()}`}</span>
                        </div>
                        <div className="flex justify-between font-bold text-lg pt-2 border-t border-[#D4D0C9]">
                            <span>Total</span>
                            <span>&#8358;{total.toLocaleString()}</span>
                        </div>
                        {deliveryFee > 0 && deliveryPaymentMethod === 'cash_on_delivery' && (
                            <div className="text-xs text-[#66635F] space-y-0.5 pt-1">
                                <div className="flex justify-between">
                                    <span>Pay now</span>
                                    <span className="font-semibold">&#8358;{subtotal.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Due on delivery (cash)</span>
                                    <span className="font-semibold">&#8358;{deliveryFee.toLocaleString()}</span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}
