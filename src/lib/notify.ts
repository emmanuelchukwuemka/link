import { prisma } from './prisma'

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
    await prisma.notification.create({
      data: {
        userId,
        type: input.type,
        title: input.title,
        message: input.message,
        link: input.link,
      },
    })
  } catch (err) {
    console.error('notify() failed:', err)
  }
}

export async function sendEmail(to: string, subject: string, body: string) {
  // No email provider configured yet. Logging keeps the trigger points real
  // and testable without silently dropping the notification.
  console.log(`[email:stub] to=${to} subject="${subject}" body="${body}"`)
}

export async function sendWhatsApp(to: string, message: string) {
  console.log(`[whatsapp:stub] to=${to} message="${message}"`)
}

// No cron/scheduler exists yet, so expiry notifications are checked lazily
// whenever the user's session is loaded (GET /api/auth/me). De-duped by only
// creating one of each type while the previous one is still unread.
export async function checkSubscriptionExpiry(userId: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { plan: true, planExpiresAt: true },
    })
    if (!user || user.plan !== 'pro' || !user.planExpiresAt) return

    const now = new Date()
    const daysLeft = (user.planExpiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)

    if (daysLeft < 0) {
      const existing = await prisma.notification.findFirst({
        where: { userId, type: 'SUBSCRIPTION_EXPIRED', read: false },
      })
      if (!existing) {
        await notify(userId, {
          type: 'SUBSCRIPTION_EXPIRED',
          title: 'Your Pro subscription has expired',
          message: 'Renew to restore premium features. Your basic profile, NFC and QR code stay active.',
          link: '/dashboard/subscription',
        })
      }
    } else if (daysLeft <= 7) {
      const existing = await prisma.notification.findFirst({
        where: { userId, type: 'SUBSCRIPTION_EXPIRING', read: false },
      })
      if (!existing) {
        await notify(userId, {
          type: 'SUBSCRIPTION_EXPIRING',
          title: 'Your Pro subscription is expiring soon',
          message: `Renews/expires on ${user.planExpiresAt.toLocaleDateString()}.`,
          link: '/dashboard/subscription',
        })
      }
    }
  } catch (err) {
    console.error('checkSubscriptionExpiry() failed:', err)
  }
}
