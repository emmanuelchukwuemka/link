import { NextRequest, NextResponse } from 'next/server'
import { findMany, findById, insert } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { isProActive } from '@/lib/subscription'
import type { PortfolioItem, User } from '@/lib/types'

export async function GET() {
  try {
    const authData = await getCurrentUser()
    if (!authData) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

    const items = await findMany<PortfolioItem>('PortfolioItem', { where: { userId: authData.userId }, orderBy: '`position` ASC' })

    return NextResponse.json({ items })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const authData = await getCurrentUser()
    if (!authData) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

    const user = await findById<User>('User', authData.userId)
    if (!isProActive(user?.plan || 'free', user?.planExpiresAt || null)) {
      return NextResponse.json({ error: 'Portfolio and gallery sections are a Pro feature. Upgrade to add them.' }, { status: 403 })
    }

    const { title, description, imageUrl, videoUrl, type } = await req.json()

    const [last] = await findMany<PortfolioItem>('PortfolioItem', { where: { userId: authData.userId }, orderBy: '`position` DESC', limit: 1 })
    const position = last ? last.position + 1 : 0

    const item = await insert<PortfolioItem>('PortfolioItem', {
      title: title || (type === 'gallery' ? 'New Image' : 'New Project'),
      description: description ?? null,
      imageUrl: imageUrl ?? null,
      videoUrl: videoUrl ?? null,
      type: type === 'gallery' ? 'gallery' : 'project',
      position,
      userId: authData.userId,
    })

    return NextResponse.json({ item }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
