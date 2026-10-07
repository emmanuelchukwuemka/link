import { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import { Lock, Mail, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { Logo } from '@/components/logo';
import { apiFetch } from '@/lib/api';

export default function AdminLoginPage() {
    const next = new URLSearchParams(window.location.search).get('next');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        const formData = new FormData(e.currentTarget);
        const payload = { email: formData.get('email'), password: formData.get('password'), rememberMe: true };

        try {
            const { ok, data } = await apiFetch('/login', payload);
            if (!ok) throw new Error((data.error as string) || 'Login failed');

            const user = data.user as { accountType: string };
            if (user?.accountType !== 'admin') {
                setError('This account does not have admin access.');
                setLoading(false);
                return;
            }

            router.visit(next && next.startsWith('/admin') ? next : '/admin');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
            setLoading(false);
        }
    };

    return (
        <>
            <Head title="Admin Sign In | TapConnect" />
            <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center px-4">
                <div className="w-full max-w-sm">
                    <div className="flex flex-col items-center mb-8">
                        <Logo className="h-8 mb-6" />
                        <div className="w-11 h-11 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-4">
                            <ShieldCheck size={20} className="text-white/70" />
                        </div>
                        <h1 className="text-xl font-bold text-white">Admin Sign In</h1>
                        <p className="text-sm text-white/40 mt-1">Restricted access &mdash; TapConnect staff only.</p>
                    </div>

                    <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                        {error && <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-lg mb-5 text-sm">{error}</div>}

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-white/60 mb-1.5 flex items-center gap-1.5">
                                    <Mail size={13} /> Email
                                </label>
                                <input
                                    type="email"
                                    name="email"
                                    required
                                    autoFocus
                                    placeholder="admin@tapconnect.ng"
                                    className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 focus:border-white/30 text-white placeholder:text-white/25 outline-none transition-all text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-white/60 mb-1.5 flex items-center gap-1.5">
                                    <Lock size={13} /> Password
                                </label>
                                <div className="relative">
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        name="password"
                                        required
                                        placeholder="&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;"
                                        className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 focus:border-white/30 text-white placeholder:text-white/25 outline-none transition-all text-sm pr-11"
                                    />
                                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60">
                                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                </div>
                            </div>

                            <button type="submit" disabled={loading} className="w-full bg-white text-black rounded-lg py-3 font-semibold text-sm hover:bg-white/90 transition-colors disabled:opacity-50 mt-2">
                                {loading ? 'Signing in...' : 'Sign In'}
                            </button>
                        </form>
                    </div>

                    <p className="text-center text-xs text-white/25 mt-6">
                        Not an admin?{' '}
                        <a href="/" className="text-white/40 hover:text-white/60 underline">
                            Return to tapconnect.ng
                        </a>
                    </p>
                </div>
            </div>
        </>
    );
}
