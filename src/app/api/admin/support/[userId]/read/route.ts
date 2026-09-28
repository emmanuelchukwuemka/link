import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/auth'

export async function POST(req: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  const admin = await requireRole('admin')
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { userId } = await params
  await prisma.supportMessage.updateMany({
    where: { userId, sender: 'user', read: false },
    data: { read: true },
  })

  return NextResponse.json({ success: true })
}
