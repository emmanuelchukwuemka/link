import { useState, useEffect, useCallback } from 'react';
import { Head, Link } from '@inertiajs/react';
import { CheckCircle2, Circle, PackageCheck } from 'lucide-react';
import { apiFetch } from '@/lib/api';

type OrderItemData = {
    id: number;
    quantity: number;
    unit_price: number;
    color: string | null;
    customization: boolean;
    product: { name: string };
};

type OrderData = {
    id: number;
    order_number: string;
    status: string;
    payment_status: string;
    profile_setup_required: boolean;
    total: number;
    delivery_fee: number;
    subtotal: number;
    courier_name: string | null;
    tracking_number: string | null;
    customer_name: string;
    customer_email: string;
    items: OrderItemData[];
};

const STEPS = [
    { key: 'order_placed', label: 'Order Placed' },
    { key: 'payment_confirmed', label: 'Payment Confirmed' },
    { key: 'profile_completed', label: 'Profile Completed' },
    { key: 'preparing', label: 'Preparing Your Card' },
    { key: 'in_production', label: 'In Production' },
    { key: 'quality_check', label: 'Quality Check' },
    { key: 'shipped', label: 'Shipped' },
    { key: 'out_for_delivery', label: 'Out for Delivery' },
    { key: 'delivered', label: 'Delivered' },
    { key: 'activated', label: 'Card Activated' },
];

const STATUS_ORDER = STEPS.map((s) => s.key);

export default function OrderTrackingPage({ orderNumber }: { orderNumber: string }) {
    const [order, setOrder] = useState<OrderData | null>(null);
    const [authed, setAuthed] = useState<boolean | null>(null);
    const [loading, setLoading] = useState(true);
    const [completing, setCompleting] = useState(false);

    const load = useCallback(async () => {
        const [orderRes, meRes] = await Promise.all([fetch(`/api/orders/${orderNumber}`), fetch('/api/auth/me')]);
        const orderData = await orderRes.json();
        if (orderData.order) {
            setOrder(orderData.order);
        }
        setAuthed(meRes.ok);
        setLoading(false);
    }, [orderNumber]);

    useEffect(() => {
        load();
    }, [load]);

    const handleCompleteProfile = async () => {
        setCompleting(true);
        const { ok } = await apiFetch(`/api/orders/${orderNumber}/complete-profile`, undefined, 'PATCH');
        if (ok) await load();
        setCompleting(false);
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center text-gray-500">Loading...</div>;
    if (!order) return <div className="min-h-screen flex items-center justify-center text-gray-500">Order not found.</div>;

    const currentIndex = order.payment_status !== 'paid' ? 0 : STATUS_ORDER.indexOf(order.status);

    return (
        <>
            <Head title={`Order #${order.order_number} | TapConnect`} />
            <div className="min-h-screen bg-gray-50 pt-32 pb-20 px-4">
                <div className="max-w-2xl mx-auto space-y-8">
                    <div className="flex items-end justify-between">
                        <div>
                            <p className="text-sm text-gray-500">Order</p>
                            <h1 className="text-2xl font-bold">#{order.order_number}</h1>
                        </div>
                        {order.payment_status === 'paid' && (
                            <Link href={`/orders/${order.order_number}/receipt`} className="text-sm font-semibold text-black underline">
                                View Receipt
                            </Link>
                        )}
                    </div>

                    {order.payment_status === 'pending' && (
                        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5 text-blue-800 text-sm">
                            Waiting for payment confirmation. This page updates automatically once Paystack confirms your payment.
                        </div>
                    )}

                    {order.payment_status === 'paid' && order.profile_setup_required && (
                        <div className="bg-black text-white rounded-2xl p-6">
                            <h2 className="font-bold text-lg mb-1">Set up your TapConnect profile</h2>
                            <p className="text-sm opacity-80 mb-4">Your card can&apos;t go into production until it&apos;s connected to a profile. This only takes a minute.</p>
                            {authed === false ? (
                                <div className="flex gap-3">
                                    <Link href={`/login?next=/orders/${order.order_number}`} className="bg-white text-black px-5 py-2.5 rounded-full font-semibold">
                                        Log in
                                    </Link>
                                    <Link href={`/register?next=/orders/${order.order_number}`} className="bg-white/10 px-5 py-2.5 rounded-full font-semibold">
                                        Create account
                                    </Link>
                                </div>
                            ) : (
                                <div className="flex items-center gap-3 flex-wrap">
                                    <Link href="/dashboard/appearance" className="bg-white text-black px-5 py-2.5 rounded-full font-semibold">
                                        Edit my profile
                                    </Link>
                                    <button onClick={handleCompleteProfile} disabled={completing} className="bg-[#B8B8B8] text-[#000000] px-5 py-2.5 rounded-full font-semibold disabled:opacity-60">
                                        {completing ? 'Saving...' : 'My profile is ready — continue'}
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    <div className="bg-white rounded-3xl p-6 shadow-sm">
                        <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
                            <PackageCheck size={18} /> Order Status
                        </h2>
                        <div className="space-y-3">
                            {STEPS.map((step, i) => {
                                const done = i < currentIndex || (i === currentIndex && order.payment_status === 'paid' && !order.profile_setup_required);
                                const current = i === currentIndex;
                                return (
                                    <div key={step.key} className={`flex items-center gap-3 ${done ? 'text-black' : current ? 'text-[#6B6B6B] font-semibold' : 'text-gray-300'}`}>
                                        {done ? <CheckCircle2 size={18} className="text-green-500" /> : <Circle size={18} />}
                                        {step.label}
                                    </div>
                                );
                            })}
                        </div>
                        {order.tracking_number && (
                            <p className="text-sm text-gray-500 mt-4 pt-4 border-t border-gray-100">
                                {order.courier_name}: <span className="font-mono">{order.tracking_number}</span>
                            </p>
                        )}
                    </div>

                    <div className="bg-white rounded-3xl p-6 shadow-sm">
                        <h2 className="font-bold text-lg mb-4">Items</h2>
                        <div className="space-y-2">
                            {order.items.map((item) => (
                                <div key={item.id} className="flex justify-between text-sm">
                                    <span className="text-gray-600">
                                        {item.product.name} {item.color ? `(${item.color})` : ''} &times;{item.quantity}
                                    </span>
                                    <span className="font-medium">&#8358;{(item.unit_price * item.quantity).toLocaleString()}</span>
                                </div>
                            ))}
                            <div className="flex justify-between text-sm pt-2 border-t border-gray-100">
                                <span className="text-gray-600">Delivery</span>
                                <span className="font-medium">&#8358;{order.delivery_fee.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between font-bold pt-2 border-t border-gray-100">
                                <span>Total</span>
                                <span>&#8358;{order.total.toLocaleString()}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
