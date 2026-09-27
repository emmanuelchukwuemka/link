'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import {
  User, Mail, Phone, Lock, Eye, EyeOff, Check, CreditCard, Store, BarChart3, Sparkles, ArrowLeft,
} from 'lucide-react'
import { AuthHero } from '../AuthHero'

const CHECKLIST = [
  { icon: User, label: 'Create your digital profile' },
  { icon: CreditCard, label: 'Manage your NFC cards' },
  { icon: Store, label: 'Sell products and services' },
  { icon: BarChart3, label: 'Track engagement with analytics' },
  { icon: Sparkles, label: 'Grow your network and business' },
]

const STEPS = ['Account', 'Profile Type', 'Complete']

const PASSWORD_RULES = [
  { test: (p: string) => p.length >= 8, label: 'At least 8 characters' },
  { test: (p: string) => /[A-Z]/.test(p), label: 'One uppercase letter' },
  { test: (p: string) => /[a-z]/.test(p), label: 'One lowercase letter' },
  { test: (p: string) => /[0-9]/.test(p), label: 'One number' },
]

function slugifyUsername(input: string): string {
  return input.toLowerCase().trim().replace(/[^a-z0-9]+/g, '').slice(0, 30)
}

function RegisterForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const next = searchParams.get('next')

  const [step, setStep] = useState(1)
  const [showPassword, setShowPassword] = useState(false)
  const [googleNotice, setGoogleNotice] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const [account, setAccount] = useState({ fullName: '', email: '', phone: '', password: '' })
  const [profile, setProfile] = useState({
    accountType: (searchParams.get('type') === 'business' ? 'business' : 'individual') as 'individual' | 'business',
    businessName: '',
    username: '',
  })
  const [usernameTouched, setUsernameTouched] = useState(false)

  const passwordOk = PASSWORD_RULES.every((r) => r.test(account.password))

  const handleAccountContinue = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!account.fullName.trim()) { setError('Please enter your full name.'); return }
    if (!account.email.trim()) { setError('Please enter your email address.'); return }
    if (!passwordOk) { setError("Your password doesn't meet all the requirements below yet."); return }
    if (!usernameTouched) {
      setProfile((p) => ({ ...p, username: slugifyUsername(account.fullName) }))
    }
    setStep(2)
  }

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const endpoint = profile.accountType === 'business' ? '/api/auth/register-business' : '/api/auth/register'

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          displayName: account.fullName,
          email: account.email,
          phone: account.phone,
          password: account.password,
          username: profile.username,
          businessName: profile.accountType === 'business' ? profile.businessName : undefined,
        }),
      })

      if (!res.ok) {
        const result = await res.json()
        throw new Error(result.error || 'Registration failed')
      }

      setStep(3)
      setTimeout(() => {
        router.push(next || '/dashboard')
        router.refresh()
      }, 1500)
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
          <div className="flex justify-between items-center mb-6 text-sm">
            <Link href="/" className="flex items-center gap-1.5 font-semibold text-gray-500 hover:text-black transition-colors">
              <ArrowLeft size={16} /> Home
            </Link>
            <div className="flex items-center">
              <span className="text-gray-500 mr-2">Already have an account?</span>
              <Link href="/login" className="font-semibold bg-gray-100 px-4 py-1.5 rounded-full hover:bg-gray-200 transition-colors">
                Login
              </Link>
            </div>
          </div>

          {step < 3 && (
            <>
              <h1 className="text-3xl font-bold mb-1">Create Your Account</h1>
              <p className="text-gray-500 mb-8">Join TapConnect and start building your digital identity today.</p>

              <div className="flex items-center gap-2 mb-8">
                {STEPS.map((label, i) => {
                  const n = i + 1
                  const active = n === step
                  const done = n < step
                  return (
                    <div key={label} className="flex items-center gap-2">
                      <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${active || done ? 'bg-black text-white' : 'bg-gray-100 text-gray-400'}`}>
                        {done ? <Check size={13} /> : n}
                      </span>
                      <span className={`text-sm font-medium ${active ? 'text-black' : 'text-gray-400'}`}>{label}</span>
                      {n < STEPS.length && <span className="w-6 h-px bg-gray-200 mx-1" />}
                    </div>
                  )
                })}
              </div>
            </>
          )}

          {error && <div className="bg-red-50 text-red-500 p-3 rounded-lg mb-6 text-sm">{error}</div>}

          {step === 1 && (
            <form onSubmit={handleAccountContinue} className="space-y-4">
              <button
                type="button"
                onClick={() => setGoogleNotice(true)}
                className="w-full flex items-center justify-center gap-3 border border-gray-200 rounded-lg py-3 font-semibold text-gray-400 cursor-not-allowed"
              >
                <svg width="18" height="18" viewBox="0 0 18 18"><path fill="#EA4335" d="M9 3.6c1.3 0 2.5.45 3.4 1.33l2.55-2.55C13.4.7 11.35 0 9 0 5.48 0 2.44 2.02.96 4.96l2.98 2.31C4.7 5.1 6.65 3.6 9 3.6z"/><path fill="#4285F4" d="M17.64 9.2c0-.63-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72l2.9 2.25c1.7-1.57 2.7-3.88 2.7-6.61z"/><path fill="#FBBC05" d="M3.94 10.71a5.4 5.4 0 0 1 0-3.42L.96 4.96a9 9 0 0 0 0 8.08l2.98-2.33z"/><path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.9-2.25c-.8.55-1.85.87-3.06.87-2.35 0-4.3-1.5-5.06-3.62L.96 13.13A9 9 0 0 0 9 18z"/></svg>
                Continue with Google
              </button>
              {googleNotice && (
                <p className="text-xs text-amber-600 -mt-2">Google sign-in isn&apos;t configured on this deployment yet.</p>
              )}

              <div className="flex items-center gap-3 text-xs text-gray-400">
                <span className="flex-1 h-px bg-gray-200" /> OR <span className="flex-1 h-px bg-gray-200" />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-1.5 flex items-center gap-1.5"><User size={14} /> Full Name</label>
                <input
                  required
                  value={account.fullName}
                  onChange={(e) => setAccount({ ...account, fullName: e.target.value })}
                  placeholder="Enter your full name"
                  className="w-full px-4 py-3 rounded-lg bg-gray-100 border-transparent focus:bg-white focus:border-black focus:ring-2 focus:ring-black/10 outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1.5 flex items-center gap-1.5"><Mail size={14} /> Email Address</label>
                <input
                  required
                  type="email"
                  value={account.email}
                  onChange={(e) => setAccount({ ...account, email: e.target.value })}
                  placeholder="you@example.com"
                  className="w-full px-4 py-3 rounded-lg bg-gray-100 border-transparent focus:bg-white focus:border-black focus:ring-2 focus:ring-black/10 outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1.5 flex items-center gap-1.5"><Phone size={14} /> Phone Number</label>
                <div className="flex items-center bg-gray-100 rounded-lg focus-within:bg-white focus-within:ring-2 focus-within:ring-black/10 focus-within:border-black border border-transparent transition-all">
                  <span className="pl-4 pr-2 text-gray-500 text-sm font-medium border-r border-gray-200">🇳🇬 +234</span>
                  <input
                    value={account.phone}
                    onChange={(e) => setAccount({ ...account, phone: e.target.value.replace(/\D/g, '') })}
                    placeholder="801 234 5678"
                    className="flex-1 min-w-0 px-3 py-3 bg-transparent outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1.5 flex items-center gap-1.5"><Lock size={14} /> Password</label>
                <div className="relative">
                  <input
                    required
                    type={showPassword ? 'text' : 'password'}
                    value={account.password}
                    onChange={(e) => setAccount({ ...account, password: e.target.value })}
                    placeholder="Create a password"
                    className="w-full px-4 py-3 rounded-lg bg-gray-100 border-transparent focus:bg-white focus:border-black focus:ring-2 focus:ring-black/10 outline-none transition-all pr-11"
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-black">
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 space-y-1.5">
                <p className="text-xs font-semibold text-gray-500 mb-2">Your password must contain:</p>
                {PASSWORD_RULES.map((rule) => {
                  const met = rule.test(account.password)
                  return (
                    <div key={rule.label} className={`flex items-center gap-2 text-xs ${met ? 'text-green-600' : 'text-gray-400'}`}>
                      <Check size={13} className={met ? 'opacity-100' : 'opacity-30'} /> {rule.label}
                    </div>
                  )
                })}
              </div>

              <button
                type="submit"
                className="w-full bg-black text-white rounded-full py-4 font-semibold text-lg hover:bg-[#111111] transition-colors"
              >
                Continue &rarr;
              </button>
            </form>
          )}

          {step === 2 && (
            <form onSubmit={handleProfileSubmit} className="space-y-5">
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setProfile({ ...profile, accountType: 'individual' })}
                  className={`rounded-xl border-2 p-4 text-left ${profile.accountType === 'individual' ? 'border-black bg-gray-50' : 'border-gray-200'}`}
                >
                  <User size={18} className="mb-2" />
                  <p className="font-semibold text-sm">Individual</p>
                  <p className="text-xs text-gray-500">Freelancer, creator, professional</p>
                </button>
                <button
                  type="button"
                  onClick={() => setProfile({ ...profile, accountType: 'business' })}
                  className={`rounded-xl border-2 p-4 text-left ${profile.accountType === 'business' ? 'border-black bg-gray-50' : 'border-gray-200'}`}
                >
                  <Store size={18} className="mb-2" />
                  <p className="font-semibold text-sm">Business</p>
                  <p className="text-xs text-gray-500">Team, company, multiple cards</p>
                </button>
              </div>

              {profile.accountType === 'business' && (
                <div>
                  <label className="block text-sm font-semibold mb-1.5">Business Name</label>
                  <input
                    required
                    value={profile.businessName}
                    onChange={(e) => setProfile({ ...profile, businessName: e.target.value })}
                    placeholder="Your company name"
                    className="w-full px-4 py-3 rounded-lg bg-gray-100 border-transparent focus:bg-white focus:border-black focus:ring-2 focus:ring-black/10 outline-none transition-all"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold mb-1.5">Choose your TapConnect URL</label>
                <div className="flex items-center bg-gray-100 rounded-lg focus-within:bg-white focus-within:ring-2 focus-within:ring-black/10 border border-transparent transition-all">
                  <span className="pl-4 pr-1 text-gray-400 text-sm">tapconnect.ng/</span>
                  <input
                    required
                    value={profile.username}
                    onChange={(e) => { setUsernameTouched(true); setProfile({ ...profile, username: slugifyUsername(e.target.value) }) }}
                    placeholder="yourname"
                    className="flex-1 min-w-0 py-3 pr-4 bg-transparent outline-none"
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <button type="button" onClick={() => setStep(1)} className="px-6 py-4 rounded-full font-semibold border border-gray-200 hover:bg-gray-50">
                  Back
                </button>
                <button
                  type="submit"
                  disabled={loading || !profile.username || (profile.accountType === 'business' && !profile.businessName)}
                  className="flex-1 bg-black text-white rounded-full py-4 font-semibold text-lg hover:bg-[#111111] transition-colors disabled:opacity-40"
                >
                  {loading ? 'Creating account...' : 'Create account'}
                </button>
              </div>
            </form>
          )}

          {step === 3 && (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <Check size={28} />
              </div>
              <h1 className="text-2xl font-bold mb-2">You&apos;re all set!</h1>
              <p className="text-gray-500">Taking you to your dashboard&hellip;</p>
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
