import { NextResponse } from 'next/server'
import { findMany } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import type { Card } from '@/lib/types'

export async function GET() {
  const authData = await getCurrentUser()
  if (!authData) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const cards = await findMany<Card>('Card', { where: { userId: authData.userId }, orderBy: '`assignedAt` DESC' })

  return NextResponse.json({ cards })
}
