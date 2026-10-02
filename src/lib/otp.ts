import { insert, findMany, updateById, remove, query } from './db'
import { sendEmail } from './notify'
import type { OtpCode } from './types'

const CODE_TTL_MS = 10 * 60 * 1000
const RESEND_COOLDOWN_MS = 60 * 1000
const MAX_ATTEMPTS = 5

function generateCode(): string {
  return String(Math.floor(100000 + Math.random() * 900000))
}

export async function requestOtp(email: string, purpose: string): Promise<{ ok: true } | { ok: false; error: string; retryAfterSeconds?: number }> {
  const recent = await findMany<OtpCode>('OtpCode', { where: { email, purpose }, orderBy: '`createdAt` DESC', limit: 1 })
  const last = recent[0]
  if (last && !last.consumedAt) {
    const ageMs = Date.now() - new Date(last.createdAt).getTime()
    if (ageMs < RESEND_COOLDOWN_MS) {
      return { ok: false, error: 'Please wait before requesting another code.', retryAfterSeconds: Math.ceil((RESEND_COOLDOWN_MS - ageMs) / 1000) }
    }
  }

  // Clear any stale unconsumed codes for this email/purpose so only the latest is valid.
  await remove('OtpCode', { email, purpose, consumedAt: null })

  const code = generateCode()
  await insert<OtpCode>('OtpCode', {
    email,
    code,
    purpose,
    expiresAt: new Date(Date.now() + CODE_TTL_MS),
  })

  await sendEmail(
    email,
    'Your TapConnect verification code',
    `Your verification code is ${code}. It expires in 10 minutes. If you didn't request this, you can ignore this email.`
  )

  return { ok: true }
}

export async function verifyOtp(email: string, code: string, purpose: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const rows = await findMany<OtpCode>('OtpCode', { where: { email, purpose, consumedAt: null }, orderBy: '`createdAt` DESC', limit: 1 })
  const entry = rows[0]

  if (!entry) return { ok: false, error: 'No verification code found for this email. Please request a new one.' }
  if (new Date(entry.expiresAt).getTime() < Date.now()) return { ok: false, error: 'This code has expired. Please request a new one.' }
  if (entry.attempts >= MAX_ATTEMPTS) return { ok: false, error: 'Too many incorrect attempts. Please request a new code.' }

  if (entry.code !== code.trim()) {
    await query('UPDATE `OtpCode` SET `attempts` = `attempts` + 1 WHERE `id` = ?', [entry.id])
    return { ok: false, error: 'Incorrect code. Please try again.' }
  }

  await updateById('OtpCode', entry.id, { consumedAt: new Date() })
  return { ok: true }
}
