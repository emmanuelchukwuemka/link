import { NextRequest, NextResponse } from 'next/server'
import { findOne, updateWhere } from '@/lib/db'
import { requireRole } from '@/lib/auth'
import type { Business } from '@/lib/types'

const ALLOWED_FIELDS = [
  'name', 'logoUrl', 'description', 'website', 'phone', 'whatsapp',
  'email', 'address', 'category', 'businessHours', 'brandColor',
] as const

export async function GET() {
  const admin = await requireRole('business_admin')
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const business = await findOne<Business>('Business', { ownerId: admin.id })
  return NextResponse.json({ business })
}

export async function PUT(req: NextRequest) {
  const admin = await requireRole('business_admin')
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const data = await req.json()
  const updateData: Record<string, unknown> = {}
  for (const field of ALLOWED_FIELDS) {
    if (field in data) updateData[field] = data[field]
  }

  await updateWhere('Business', { ownerId: admin.id }, updateData)
  const business = await findOne<Business>('Business', { ownerId: admin.id })

  return NextResponse.json({ business })
}
