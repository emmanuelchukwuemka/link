import { NextRequest, NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/auth'

export async function GET() {
  const admin = await requireRole('admin')
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const categories = await prisma.category.findMany({
    where: { scope: 'marketplace' },
    orderBy: { position: 'asc' },
  })
  return NextResponse.json({ categories })
}

export async function POST(req: NextRequest) {
  const admin = await requireRole('admin')
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { name } = await req.json()
  if (!name || !name.trim()) {
    return NextResponse.json({ error: 'Category name is required' }, { status: 400 })
  }
  const trimmed = name.trim()

  // SQLite treats every NULL as distinct, so the (scope, userId, name) unique index
  // never actually fires for marketplace categories (userId is always null there) —
  // check explicitly instead of relying on the DB constraint to catch duplicates.
  const existing = await prisma.category.findFirst({ where: { scope: 'marketplace', name: trimmed } })
  if (existing) {
    return NextResponse.json({ error: 'That category already exists' }, { status: 409 })
  }

  const last = await prisma.category.findFirst({ where: { scope: 'marketplace' }, orderBy: { position: 'desc' } })

  try {
    const category = await prisma.category.create({
      data: { name: trimmed, scope: 'marketplace', position: last ? last.position + 1 : 0 },
    })
    return NextResponse.json({ category }, { status: 201 })
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
      return NextResponse.json({ error: 'That category already exists' }, { status: 409 })
    }
    throw e
  }
}
