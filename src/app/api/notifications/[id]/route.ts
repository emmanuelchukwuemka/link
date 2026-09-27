import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authData = await getCurrentUser()
  if (!authData) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const { id } = await params
  const existing = await prisma.notification.findUnique({ where: { id } })
  if (!existing || existing.userId !== authData.userId) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const notification = await prisma.notification.update({ where: { id }, data: { read: true } })
  return NextResponse.json({ notification })
}
