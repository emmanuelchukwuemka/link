import { NextRequest, NextResponse } from 'next/server'
import { findMany, insert } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import type { Testimonial } from '@/lib/types'

export async function GET() {
  try {
    const authData = await getCurrentUser()
    if (!authData) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

    const testimonials = await findMany<Testimonial>('Testimonial', { where: { userId: authData.userId }, orderBy: '`position` ASC' })

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

    const [last] = await findMany<Testimonial>('Testimonial', { where: { userId: authData.userId }, orderBy: '`position` DESC', limit: 1 })
    const position = last ? last.position + 1 : 0

    const testimonial = await insert<Testimonial>('Testimonial', {
      authorName: authorName || 'Anonymous',
      content: content || '',
      rating: rating ?? 5,
      position,
      userId: authData.userId,
    })

    return NextResponse.json({ testimonial }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
