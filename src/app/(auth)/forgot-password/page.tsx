'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Mail, KeyRound, User, CreditCard, Sparkles, ArrowLeft } from 'lucide-react'
import { AuthHero } from '../AuthHero'

const CHECKLIST = [
  { icon: User, label: 'Regain access to your profile' },
  { icon: CreditCard, label: 'Keep your Digital Cards connected' },
  { icon: Sparkles, label: 'Pick up right where you left off' },
]

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')
  const [devResetUrl, setDevResetUrl] = useState<string | null>(null)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus('sending')
    setError('')
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Something went wrong')
      setDevResetUrl(data.devResetUrl || null)
      setStatus('sent')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setStatus('error')
    }
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      <AuthHero
        heading="Forgot Your Password?"
        subtext="No problem. Enter the email on your TapConnect account and we'll send you a link to reset it."
        checklist={CHECKLIST}
      />

      <div className="flex flex-col justify-center px-6 sm:px-12 py-12 bg-white">
        <div className="w-full max-w-md mx-auto">
          <div className="flex justify-between items-center mb-6 text-sm">
            <Link href="/" className="flex items-center gap-1.5 font-semibold text-gray-500 hover:text-black transition-colors">
              <ArrowLeft size={16} /> Home
            </Link>
            <Link href="/login" className="font-semibold bg-gray-100 px-4 py-1.5 rounded-full hover:bg-gray-200 transition-colors">
              Back to Login
            </Link>
          </div>

          {status === 'sent' ? (
            <div className="text-center py-8">
              <div className="w-14 h-14 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <KeyRound size={24} />
              </div>
              <h1 className="text-2xl font-bold mb-2">Check your email</h1>
              <p className="text-gray-500 mb-6">If an account exists for {email}, a reset link is on its way.</p>
              {devResetUrl && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-left text-sm">
                  <p className="text-amber-800 font-semibold mb-1">Dev mode &mdash; no email provider configured yet:</p>
                  <a href={devResetUrl} className="text-amber-700 underline break-all">{devResetUrl}</a>
                </div>
              )}
            </div>
          ) : (
            <>
              <h1 className="text-3xl font-bold mb-1">Reset Password</h1>
              <p className="text-gray-500 mb-8">Enter your email address and we&apos;ll send you a link to reset your password.</p>

              {error && <div className="bg-red-50 text-red-500 p-3 rounded-lg mb-6 text-sm">{error}</div>}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold mb-1.5 flex items-center gap-1.5"><Mail size={14} /> Email Address</label>
                  <input
                    required
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full px-4 py-3 rounded-lg bg-gray-100 border-transparent focus:bg-white focus:border-black focus:ring-2 focus:ring-black/10 transition-all outline-none"
                  />
                </div>
                <button
                  type="submit"
                  disabled={status === 'sending'}
                  className="w-full bg-black text-white rounded-full py-4 font-semibold text-lg hover:bg-[#111111] transition-colors disabled:opacity-70"
                >
                  {status === 'sending' ? 'Sending...' : 'Send Reset Link'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
