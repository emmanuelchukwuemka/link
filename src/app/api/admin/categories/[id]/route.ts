import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/auth'

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireRole('admin')
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id } = await params
  const category = await prisma.category.findUnique({ where: { id } })
  if (!category || category.scope !== 'marketplace') {
    return NextResponse.json({ error: 'Category not found' }, { status: 404 })
  }

  await prisma.category.delete({ where: { id } })
  return NextResponse.json({ success: true })
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireRole('admin')
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id } = await params
  const { name } = await req.json()
  if (!name || !name.trim()) {
    return NextResponse.json({ error: 'Category name is required' }, { status: 400 })
  }

  const category = await prisma.category.findUnique({ where: { id } })
  if (!category || category.scope !== 'marketplace') {
    return NextResponse.json({ error: 'Category not found' }, { status: 404 })
  }

  const trimmed = name.trim()
  const clash = await prisma.category.findFirst({ where: { scope: 'marketplace', name: trimmed, NOT: { id } } })
  if (clash) {
    return NextResponse.json({ error: 'That category already exists' }, { status: 409 })
  }

  const updated = await prisma.category.update({ where: { id }, data: { name: trimmed } })
  return NextResponse.json({ category: updated })
}
