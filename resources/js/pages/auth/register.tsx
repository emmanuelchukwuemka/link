import { useState, useEffect, useRef } from 'react';
import { Link, router } from '@inertiajs/react';
import { Mail, Check, CreditCard, Store, BarChart3, Sparkles, ArrowLeft, KeyRound, User as UserIcon, AtSign } from 'lucide-react';
import { AuthHero } from '@/components/auth-hero';
import { apiFetch } from '@/lib/api';

const CHECKLIST = [
    { icon: UserIcon, label: 'Create your digital profile' },
    { icon: CreditCard, label: 'Manage your Digital Cards' },
    { icon: Store, label: 'Sell products and services' },
    { icon: BarChart3, label: 'Track engagement with analytics' },
    { icon: Sparkles, label: 'Grow your network and business' },
];

const RESEND_COOLDOWN = 60;

export default function Register() {
    const params = new URLSearchParams(window.location.search);
    const next = params.get('next');
    const isBusiness = params.get('type') === 'business';

    const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
    const [email, setEmail] = useState('');
    const [businessName, setBusinessName] = useState('');
    const [code, setCode] = useState('');
    const [username, setUsername] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [cooldown, setCooldown] = useState(0);
    const codeInputRef = useRef<HTMLInputElement>(null);
    const usernameInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (cooldown <= 0) return;
        const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
        return () => clearTimeout(t);
    }, [cooldown]);

    useEffect(() => {
        if (step === 2) codeInputRef.current?.focus();
        if (step === 3) usernameInputRef.current?.focus();
    }, [step]);

    const requestCode = async () => {
        setError('');
        if (!email.trim()) {
            setError('Please enter your email address.');
            return;
        }
        if (isBusiness && !businessName.trim()) {
            setError('Please enter your business name.');
            return;
        }
        setLoading(true);
        try {
            const { ok, data } = await apiFetch('/otp/request-register', { email: email.trim() });
            if (!ok) throw new Error((data.error as string) || 'Could not send verification code');
            setStep(2);
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
            const { ok, data } = await apiFetch('/otp/verify-register', {
                email: email.trim(),
                code: code.trim(),
                business_name: isBusiness ? businessName.trim() : undefined,
            });
            if (!ok) throw new Error((data.error as string) || 'Verification failed');

            const user = data.user as { username: string };
            setUsername(user.username);
            setStep(3);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
        } finally {
            setLoading(false);
        }
    };

    const handleUsernameSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (!username.trim()) {
            setError('Please choose a URL.');
            return;
        }
        setLoading(true);
        try {
            const { ok, data } = await apiFetch('/profile/username', { username: username.trim() }, 'PUT');
            if (!ok) throw new Error((data.error as string) || 'Could not claim that URL');

            setStep(4);
            setTimeout(() => {
                router.visit(next || '/dashboard');
            }, 1200);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen grid lg:grid-cols-2">
            <AuthHero
                heading={
                    <>
                        One Account.
                        <br />
                        Endless Possibilities.
                    </>
                }
                subtext="Join thousands of professionals, businesses and organizations using TapConnect to create stunning digital profiles, sell products, grow their brand and make meaningful connections."
                checklist={CHECKLIST}
            />

            <div className="flex flex-col justify-center px-6 sm:px-12 py-12 bg-white">
                <div className="w-full max-w-md mx-auto">
                    <div className="flex justify-between items-center mb-8 text-sm gap-2">
                        <Link href="/" className="flex items-center gap-1.5 font-semibold text-gray-500 hover:text-black transition-colors shrink-0">
                            <ArrowLeft size={16} /> Home
                        </Link>
                        <div className="flex items-center min-w-0">
                            <span className="hidden sm:inline text-gray-500 mr-2 truncate">Already have an account?</span>
                            <Link href="/login" className="font-semibold bg-gray-100 px-4 py-1.5 rounded-full hover:bg-gray-200 transition-colors shrink-0 text-black">
                                Login
                            </Link>
                        </div>
                    </div>

                    {error && <div className="bg-red-50 text-red-500 p-3 rounded-lg mb-6 text-sm">{error}</div>}

                    {step === 1 && (
                        <>
                            <h1 className="text-3xl font-bold mb-1 text-black">{isBusiness ? 'Create Your Business Account' : 'Create Your Account'}</h1>
                            <p className="text-gray-500 mb-8">Enter your email and we&apos;ll send you a verification code &mdash; no long form, no password to remember yet.</p>

                            <form onSubmit={handleEmailSubmit} className="space-y-4">
                                {isBusiness && (
                                    <div>
                                        <label className="block text-sm font-semibold mb-1.5 flex items-center gap-1.5 text-black">
                                            <Store size={14} /> Business Name
                                        </label>
                                        <input
                                            required
                                            value={businessName}
                                            onChange={(e) => setBusinessName(e.target.value)}
                                            placeholder="Your company name"
                                            className="w-full px-4 py-3 rounded-lg bg-gray-100 border-transparent focus:bg-white focus:border-black focus:ring-2 focus:ring-black/10 outline-none transition-all"
                                        />
                                    </div>
                                )}
                                <div>
                                    <label className="block text-sm font-semibold mb-1.5 flex items-center gap-1.5 text-black">
                                        <Mail size={14} /> Email Address
                                    </label>
                                    <input
                                        required
                                        type="email"
                                        autoFocus
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="you@example.com"
                                        className="w-full px-4 py-3 rounded-lg bg-gray-100 border-transparent focus:bg-white focus:border-black focus:ring-2 focus:ring-black/10 outline-none transition-all"
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full bg-black text-white rounded-full py-4 font-semibold text-lg hover:bg-[#111111] transition-colors disabled:opacity-60"
                                >
                                    {loading ? 'Sending code...' : 'Send verification code →'}
                                </button>
                            </form>

                            {!isBusiness && (
                                <>
                                    <div className="flex items-center gap-3 text-xs text-gray-400 my-6">
                                        <span className="flex-1 h-px bg-gray-200" /> OR <span className="flex-1 h-px bg-gray-200" />
                                    </div>
                                    <a
                                        href="/auth/google"
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
                                </>
                            )}
                        </>
                    )}

                    {step === 2 && (
                        <>
                            <h1 className="text-3xl font-bold mb-1 text-black">Check your email</h1>
                            <p className="text-gray-500 mb-8">
                                We sent a 6-digit code to <span className="font-semibold text-black">{email}</span>. Enter it below to finish creating your account.
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
                                    {loading ? 'Verifying...' : 'Verify & create account'}
                                </button>

                                <div className="flex items-center justify-between text-sm pt-1">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setStep(1);
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

                    {step === 3 && (
                        <>
                            <h1 className="text-3xl font-bold mb-1 text-black">Claim your TapConnect URL</h1>
                            <p className="text-gray-500 mb-8">This is your public profile link &mdash; share it anywhere. You can always change it later in Settings.</p>

                            <form onSubmit={handleUsernameSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-semibold mb-1.5 flex items-center gap-1.5 text-black">
                                        <AtSign size={14} /> Your URL
                                    </label>
                                    <div className="flex items-center bg-gray-100 rounded-lg focus-within:bg-white focus-within:ring-2 focus-within:ring-black/10 focus-within:border-black border border-transparent transition-all">
                                        <span className="pl-4 pr-1 text-gray-400 text-sm">tapconnect.ng/</span>
                                        <input
                                            ref={usernameInputRef}
                                            required
                                            value={username}
                                            onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                                            placeholder="yourname"
                                            className="flex-1 min-w-0 py-3 pr-4 bg-transparent outline-none"
                                        />
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading || !username.trim()}
                                    className="w-full bg-black text-white rounded-full py-4 font-semibold text-lg hover:bg-[#111111] transition-colors disabled:opacity-40"
                                >
                                    {loading ? 'Claiming...' : 'Claim my URL →'}
                                </button>
                            </form>
                        </>
                    )}

                    {step === 4 && (
                        <div className="text-center py-12">
                            <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                                <Check size={28} />
                            </div>
                            <h1 className="text-2xl font-bold mb-2 text-black">You&apos;re all set!</h1>
                            <p className="text-gray-500">tapconnect.ng/{username} is yours. Taking you to your profile builder&hellip;</p>
                        </div>
                    )}

                    {step < 3 && (
                        <p className="text-center mt-8 text-xs text-gray-400">
                            By creating an account, you agree to our Terms &amp; Conditions and{' '}
                            <Link href="/about" className="underline">
                                Privacy Policy
                            </Link>
                            .
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}
