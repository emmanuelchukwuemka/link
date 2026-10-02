import { NextRequest, NextResponse } from 'next/server'
import { findMany, insert } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import type { SocialLink } from '@/lib/types'

export async function GET() {
  try {
    const authData = await getCurrentUser()
    if (!authData) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

    const socialLinks = await findMany<SocialLink>('SocialLink', { where: { userId: authData.userId }, orderBy: '`position` ASC' })

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

    const [last] = await findMany<SocialLink>('SocialLink', { where: { userId: authData.userId }, orderBy: '`position` DESC', limit: 1 })
    const position = last ? last.position + 1 : 0

    const socialLink = await insert<SocialLink>('SocialLink', { platform, url, position, userId: authData.userId })

    return NextResponse.json({ socialLink }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
