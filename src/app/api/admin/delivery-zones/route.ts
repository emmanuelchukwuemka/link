import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/auth'

export async function GET() {
  const admin = await requireRole('admin')
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const zones = await prisma.deliveryZone.findMany({ orderBy: { name: 'asc' } })
  return NextResponse.json({ zones })
}

export async function POST(req: NextRequest) {
  const admin = await requireRole('admin')
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { name, fee } = await req.json()
  if (!name || fee === undefined) {
    return NextResponse.json({ error: 'Name and fee are required' }, { status: 400 })
  }

  const zone = await prisma.deliveryZone.create({ data: { name, fee: parseFloat(fee) } })
  return NextResponse.json({ zone }, { status: 201 })
}
