import { NextResponse } from 'next/server'
import { findOne, findMany, query } from '@/lib/db'
import { requireRole } from '@/lib/auth'
import type { Business, User, Card } from '@/lib/types'

export async function GET() {
  const admin = await requireRole('business_admin')
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const business = await findOne<Business>('Business', { ownerId: admin.id })
  if (!business) return NextResponse.json({ error: 'Business not found' }, { status: 404 })

  const employees = await findMany<User>('User', { where: { businessId: business.id } })
  const employeeIds = employees.map((u) => u.id)

  const cards = employeeIds.length
    ? await query<Card>(
        'SELECT * FROM `Card` WHERE `businessId` = ? OR `userId` IN (?) ORDER BY `createdAt` DESC',
        [business.id, employeeIds]
      )
    : await findMany<Card>('Card', { where: { businessId: business.id }, orderBy: '`createdAt` DESC' })

  const userMap = new Map(employees.map((u) => [u.id, u]))
  const cardsWithUser = cards.map((c) => ({
    ...c,
    user: c.userId && userMap.has(c.userId) ? { id: userMap.get(c.userId)!.id, username: userMap.get(c.userId)!.username, displayName: userMap.get(c.userId)!.displayName } : null,
  }))

  return NextResponse.json({ cards: cardsWithUser })
}
