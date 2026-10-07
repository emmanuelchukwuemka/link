import { Head, Link } from '@inertiajs/react';
import { CreditCard } from 'lucide-react';

export default function CardNotActive() {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4 text-center">
            <Head title="Card not active" />
            <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mb-6">
                <CreditCard size={28} className="text-gray-500" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">This card isn&apos;t active</h1>
            <p className="text-gray-500 max-w-md mb-8">
                This TapConnect card has been deactivated or doesn&apos;t exist. If you believe this is a mistake, contact the card owner or
                TapConnect support.
            </p>
            <Link href="/" className="bg-black text-white px-6 py-3 rounded-full font-semibold hover:bg-gray-800">
                Go to TapConnect
            </Link>
        </div>
    );
}
