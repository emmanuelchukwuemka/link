import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { isProActive } from '@/lib/subscription'

export async function GET() {
  try {
    const authData = await getCurrentUser()
    if (!authData) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

    const items = await prisma.portfolioItem.findMany({
      where: { userId: authData.userId },
      orderBy: { position: 'asc' }
    })

    return NextResponse.json({ items })
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
      return NextResponse.json({ error: 'Portfolio and gallery sections are a Pro feature. Upgrade to add them.' }, { status: 403 })
    }

    const { title, description, imageUrl, videoUrl, type } = await req.json()

    const last = await prisma.portfolioItem.findFirst({
      where: { userId: authData.userId },
      orderBy: { position: 'desc' }
    })
    const position = last ? last.position + 1 : 0

    const item = await prisma.portfolioItem.create({
      data: {
        title: title || (type === 'gallery' ? 'New Image' : 'New Project'),
        description,
        imageUrl,
        videoUrl,
        type: type === 'gallery' ? 'gallery' : 'project',
        position,
        userId: authData.userId
      }
    })

    return NextResponse.json({ item }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
