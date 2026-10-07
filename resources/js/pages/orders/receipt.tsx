import { useState, useEffect } from 'react';
import { Head } from '@inertiajs/react';
import { Printer } from 'lucide-react';

type ReceiptOrder = {
    order_number: string;
    customer_name: string;
    customer_email: string;
    customer_phone: string;
    address: string;
    city: string;
    state: string;
    subtotal: number;
    delivery_fee: number;
    total: number;
    payment_status: string;
    created_at: string;
    items: { id: number; quantity: number; unit_price: number; color: string | null; product: { name: string } }[];
    payments: { reference: string; provider: string; status: string; amount: number; created_at: string }[];
};

export default function ReceiptPage({ orderNumber }: { orderNumber: string }) {
    const [order, setOrder] = useState<ReceiptOrder | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch(`/api/orders/${orderNumber}`)
            .then((res) => res.json())
            .then((data) => {
                if (data.order) setOrder(data.order);
                setLoading(false);
            });
    }, [orderNumber]);

    if (loading) return <div className="min-h-screen flex items-center justify-center text-gray-500">Loading...</div>;
    if (!order) return <div className="min-h-screen flex items-center justify-center text-gray-500">Order not found.</div>;

    const payment = order.payments.find((p) => p.status === 'success');

    return (
        <>
            <Head title={`Receipt — Order #${order.order_number} | TapConnect`} />
            <div className="min-h-screen bg-gray-50 py-12 px-4 print:bg-white print:py-0">
                <div className="max-w-xl mx-auto bg-white rounded-3xl shadow-sm p-8 print:shadow-none print:rounded-none">
                    <div className="flex justify-between items-start mb-8">
                        <div>
                            <h1 className="text-2xl font-bold">TapConnect</h1>
                            <p className="text-sm text-gray-500">Payment Receipt</p>
                        </div>
                        <button onClick={() => window.print()} className="print:hidden flex items-center gap-2 text-sm font-semibold bg-black text-white px-4 py-2 rounded-full hover:bg-gray-800">
                            <Printer size={16} /> Print
                        </button>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm mb-8">
                        <div>
                            <p className="text-gray-500">Order Number</p>
                            <p className="font-semibold">#{order.order_number}</p>
                        </div>
                        <div>
                            <p className="text-gray-500">Date</p>
                            <p className="font-semibold">{new Date(order.created_at).toLocaleDateString()}</p>
                        </div>
                        <div>
                            <p className="text-gray-500">Customer</p>
                            <p className="font-semibold">{order.customer_name}</p>
                        </div>
                        <div>
                            <p className="text-gray-500">Payment Status</p>
                            <p className={`font-semibold capitalize ${order.payment_status === 'paid' ? 'text-green-600' : 'text-amber-600'}`}>{order.payment_status}</p>
                        </div>
                        {payment && (
                            <>
                                <div>
                                    <p className="text-gray-500">Payment Reference</p>
                                    <p className="font-mono text-xs">{payment.reference}</p>
                                </div>
                                <div>
                                    <p className="text-gray-500">Provider</p>
                                    <p className="font-semibold capitalize">{payment.provider}</p>
                                </div>
                            </>
                        )}
                    </div>

                    <div className="border-t border-gray-100 pt-4 space-y-2 mb-4">
                        {order.items.map((item) => (
                            <div key={item.id} className="flex justify-between text-sm">
                                <span className="text-gray-600">
                                    {item.product.name}
                                    {item.color ? ` (${item.color})` : ''} &times;{item.quantity}
                                </span>
                                <span className="font-medium">&#8358;{(item.unit_price * item.quantity).toLocaleString()}</span>
                            </div>
                        ))}
                    </div>

                    <div className="border-t border-gray-100 pt-4 space-y-2">
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Subtotal</span>
                            <span>&#8358;{order.subtotal.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-600">
                                Delivery ({order.city}, {order.state})
                            </span>
                            <span>&#8358;{order.delivery_fee.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between font-bold text-lg pt-2 border-t border-gray-100">
                            <span>Total Paid</span>
                            <span>&#8358;{order.total.toLocaleString()}</span>
                        </div>
                    </div>

                    <p className="text-xs text-gray-400 mt-8 text-center">Thank you for your order. This receipt was generated by TapConnect.</p>
                </div>
            </div>
        </>
    );
}
