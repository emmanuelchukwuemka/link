import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { isProActive } from '@/lib/subscription'

export async function GET() {
  try {
    const authData = await getCurrentUser()
    if (!authData) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

    const services = await prisma.service.findMany({
      where: { userId: authData.userId },
      orderBy: { position: 'asc' }
    })

    return NextResponse.json({ services })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const authData = await getCurrentUser()
    if (!authData) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

    const user = await prisma.user.findUnique({ where: { id: authData.userId }, select: { plan: true, planExpiresAt: true } })
    if (!isProActive(user?.plan || 'free', user?.planExpiresAt || null)) {
      return NextResponse.json({ error: 'Services are a Pro feature. Upgrade to add service listings.' }, { status: 403 })
    }

    const { name, description, price, ctaType } = await req.json()

    const last = await prisma.service.findFirst({
      where: { userId: authData.userId },
      orderBy: { position: 'desc' }
    })
    const position = last ? last.position + 1 : 0

    const service = await prisma.service.create({
      data: {
        name: name || 'New Service',
        description,
        price,
        ctaType: ctaType || 'contact',
        position,
        userId: authData.userId
      }
    })

    return NextResponse.json({ service }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
