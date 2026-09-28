import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/auth'

export async function POST(req: NextRequest) {
  const admin = await requireRole('admin')
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { parentId, orderedIds } = await req.json()
  if (!Array.isArray(orderedIds) || orderedIds.length === 0) {
    return NextResponse.json({ error: 'orderedIds must be a non-empty array' }, { status: 400 })
  }
  const normalizedParentId: string | null = parentId || null

  const categories = await prisma.category.findMany({ where: { id: { in: orderedIds }, scope: 'marketplace' } })
  const allBelongToParent = categories.length === orderedIds.length
    && categories.every((c) => (c.parentId || null) === normalizedParentId)
  if (!allBelongToParent) {
    return NextResponse.json({ error: 'Invalid category set for reorder' }, { status: 400 })
  }

  await Promise.all(orderedIds.map((id: string, index: number) =>
    prisma.category.update({ where: { id }, data: { position: index } })
  ))

  return NextResponse.json({ success: true })
}
