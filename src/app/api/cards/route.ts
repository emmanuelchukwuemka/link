import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/auth'
import { generateUniqueCardCode } from '@/lib/cards'

// Platform admin: list all cards, or generate new unassigned batches
export async function GET(req: NextRequest) {
  const admin = await requireRole('admin')
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status')

  const cards = await prisma.card.findMany({
    where: status ? { status } : undefined,
    include: {
      user: { select: { id: true, username: true, displayName: true } },
      business: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json({ cards })
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

  await prisma.card.createMany({
    data: codes.map((code) => ({ code })),
  })

  const cards = await prisma.card.findMany({ where: { code: { in: codes } } })

  return NextResponse.json({ cards }, { status: 201 })
}
