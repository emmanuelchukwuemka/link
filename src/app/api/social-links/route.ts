import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

export async function GET() {
  try {
    const authData = await getCurrentUser()
    if (!authData) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

    const socialLinks = await prisma.socialLink.findMany({
      where: { userId: authData.userId },
      orderBy: { position: 'asc' }
    })

    return NextResponse.json({ socialLinks })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const authData = await getCurrentUser()
    if (!authData) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

    const { platform, url } = await req.json()
    if (!platform || !url) {
      return NextResponse.json({ error: 'Platform and URL are required' }, { status: 400 })
    }

    const last = await prisma.socialLink.findFirst({
      where: { userId: authData.userId },
      orderBy: { position: 'desc' }
    })
    const position = last ? last.position + 1 : 0

    const socialLink = await prisma.socialLink.create({
      data: { platform, url, position, userId: authData.userId }
    })

    return NextResponse.json({ socialLink }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
