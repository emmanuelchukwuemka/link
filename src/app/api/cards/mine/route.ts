import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

export async function GET() {
  const authData = await getCurrentUser()
  if (!authData) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const cards = await prisma.card.findMany({
    where: { userId: authData.userId },
    orderBy: { assignedAt: 'desc' },
  })

  return NextResponse.json({ cards })
}
