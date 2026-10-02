import { NextRequest, NextResponse } from 'next/server'
import { findMany, insert } from '@/lib/db'
import { requireRole } from '@/lib/auth'
import { generateUniqueCardCode } from '@/lib/cards'
import type { Card, User, Business } from '@/lib/types'

// Platform admin: list all cards, or generate new unassigned batches
export async function GET(req: NextRequest) {
  const admin = await requireRole('admin')
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status')

  const cards = await findMany<Card>('Card', { where: status ? { status } : undefined, orderBy: '`createdAt` DESC' })

  const userIds = [...new Set(cards.map((c) => c.userId).filter((v): v is string => !!v))]
  const businessIds = [...new Set(cards.map((c) => c.businessId).filter((v): v is string => !!v))]
  const [users, businesses] = await Promise.all([
    userIds.length ? findMany<User>('User', { where: { id: userIds } }) : Promise.resolve([]),
    businessIds.length ? findMany<Business>('Business', { where: { id: businessIds } }) : Promise.resolve([]),
  ])
  const userMap = new Map(users.map((u) => [u.id, u]))
  const businessMap = new Map(businesses.map((b) => [b.id, b]))

  return NextResponse.json({
    cards: cards.map((c) => ({
      ...c,
      user: c.userId && userMap.has(c.userId) ? { id: userMap.get(c.userId)!.id, username: userMap.get(c.userId)!.username, displayName: userMap.get(c.userId)!.displayName } : null,
      business: c.businessId && businessMap.has(c.businessId) ? { id: businessMap.get(c.businessId)!.id, name: businessMap.get(c.businessId)!.name } : null,
    })),
  })
}

export async function POST(req: NextRequest) {
  const admin = await requireRole('admin')
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { count = 1 } = await req.json().catch(() => ({ count: 1 }))
  const n = Math.min(Math.max(parseInt(count, 10) || 1, 1), 500)

  const codes: string[] = []
  for (let i = 0; i < n; i++) {
    codes.push(await generateUniqueCardCode())
  }

  const cards = await Promise.all(codes.map((code) => insert<Card>('Card', { code })))

  return NextResponse.json({ cards }, { status: 201 })
}
