import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/auth'

export async function GET() {
  const admin = await requireRole('admin')
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const leads = await prisma.lead.findMany({
    include: { owner: { select: { username: true, displayName: true } } },
    orderBy: { createdAt: 'desc' },
    take: 500,
  })

  return NextResponse.json({ leads })
}

export async function POST(req: NextRequest) {
  const admin = await requireRole('admin')
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { ownerId, name, email, phone, message, source, status } = await req.json()

  if (!ownerId || !name) {
    return NextResponse.json({ error: 'Owner and name are required' }, { status: 400 })
  }

  const owner = await prisma.user.findUnique({ where: { id: ownerId }, select: { id: true } })
  if (!owner) return NextResponse.json({ error: 'Owner not found' }, { status: 404 })

  const lead = await prisma.lead.create({
    data: {
      ownerId,
      name,
      email: email || null,
      phone: phone || null,
      message: message || null,
      source: source || 'Other',
      status: status || 'new',
    },
    include: { owner: { select: { username: true, displayName: true } } },
  })

  return NextResponse.json({ lead }, { status: 201 })
}
