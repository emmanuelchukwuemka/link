import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { notify } from '@/lib/notify'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export async function POST(req: NextRequest) {
  try {
    const { name, email, phone, message } = await req.json()

    if (typeof name !== 'string' || !name.trim()) {
      return NextResponse.json({ error: 'Please enter your name' }, { status: 400 })
    }
    if (typeof email !== 'string' || !EMAIL_RE.test(email)) {
      return NextResponse.json({ error: 'Enter a valid email address' }, { status: 400 })
    }
    if (typeof message !== 'string' || !message.trim()) {
      return NextResponse.json({ error: 'Please enter a message' }, { status: 400 })
    }

    const contactMessage = await prisma.contactMessage.create({
      data: {
        name: name.trim(),
        email: email.trim(),
        phone: typeof phone === 'string' && phone.trim() ? phone.trim() : null,
        message: message.trim(),
      },
    })

    const admins = await prisma.user.findMany({ where: { accountType: 'admin' }, select: { id: true } })
    await Promise.all(admins.map((a) => notify(a.id, {
      type: 'CONTACT_MESSAGE',
      title: `New contact message from ${name.trim()}`,
      message: message.trim().slice(0, 140),
      link: `/admin/messages/${contactMessage.id}`,
    })))

    return NextResponse.json({ ok: true }, { status: 201 })
  } catch (error) {
    console.error('Contact form error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
