import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/auth'

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireRole('admin')
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id } = await params
  const { name, fee } = await req.json()

  const zone = await prisma.deliveryZone.update({
    where: { id },
    data: { name, fee: fee !== undefined ? parseFloat(fee) : undefined },
  })

  return NextResponse.json({ zone })
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireRole('admin')
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id } = await params
  await prisma.deliveryZone.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
