import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { notify } from '@/lib/notify'

// Authenticated: list leads for the current profile owner
export async function GET() {
  const authData = await getCurrentUser()
  if (!authData) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const leads = await prisma.lead.findMany({
    where: { ownerId: authData.userId },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json({ leads })
}

// Public: a visitor submits the lead capture form on someone's profile
export async function POST(req: NextRequest) {
  try {
    const { username, name, phone, email, message } = await req.json()

    if (!username || !name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }

    const owner = await prisma.user.findUnique({ where: { username }, select: { id: true, leadFormEnabled: true } })
    if (!owner || !owner.leadFormEnabled) {
      return NextResponse.json({ error: 'Lead form is not available for this profile' }, { status: 404 })
    }

    const lead = await prisma.lead.create({
      data: {
        ownerId: owner.id,
        name: String(name).slice(0, 200),
        phone: phone ? String(phone).slice(0, 50) : null,
        email: email ? String(email).slice(0, 200) : null,
        message: message ? String(message).slice(0, 2000) : null,
      }
    })

    await prisma.analyticsEvent.create({
      data: { userId: owner.id, type: 'LEAD_CREATED' }
    }).catch(() => {})

    await notify(owner.id, {
      type: 'LEAD_RECEIVED',
      title: 'New lead received',
      message: `${name} sent you a message through your TapConnect profile.`,
      link: '/dashboard/leads',
    })

    return NextResponse.json({ lead: { id: lead.id } }, { status: 201 })
  } catch (error) {
    console.error('Lead submission error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
