import { Head, Link, router } from '@inertiajs/react';
import { CreditCard, CheckCircle2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { apiFetch } from '@/lib/api';

export default function ActivateCard() {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code') || '';
    const [authed, setAuthed] = useState<boolean | null>(null);
    const [status, setStatus] = useState<'idle' | 'claiming' | 'done' | 'error'>('idle');
    const [error, setError] = useState('');

    useEffect(() => {
        fetch('/api/auth/me', { credentials: 'same-origin', headers: { Accept: 'application/json' } })
            .then((res) => setAuthed(res.ok))
            .catch(() => setAuthed(false));
    }, []);

    const handleClaim = async () => {
        setStatus('claiming');
        setError('');
        try {
            const { ok, data } = await apiFetch('/api/cards/claim', { code });
            if (!ok) throw new Error((data.error as string) || 'Could not connect this card');
            setStatus('done');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Something went wrong');
            setStatus('error');
        }
    };

    const next = `/activate-card?code=${encodeURIComponent(code)}`;

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4 text-center">
            <Head title="Activate your card" />
            <div className="w-16 h-16 bg-black/10 rounded-full flex items-center justify-center mb-6">
                <CreditCard size={28} className="text-black" />
            </div>

            {status === 'done' ? (
                <>
                    <CheckCircle2 size={40} className="text-green-500 mb-4" />
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">Card connected!</h1>
                    <p className="text-gray-500 max-w-md mb-8">This card now opens your TapConnect profile whenever it&apos;s tapped or scanned.</p>
                    <button
                        onClick={() => router.visit('/dashboard/cards')}
                        className="bg-black text-white px-6 py-3 rounded-full font-semibold hover:bg-gray-800"
                    >
                        Go to my cards
                    </button>
                </>
            ) : (
                <>
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">This card isn&apos;t connected yet</h1>
                    <p className="text-gray-500 max-w-md mb-2">
                        Card code: <span className="font-mono font-semibold">{code || 'unknown'}</span>
                    </p>
                    <p className="text-gray-500 max-w-md mb-8">Connect it to your TapConnect profile so anyone who taps or scans it lands on your page.</p>

                    {error && <div className="bg-red-50 text-red-500 px-4 py-2 rounded-lg mb-4 text-sm">{error}</div>}

                    {authed === false ? (
                        <div className="flex gap-3">
                            <Link href={`/login?next=${encodeURIComponent(next)}`} className="bg-black text-white px-6 py-3 rounded-full font-semibold hover:bg-gray-800">
                                Log in
                            </Link>
                            <Link
                                href={`/register?next=${encodeURIComponent(next)}`}
                                className="bg-gray-100 text-black px-6 py-3 rounded-full font-semibold hover:bg-gray-200"
                            >
                                Create an account
                            </Link>
                        </div>
                    ) : (
                        <button
                            onClick={handleClaim}
                            disabled={status === 'claiming' || !code}
                            className="bg-black text-white px-6 py-3 rounded-full font-semibold hover:bg-gray-800 disabled:opacity-60"
                        >
                            {status === 'claiming' ? 'Connecting...' : 'Connect this card to my profile'}
                        </button>
                    )}
                </>
            )}
        </div>
    );
}
