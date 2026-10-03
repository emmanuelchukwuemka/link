'use client'

import { useState, useEffect, useRef, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Mail, Check, CreditCard, Store, BarChart3, Sparkles, ArrowLeft, KeyRound, User as UserIcon, AtSign } from 'lucide-react'
import { AuthHero } from '../AuthHero'

const CHECKLIST = [
  { icon: UserIcon, label: 'Create your digital profile' },
  { icon: CreditCard, label: 'Manage your Digital Cards' },
  { icon: Store, label: 'Sell products and services' },
  { icon: BarChart3, label: 'Track engagement with analytics' },
  { icon: Sparkles, label: 'Grow your network and business' },
]

const RESEND_COOLDOWN = 60

function RegisterForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const next = searchParams.get('next')
  const isBusiness = searchParams.get('type') === 'business'

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1)
  const [email, setEmail] = useState('')
  const [businessName, setBusinessName] = useState('')
  const [code, setCode] = useState('')
  const [username, setUsername] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [cooldown, setCooldown] = useState(0)
  const codeInputRef = useRef<HTMLInputElement>(null)
  const usernameInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (cooldown <= 0) return
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000)
    return () => clearTimeout(t)
  }, [cooldown])

  useEffect(() => {
    if (step === 2) codeInputRef.current?.focus()
    if (step === 3) usernameInputRef.current?.focus()
  }, [step])

  const requestCode = async () => {
    setError('')
    if (!email.trim()) { setError('Please enter your email address.'); return }
    if (isBusiness && !businessName.trim()) { setError('Please enter your business name.'); return }
    setLoading(true)
    try {
      const res = await fetch('/api/auth/otp/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      })
      const result = await res.json()
      if (!res.ok) throw new Error(result.error || 'Could not send verification code')
      setStep(2)
      setCooldown(RESEND_COOLDOWN)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    requestCode()
  }

  const handleResend = () => {
    if (cooldown > 0 || loading) return
    requestCode()
  }

  const handleCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (code.trim().length !== 6) { setError('Enter the 6-digit code we emailed you.'); return }
    setLoading(true)
    try {
      const res = await fetch('/api/auth/otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), code: code.trim(), businessName: isBusiness ? businessName.trim() : undefined }),
      })
      const result = await res.json()
      if (!res.ok) throw new Error(result.error || 'Verification failed')

      setUsername(result.user.username)
      setStep(3)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleUsernameSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!username.trim()) { setError('Please choose a URL.'); return }
    setLoading(true)
    try {
      const res = await fetch('/api/profile/username', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim() }),
      })
      const result = await res.json()
      if (!res.ok) throw new Error(result.error || 'Could not claim that URL')

      setStep(4)
      setTimeout(() => {
        router.push(next || '/dashboard/links')
        router.refresh()
      }, 1200)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      <AuthHero
        heading={<>One Account.<br />Endless Possibilities.</>}
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
              <Link href="/login" className="font-semibold bg-gray-100 px-4 py-1.5 rounded-full hover:bg-gray-200 transition-colors shrink-0">
                Login
              </Link>
            </div>
          </div>

          {error && <div className="bg-red-50 text-red-500 p-3 rounded-lg mb-6 text-sm">{error}</div>}

          {step === 1 && (
            <>
              <h1 className="text-3xl font-bold mb-1">{isBusiness ? 'Create Your Business Account' : 'Create Your Account'}</h1>
              <p className="text-gray-500 mb-8">Enter your email and we&apos;ll send you a verification code &mdash; no long form, no password to remember yet.</p>

              <form onSubmit={handleEmailSubmit} className="space-y-4">
                {isBusiness && (
                  <div>
                    <label className="block text-sm font-semibold mb-1.5 flex items-center gap-1.5"><Store size={14} /> Business Name</label>
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
                  <label className="block text-sm font-semibold mb-1.5 flex items-center gap-1.5"><Mail size={14} /> Email Address</label>
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
            </>
          )}

          {step === 2 && (
            <>
              <h1 className="text-3xl font-bold mb-1">Check your email</h1>
              <p className="text-gray-500 mb-8">
                We sent a 6-digit code to <span className="font-semibold text-black">{email}</span>. Enter it below to finish creating your account.
              </p>

              <form onSubmit={handleCodeSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold mb-1.5 flex items-center gap-1.5"><KeyRound size={14} /> Verification Code</label>
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
                  <button type="button" onClick={() => { setStep(1); setCode(''); setError('') }} className="text-gray-500 hover:text-black font-medium">
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
              <h1 className="text-3xl font-bold mb-1">Claim your TapConnect URL</h1>
              <p className="text-gray-500 mb-8">This is your public profile link &mdash; share it anywhere. You can always change it later in Settings.</p>

              <form onSubmit={handleUsernameSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold mb-1.5 flex items-center gap-1.5"><AtSign size={14} /> Your URL</label>
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
              <h1 className="text-2xl font-bold mb-2">You&apos;re all set!</h1>
              <p className="text-gray-500">tapconnect.ng/{username} is yours. Taking you to your profile builder&hellip;</p>
            </div>
          )}

          {step < 3 && (
            <p className="text-center mt-8 text-xs text-gray-400">
              By creating an account, you agree to our Terms &amp; Conditions and{' '}
              <Link href="/about" className="underline">Privacy Policy</Link>.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

export default function RegisterPage() {
  return (
    <Suspense fallback={null}>
      <RegisterForm />
    </Suspense>
  )
}
