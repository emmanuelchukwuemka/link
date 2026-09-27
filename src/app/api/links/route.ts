import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { isProActive, FREE_LINK_LIMIT } from '@/lib/subscription'

export async function GET() {
  try {
    const authData = await getCurrentUser()
    if (!authData) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

    const links = await prisma.link.findMany({
      where: { userId: authData.userId },
      orderBy: { position: 'asc' }
    })

    return NextResponse.json({ links })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const authData = await getCurrentUser()
    if (!authData) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

    const { title, url, thumbnail, iconName, description } = await req.json()

    const [linkCount, user] = await Promise.all([
      prisma.link.count({ where: { userId: authData.userId } }),
      prisma.user.findUnique({ where: { id: authData.userId }, select: { plan: true, planExpiresAt: true } }),
    ])
    const isPro = isProActive(user?.plan || 'free', user?.planExpiresAt || null)
    if (!isPro && linkCount >= FREE_LINK_LIMIT) {
      return NextResponse.json(
        { error: `Free plans are limited to ${FREE_LINK_LIMIT} links. Upgrade to Pro for unlimited links.` },
        { status: 403 }
      )
    }

    // Get highest position
    const lastLink = await prisma.link.findFirst({
      where: { userId: authData.userId },
      orderBy: { position: 'desc' }
    })
    const position = lastLink ? lastLink.position + 1 : 0

    const link = await prisma.link.create({
      data: {
        title: title || 'New Link',
        url: url || '',
        thumbnail,
        iconName,
        description,
        position,
        userId: authData.userId
      }
    })

    return NextResponse.json({ link }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
