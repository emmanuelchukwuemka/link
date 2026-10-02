import nodemailer from 'nodemailer'
import { insert, findOne } from './db'
import type { User, Notification } from './types'

type NotifyInput = {
  type: string
  title: string
  message: string
  link?: string
}

// Creates an in-app notification (real, persisted, shown in the dashboard bell).
// Email/WhatsApp/SMS delivery is not wired to a provider yet — see sendEmail/
// sendWhatsApp below, which currently just log. Swap in a real provider
// (Resend, SendGrid, WhatsApp Business API, etc.) when credentials exist.
export async function notify(userId: string, input: NotifyInput) {
  try {
    await insert('Notification', {
      userId,
      type: input.type,
      title: input.title,
      message: input.message,
      link: input.link ?? null,
    })
  } catch (err) {
    console.error('notify() failed:', err)
  }
}

let cachedTransporter: ReturnType<typeof nodemailer.createTransport> | null | undefined

function getTransporter() {
  if (cachedTransporter !== undefined) return cachedTransporter

  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
    cachedTransporter = null
    return cachedTransporter
  }

  const port = Number(SMTP_PORT) || 587
  cachedTransporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port,
    secure: port === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  })
  return cachedTransporter
}

export async function sendEmail(to: string, subject: string, body: string) {
  const transporter = getTransporter()
  if (!transporter) {
    // No SMTP provider configured — log instead of silently dropping.
    console.log(`[email:stub] to=${to} subject="${subject}" body="${body}"`)
    return
  }

  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to,
      subject,
      text: body,
    })
  } catch (err) {
    console.error('sendEmail() failed:', err)
  }
}

export async function sendWhatsApp(to: string, message: string) {
  console.log(`[whatsapp:stub] to=${to} message="${message}"`)
}

// No cron/scheduler exists yet, so expiry notifications are checked lazily
// whenever the user's session is loaded (GET /api/auth/me). De-duped by only
// creating one of each type while the previous one is still unread.
export async function checkSubscriptionExpiry(userId: string) {
  try {
    const user = await findOne<User>('User', { id: userId })
    if (!user || user.plan !== 'pro' || !user.planExpiresAt) return

    const now = new Date()
    const daysLeft = (new Date(user.planExpiresAt).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)

    if (daysLeft < 0) {
      const existing = await findOne<Notification>('Notification', { userId, type: 'SUBSCRIPTION_EXPIRED', read: false })
      if (!existing) {
        await notify(userId, {
          type: 'SUBSCRIPTION_EXPIRED',
          title: 'Your Pro subscription has expired',
          message: 'Renew to restore premium features. Your basic profile, NFC and QR code stay active.',
          link: '/dashboard/subscription',
        })
      }
    } else if (daysLeft <= 7) {
      const existing = await findOne<Notification>('Notification', { userId, type: 'SUBSCRIPTION_EXPIRING', read: false })
      if (!existing) {
        await notify(userId, {
          type: 'SUBSCRIPTION_EXPIRING',
          title: 'Your Pro subscription is expiring soon',
          message: `Renews/expires on ${new Date(user.planExpiresAt).toLocaleDateString()}.`,
          link: '/dashboard/subscription',
        })
      }
    }
  } catch (err) {
    console.error('checkSubscriptionExpiry() failed:', err)
  }
}
