import { NextRequest, NextResponse } from 'next/server'
import { findMany, updateWhere } from '@/lib/db'
import { requireRole } from '@/lib/auth'
import type { Category } from '@/lib/types'

export async function POST(req: NextRequest) {
  const admin = await requireRole('admin')
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { parentId, orderedIds } = await req.json()
  if (!Array.isArray(orderedIds) || orderedIds.length === 0) {
    return NextResponse.json({ error: 'orderedIds must be a non-empty array' }, { status: 400 })
  }
  const normalizedParentId: string | null = parentId || null

  const categories = await findMany<Category>('Category', { where: { id: orderedIds, scope: 'marketplace' } })
  const allBelongToParent = categories.length === orderedIds.length
    && categories.every((c) => (c.parentId || null) === normalizedParentId)
  if (!allBelongToParent) {
    return NextResponse.json({ error: 'Invalid category set for reorder' }, { status: 400 })
  }

  await Promise.all(orderedIds.map((id: string, index: number) =>
    updateWhere('Category', { id }, { position: index })
  ))

  return NextResponse.json({ success: true })
}
