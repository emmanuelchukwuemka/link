import { NextResponse } from 'next/server'
import { findById, findMany, findOne } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { checkSubscriptionExpiry } from '@/lib/notify'
import type { User, Link, SocialLink, Business } from '@/lib/types'

export async function GET() {
  try {
    const authData = await getCurrentUser()

    if (!authData) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const userRow = await findById<User>('User', authData.userId)

    if (!userRow) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const { password: _password, ...rest } = userRow
    void _password
    const [links, socialLinks, ownedBusiness] = await Promise.all([
      findMany<Link>('Link', { where: { userId: userRow.id }, orderBy: '`position` ASC' }),
      findMany<SocialLink>('SocialLink', { where: { userId: userRow.id }, orderBy: '`position` ASC' }),
      findOne<Business>('Business', { ownerId: userRow.id }),
    ])
    const user = { ...rest, links, socialLinks, ownedBusiness }

    await checkSubscriptionExpiry(user.id)

    return NextResponse.json({ user })
  } catch (error) {
    console.error('Me error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
