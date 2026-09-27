import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/auth'

const ALLOWED_FIELDS = [
  'name', 'logoUrl', 'description', 'website', 'phone', 'whatsapp',
  'email', 'address', 'category', 'businessHours', 'brandColor',
] as const

export async function GET() {
  const admin = await requireRole('business_admin')
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const business = await prisma.business.findUnique({ where: { ownerId: admin.id } })
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

  const business = await prisma.business.update({
    where: { ownerId: admin.id },
    data: updateData,
  })

  return NextResponse.json({ business })
}
