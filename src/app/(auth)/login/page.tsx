'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Mail, Lock, Eye, EyeOff, User, CreditCard, BarChart3, Store, Sparkles, ArrowLeft } from 'lucide-react'
import { AuthHero } from '../AuthHero'

const CHECKLIST = [
  { icon: User, label: 'Access your profile' },
  { icon: CreditCard, label: 'Manage your Digital Cards' },
  { icon: BarChart3, label: 'View analytics and leads' },
  { icon: Store, label: 'Manage your products and services' },
  { icon: Sparkles, label: 'Stay connected and grow' },
]

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const next = searchParams.get('next')
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(true)
  const [googleNotice, setGoogleNotice] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const formData = new FormData(e.currentTarget)
    const data = { ...Object.fromEntries(formData), rememberMe }

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!res.ok) {
        const result = await res.json()
        throw new Error(result.error || 'Login failed')
      }

      const result = await res.json()
      router.push(next || (result.user?.accountType === 'admin' ? '/admin' : '/dashboard'))
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

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
              <Link href="/register" className="font-semibold bg-gray-100 px-4 py-1.5 rounded-full hover:bg-gray-200 transition-colors">
                Sign Up
              </Link>
            </div>
          </div>

          <h1 className="text-3xl font-bold mb-1">Welcome Back</h1>
          <p className="text-gray-500 mb-8">Sign in to your account to continue.</p>

          {error && (
            <div className="bg-red-50 text-red-500 p-3 rounded-lg mb-6 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold mb-1.5 flex items-center gap-1.5"><Mail size={14} /> Email Address</label>
              <input
                type="email"
                name="email"
                required
                placeholder="you@example.com"
                className="w-full px-4 py-3 rounded-lg bg-gray-100 border-transparent focus:bg-white focus:border-black focus:ring-2 focus:ring-black/10 transition-all outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1.5 flex items-center gap-1.5"><Lock size={14} /> Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  required
                  placeholder="Enter your password"
                  className="w-full px-4 py-3 rounded-lg bg-gray-100 border-transparent focus:bg-white focus:border-black focus:ring-2 focus:ring-black/10 transition-all outline-none pr-11"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-black">
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 cursor-pointer text-gray-600">
                <input type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} className="w-4 h-4 rounded accent-black" />
                Remember me
              </label>
              <Link href="/forgot-password" className="font-semibold hover:underline">Forgot password?</Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-black text-white rounded-full py-4 font-semibold text-lg hover:bg-[#111111] transition-colors disabled:opacity-70"
            >
              {loading ? 'Signing in...' : 'Sign In →'}
            </button>
          </form>

          <div className="flex items-center gap-3 text-xs text-gray-400 my-6">
            <span className="flex-1 h-px bg-gray-200" /> OR <span className="flex-1 h-px bg-gray-200" />
          </div>

          <button
            type="button"
            onClick={() => setGoogleNotice(true)}
            className="w-full flex items-center justify-center gap-3 border border-gray-200 rounded-lg py-3 font-semibold text-gray-400 cursor-not-allowed"
          >
            <svg width="18" height="18" viewBox="0 0 18 18"><path fill="#EA4335" d="M9 3.6c1.3 0 2.5.45 3.4 1.33l2.55-2.55C13.4.7 11.35 0 9 0 5.48 0 2.44 2.02.96 4.96l2.98 2.31C4.7 5.1 6.65 3.6 9 3.6z"/><path fill="#4285F4" d="M17.64 9.2c0-.63-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72l2.9 2.25c1.7-1.57 2.7-3.88 2.7-6.61z"/><path fill="#FBBC05" d="M3.94 10.71a5.4 5.4 0 0 1 0-3.42L.96 4.96a9 9 0 0 0 0 8.08l2.98-2.33z"/><path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.9-2.25c-.8.55-1.85.87-3.06.87-2.35 0-4.3-1.5-5.06-3.62L.96 13.13A9 9 0 0 0 9 18z"/></svg>
            Continue with Google
          </button>
          {googleNotice && (
            <p className="text-xs text-amber-600 mt-2 text-center">Google sign-in isn&apos;t configured on this deployment yet.</p>
          )}
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  )
}
