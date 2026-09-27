'use client'

import { useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Lock, Eye, EyeOff, Check, ShieldCheck, User, CreditCard, Sparkles, ArrowLeft } from 'lucide-react'
import { AuthHero } from '../AuthHero'

const CHECKLIST = [
  { icon: User, label: 'Regain access to your profile' },
  { icon: CreditCard, label: 'Keep your NFC cards connected' },
  { icon: Sparkles, label: 'Pick up right where you left off' },
]

const PASSWORD_RULES = [
  { test: (p: string) => p.length >= 8, label: 'At least 8 characters' },
  { test: (p: string) => /[A-Z]/.test(p), label: 'One uppercase letter' },
  { test: (p: string) => /[a-z]/.test(p), label: 'One lowercase letter' },
  { test: (p: string) => /[0-9]/.test(p), label: 'One number' },
]

function ResetPasswordForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')

  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [status, setStatus] = useState<'idle' | 'saving' | 'done' | 'error'>('idle')
  const [error, setError] = useState('')

  const passwordOk = PASSWORD_RULES.every((r) => r.test(password))
  const matches = password.length > 0 && password === confirm

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!token) {
      setError('This reset link is missing its token. Request a new one.')
      setStatus('error')
      return
    }
    if (!passwordOk) {
      setError("Your password doesn't meet all the requirements below yet.")
      return
    }
    if (!matches) {
      setError("Passwords don't match.")
      return
    }
    setStatus('saving')
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Could not reset password')
      setStatus('done')
      setTimeout(() => router.push('/login'), 1800)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setStatus('error')
    }
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      <AuthHero
        heading="Set a New Password."
        subtext="Choose a strong new password to secure your TapConnect account."
        checklist={CHECKLIST}
      />

      <div className="flex flex-col justify-center px-6 sm:px-12 py-12 bg-white">
        <div className="w-full max-w-md mx-auto">
          {status !== 'done' && (
            <div className="flex mb-6 text-sm">
              <Link href="/" className="flex items-center gap-1.5 font-semibold text-gray-500 hover:text-black transition-colors">
                <ArrowLeft size={16} /> Home
              </Link>
            </div>
          )}
          {status === 'done' ? (
            <div className="text-center py-8">
              <div className="w-14 h-14 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <ShieldCheck size={24} />
              </div>
              <h1 className="text-2xl font-bold mb-2">Password updated</h1>
              <p className="text-gray-500">Taking you to login&hellip;</p>
            </div>
          ) : (
            <>
              <h1 className="text-3xl font-bold mb-1">Set a New Password</h1>
              <p className="text-gray-500 mb-8">Choose a new password for your account.</p>

              {error && <div className="bg-red-50 text-red-500 p-3 rounded-lg mb-6 text-sm">{error}</div>}
              {!token && (
                <div className="bg-amber-50 text-amber-700 p-3 rounded-lg mb-6 text-sm">
                  This link is missing a reset token. <Link href="/forgot-password" className="underline font-semibold">Request a new one</Link>.
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold mb-1.5 flex items-center gap-1.5"><Lock size={14} /> New Password</label>
                  <div className="relative">
                    <input
                      required
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter a new password"
                      className="w-full px-4 py-3 rounded-lg bg-gray-100 border-transparent focus:bg-white focus:border-black focus:ring-2 focus:ring-black/10 transition-all outline-none pr-11"
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-black">
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-1.5 flex items-center gap-1.5"><Lock size={14} /> Confirm Password</label>
                  <input
                    required
                    type={showPassword ? 'text' : 'password'}
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    placeholder="Re-enter the password"
                    className="w-full px-4 py-3 rounded-lg bg-gray-100 border-transparent focus:bg-white focus:border-black focus:ring-2 focus:ring-black/10 transition-all outline-none"
                  />
                  {confirm.length > 0 && !matches && (
                    <p className="text-xs text-red-500 mt-1">Passwords don&apos;t match.</p>
                  )}
                </div>

                <div className="bg-gray-50 rounded-lg p-4 space-y-1.5">
                  <p className="text-xs font-semibold text-gray-500 mb-2">Your password must contain:</p>
                  {PASSWORD_RULES.map((rule) => {
                    const met = rule.test(password)
                    return (
                      <div key={rule.label} className={`flex items-center gap-2 text-xs ${met ? 'text-green-600' : 'text-gray-400'}`}>
                        <Check size={13} className={met ? 'opacity-100' : 'opacity-30'} /> {rule.label}
                      </div>
                    )
                  })}
                </div>

                <button
                  type="submit"
                  disabled={status === 'saving'}
                  className="w-full bg-black text-white rounded-full py-4 font-semibold text-lg hover:bg-[#111111] transition-colors disabled:opacity-70"
                >
                  {status === 'saving' ? 'Saving...' : 'Reset Password'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordForm />
    </Suspense>
  )
}
