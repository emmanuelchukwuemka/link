import { NextRequest, NextResponse } from 'next/server'
import { findMany, insert } from '@/lib/db'
import { requireRole } from '@/lib/auth'
import type { DeliveryZone } from '@/lib/types'

export async function GET() {
  const admin = await requireRole('admin')
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const zones = await findMany<DeliveryZone>('DeliveryZone', { orderBy: '`name` ASC' })
  return NextResponse.json({ zones })
}

export async function POST(req: NextRequest) {
  const admin = await requireRole('admin')
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { name, fee } = await req.json()
  if (!name || fee === undefined) {
    return NextResponse.json({ error: 'Name and fee are required' }, { status: 400 })
  }

  const zone = await insert<DeliveryZone>('DeliveryZone', { name, fee: parseFloat(fee) })
  return NextResponse.json({ zone }, { status: 201 })
}
