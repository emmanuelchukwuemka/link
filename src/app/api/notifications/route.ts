import { NextResponse } from 'next/server'
import { findMany, count } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import type { Notification } from '@/lib/types'

export async function GET() {
  const authData = await getCurrentUser()
  if (!authData) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const [notifications, unreadCount] = await Promise.all([
    findMany<Notification>('Notification', { where: { userId: authData.userId }, orderBy: '`createdAt` DESC', limit: 30 }),
    count('Notification', { userId: authData.userId, read: false }),
  ])

  return NextResponse.json({ notifications, unreadCount })
}
