import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/auth'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireRole('admin')
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id } = await params
  const { isActive } = await req.json()

  if (typeof isActive !== 'boolean') {
    return NextResponse.json({ error: 'isActive must be a boolean' }, { status: 400 })
  }
  if (id === admin.id) {
    return NextResponse.json({ error: 'You cannot suspend your own account' }, { status: 400 })
  }

  const user = await prisma.user.update({
    where: { id },
    data: { isActive },
    select: { id: true, isActive: true },
  })

  return NextResponse.json({ user })
}
