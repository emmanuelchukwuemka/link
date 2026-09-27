import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

export async function GET() {
  try {
    const authData = await getCurrentUser()
    if (!authData) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

    const testimonials = await prisma.testimonial.findMany({
      where: { userId: authData.userId },
      orderBy: { position: 'asc' }
    })

    return NextResponse.json({ testimonials })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const authData = await getCurrentUser()
    if (!authData) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

    const { authorName, content, rating } = await req.json()

    const last = await prisma.testimonial.findFirst({
      where: { userId: authData.userId },
      orderBy: { position: 'desc' }
    })
    const position = last ? last.position + 1 : 0

    const testimonial = await prisma.testimonial.create({
      data: {
        authorName: authorName || 'Anonymous',
        content: content || '',
        rating: rating ?? 5,
        position,
        userId: authData.userId
      }
    })

    return NextResponse.json({ testimonial }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
