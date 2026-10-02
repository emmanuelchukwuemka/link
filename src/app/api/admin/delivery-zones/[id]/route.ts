import { NextRequest, NextResponse } from 'next/server'
import { updateById, removeById } from '@/lib/db'
import { requireRole } from '@/lib/auth'
import type { DeliveryZone } from '@/lib/types'

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireRole('admin')
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id } = await params
  const { name, fee } = await req.json()

  const zone = await updateById<DeliveryZone>('DeliveryZone', id, { name, fee: fee !== undefined ? parseFloat(fee) : undefined })

  return NextResponse.json({ zone })
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireRole('admin')
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id } = await params
  await removeById('DeliveryZone', id)
  return NextResponse.json({ success: true })
}
