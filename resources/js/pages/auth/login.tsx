import { useState, useEffect, useRef } from 'react';
import { Link, router } from '@inertiajs/react';
import { Mail, Lock, Eye, EyeOff, User, CreditCard, BarChart3, Store, Sparkles, ArrowLeft, KeyRound } from 'lucide-react';
import { AuthHero } from '@/components/auth-hero';
import { apiFetch } from '@/lib/api';

const CHECKLIST = [
    { icon: User, label: 'Access your profile' },
    { icon: CreditCard, label: 'Manage your Digital Cards' },
    { icon: BarChart3, label: 'View analytics and leads' },
    { icon: Store, label: 'Manage your products and services' },
    { icon: Sparkles, label: 'Stay connected and grow' },
];

const RESEND_COOLDOWN = 60;

const GOOGLE_ERROR_MESSAGES: Record<string, string> = {
    google_not_configured: 'Google sign-in isn’t configured on this deployment yet.',
    google_failed: 'Google sign-in failed. Please try again.',
    google_email_unverified: 'That Google account’s email isn’t verified. Please verify it with Google first.',
    account_suspended: 'This account has been suspended. Contact support if you believe this is a mistake.',
};

export default function Login() {
    const params = new URLSearchParams(window.location.search);
    const next = params.get('next');
    const googleError = params.get('error');

    const [mode, setMode] = useState<'otp' | 'password'>('otp');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const [otpStep, setOtpStep] = useState<1 | 2>(1);
    const [email, setEmail] = useState('');
    const [code, setCode] = useState('');
    const [cooldown, setCooldown] = useState(0);
    const codeInputRef = useRef<HTMLInputElement>(null);

    const [showPassword, setShowPassword] = useState(false);
    const [rememberMe, setRememberMe] = useState(true);

    useEffect(() => {
        if (cooldown <= 0) return;
        const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
        return () => clearTimeout(t);
    }, [cooldown]);

    useEffect(() => {
        if (mode === 'otp' && otpStep === 2) codeInputRef.current?.focus();
    }, [mode, otpStep]);

    const afterLogin = (accountType: string) => {
        router.visit(next || (accountType === 'admin' ? '/admin' : '/dashboard'));
    };

    const requestCode = async () => {
        setError('');
        if (!email.trim()) {
            setError('Please enter your email address.');
            return;
        }
        setLoading(true);
        try {
            const { ok, data } = await apiFetch('/otp/request-login', { email: email.trim() });
            if (!ok) throw new Error((data.error as string) || 'Could not send verification code');
            setOtpStep(2);
            setCooldown(RESEND_COOLDOWN);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
        } finally {
            setLoading(false);
        }
    };

    const handleEmailSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        requestCode();
    };

    const handleResend = () => {
        if (cooldown > 0 || loading) return;
        requestCode();
    };

    const handleCodeSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (code.trim().length !== 6) {
            setError('Enter the 6-digit code we emailed you.');
            return;
        }
        setLoading(true);
        try {
            const { ok, data } = await apiFetch('/otp/verify-login', { email: email.trim(), code: code.trim() });
            if (!ok) throw new Error((data.error as string) || 'Verification failed');
            const user = data.user as { accountType: string };
            afterLogin(user?.accountType);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
        } finally {
            setLoading(false);
        }
    };

    const handlePasswordSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        const formData = new FormData(e.currentTarget);
        const payload = { ...Object.fromEntries(formData), rememberMe };

        try {
            const { ok, data } = await apiFetch('/login', payload);
            if (!ok) throw new Error((data.error as string) || 'Login failed');
            const user = data.user as { accountType: string };
            afterLogin(user?.accountType);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
        } finally {
            setLoading(false);
        }
    };

    const switchMode = (newMode: 'otp' | 'password') => {
        setMode(newMode);
        setError('');
        setOtpStep(1);
        setCode('');
    };

    return (
        <div className="min-h-screen grid lg:grid-cols-2">
            <AuthHero
                heading="Welcome Back."
                subtext="Sign in to your TapConnect account and continue building your digital identity."
                checklist={CHECKLIST}
            />

            <div className="flex flex-col justify-center px-6 sm:px-12 py-12 bg-white">
                <div className="w-full max-w-md mx-auto">
                    <div className="flex justify-between items-center mb-6 text-sm">
                        <Link href="/" className="flex items-center gap-1.5 font-semibold text-gray-500 hover:text-black transition-colors">
                            <ArrowLeft size={16} /> Home
                        </Link>
                        <div className="flex items-center">
                            <span className="text-gray-500 mr-2">Don&apos;t have an account?</span>
                            <Link
                                href={next ? `/register?next=${encodeURIComponent(next)}` : '/register'}
                                className="font-semibold bg-gray-100 px-4 py-1.5 rounded-full hover:bg-gray-200 transition-colors text-black"
                            >
                                Sign Up
                            </Link>
                        </div>
                    </div>

                    {(error || googleError) && (
                        <div className="bg-red-50 text-red-500 p-3 rounded-lg mb-6 text-sm">
                            {error || GOOGLE_ERROR_MESSAGES[googleError || ''] || 'Something went wrong. Please try again.'}
                        </div>
                    )}

                    {mode === 'otp' && otpStep === 1 && (
                        <>
                            <h1 className="text-3xl font-bold mb-1 text-black">Welcome Back</h1>
                            <p className="text-gray-500 mb-8">Enter your email and we&apos;ll send you a code to sign in &mdash; no password needed.</p>

                            <form onSubmit={handleEmailSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-semibold mb-1.5 flex items-center gap-1.5 text-black">
                                        <Mail size={14} /> Email Address
                                    </label>
                                    <input
                                        type="email"
                                        required
                                        autoFocus
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="you@example.com"
                                        className="w-full px-4 py-3 rounded-lg bg-gray-100 border-transparent focus:bg-white focus:border-black focus:ring-2 focus:ring-black/10 transition-all outline-none"
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full bg-black text-white rounded-full py-4 font-semibold text-lg hover:bg-[#111111] transition-colors disabled:opacity-70"
                                >
                                    {loading ? 'Sending code...' : 'Send verification code →'}
                                </button>
                            </form>

                            <p className="text-center text-sm text-gray-500 mt-6">
                                <button type="button" onClick={() => switchMode('password')} className="font-semibold text-black hover:underline">
                                    Sign in with a password instead
                                </button>
                            </p>
                        </>
                    )}

                    {mode === 'otp' && otpStep === 2 && (
                        <>
                            <h1 className="text-3xl font-bold mb-1 text-black">Check your email</h1>
                            <p className="text-gray-500 mb-8">
                                We sent a 6-digit code to <span className="font-semibold text-black">{email}</span>.
                            </p>

                            <form onSubmit={handleCodeSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-semibold mb-1.5 flex items-center gap-1.5 text-black">
                                        <KeyRound size={14} /> Verification Code
                                    </label>
                                    <input
                                        ref={codeInputRef}
                                        required
                                        inputMode="numeric"
                                        maxLength={6}
                                        value={code}
                                        onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                        placeholder="000000"
                                        className="w-full px-4 py-3 rounded-lg bg-gray-100 border-transparent focus:bg-white focus:border-black focus:ring-2 focus:ring-black/10 outline-none transition-all text-center text-2xl font-bold tracking-[0.5em]"
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading || code.length !== 6}
                                    className="w-full bg-black text-white rounded-full py-4 font-semibold text-lg hover:bg-[#111111] transition-colors disabled:opacity-40"
                                >
                                    {loading ? 'Signing in...' : 'Sign in'}
                                </button>

                                <div className="flex items-center justify-between text-sm pt-1">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setOtpStep(1);
                                            setCode('');
                                            setError('');
                                        }}
                                        className="text-gray-500 hover:text-black font-medium"
                                    >
                                        &larr; Change email
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleResend}
                                        disabled={cooldown > 0 || loading}
                                        className="font-semibold text-black hover:underline disabled:text-gray-400 disabled:no-underline"
                                    >
                                        {cooldown > 0 ? `Resend code (${cooldown}s)` : 'Resend code'}
                                    </button>
                                </div>
                            </form>
                        </>
                    )}

                    {mode === 'password' && (
                        <>
                            <h1 className="text-3xl font-bold mb-1 text-black">Welcome Back</h1>
                            <p className="text-gray-500 mb-8">Sign in to your account to continue.</p>

                            <form onSubmit={handlePasswordSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-semibold mb-1.5 flex items-center gap-1.5 text-black">
                                        <Mail size={14} /> Email Address
                                    </label>
                                    <input
                                        type="email"
                                        name="email"
                                        required
                                        placeholder="you@example.com"
                                        className="w-full px-4 py-3 rounded-lg bg-gray-100 border-transparent focus:bg-white focus:border-black focus:ring-2 focus:ring-black/10 transition-all outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold mb-1.5 flex items-center gap-1.5 text-black">
                                        <Lock size={14} /> Password
                                    </label>
                                    <div className="relative">
                                        <input
                                            type={showPassword ? 'text' : 'password'}
                                            name="password"
                                            required
                                            placeholder="Enter your password"
                                            className="w-full px-4 py-3 rounded-lg bg-gray-100 border-transparent focus:bg-white focus:border-black focus:ring-2 focus:ring-black/10 transition-all outline-none pr-11"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-black"
                                        >
                                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                        </button>
                                    </div>
                                </div>

                                <div className="flex items-center text-sm">
                                    <label className="flex items-center gap-2 cursor-pointer text-gray-600">
                                        <input
                                            type="checkbox"
                                            checked={rememberMe}
                                            onChange={(e) => setRememberMe(e.target.checked)}
                                            className="w-4 h-4 rounded accent-black"
                                        />
                                        Remember me
                                    </label>
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full bg-black text-white rounded-full py-4 font-semibold text-lg hover:bg-[#111111] transition-colors disabled:opacity-70"
                                >
                                    {loading ? 'Signing in...' : 'Sign In →'}
                                </button>
                            </form>

                            <p className="text-center text-sm text-gray-500 mt-6">
                                <button type="button" onClick={() => switchMode('otp')} className="font-semibold text-black hover:underline">
                                    Sign in with a code instead
                                </button>
                            </p>
                        </>
                    )}

                    <div className="flex items-center gap-3 text-xs text-gray-400 my-6">
                        <span className="flex-1 h-px bg-gray-200" /> OR <span className="flex-1 h-px bg-gray-200" />
                    </div>

                    <a
                        href={`/auth/google${next ? `?next=${encodeURIComponent(next)}` : ''}`}
                        className="w-full flex items-center justify-center gap-3 border border-gray-200 rounded-lg py-3 font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                        <svg width="18" height="18" viewBox="0 0 18 18">
                            <path
                                fill="#EA4335"
                                d="M9 3.6c1.3 0 2.5.45 3.4 1.33l2.55-2.55C13.4.7 11.35 0 9 0 5.48 0 2.44 2.02.96 4.96l2.98 2.31C4.7 5.1 6.65 3.6 9 3.6z"
                            />
                            <path
                                fill="#4285F4"
                                d="M17.64 9.2c0-.63-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72l2.9 2.25c1.7-1.57 2.7-3.88 2.7-6.61z"
                            />
                            <path fill="#FBBC05" d="M3.94 10.71a5.4 5.4 0 0 1 0-3.42L.96 4.96a9 9 0 0 0 0 8.08l2.98-2.33z" />
                            <path
                                fill="#34A853"
                                d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.9-2.25c-.8.55-1.85.87-3.06.87-2.35 0-4.3-1.5-5.06-3.62L.96 13.13A9 9 0 0 0 9 18z"
                            />
                        </svg>
                        Continue with Google
                    </a>
                </div>
            </div>
        </div>
    );
}
