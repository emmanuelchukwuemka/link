import { NextRequest, NextResponse } from 'next/server'
import { findMany, findById, count, insert } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { isProActive, FREE_LINK_LIMIT } from '@/lib/subscription'
import type { Link, User } from '@/lib/types'

export async function GET() {
  try {
    const authData = await getCurrentUser()
    if (!authData) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

    const links = await findMany<Link>('Link', { where: { userId: authData.userId }, orderBy: '`position` ASC' })

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
      count('Link', { userId: authData.userId }),
      findById<User>('User', authData.userId),
    ])
    const isPro = isProActive(user?.plan || 'free', user?.planExpiresAt || null)
    if (!isPro && linkCount >= FREE_LINK_LIMIT) {
      return NextResponse.json(
        { error: `Free plans are limited to ${FREE_LINK_LIMIT} links. Upgrade to Pro for unlimited links.` },
        { status: 403 }
      )
    }

    // Get highest position
    const [lastLink] = await findMany<Link>('Link', { where: { userId: authData.userId }, orderBy: '`position` DESC', limit: 1 })
    const position = lastLink ? lastLink.position + 1 : 0

    const link = await insert<Link>('Link', {
      title: title || 'New Link',
      url: url || '',
      thumbnail: thumbnail ?? null,
      iconName: iconName ?? null,
      description: description ?? null,
      position,
      userId: authData.userId,
    })

    return NextResponse.json({ link }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
