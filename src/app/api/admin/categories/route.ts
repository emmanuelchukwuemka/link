import { NextRequest, NextResponse } from 'next/server'
import { findMany, findOne, findById, insert } from '@/lib/db'
import { requireRole } from '@/lib/auth'
import { buildCategoryTree } from '@/lib/categoryTree'
import type { Category, Product } from '@/lib/types'

export async function GET() {
  const admin = await requireRole('admin')
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const [categories, products] = await Promise.all([
    findMany<Category>('Category', { where: { scope: 'marketplace' }, orderBy: '`position` ASC' }),
    findMany<Pick<Product, 'category'>>('Product', {}),
  ])

  return NextResponse.json({ categories: buildCategoryTree(categories, products) })
}

export async function POST(req: NextRequest) {
  const admin = await requireRole('admin')
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { name, parentId } = await req.json()
  if (!name || !name.trim()) {
    return NextResponse.json({ error: 'Category name is required' }, { status: 400 })
  }
  const trimmed = name.trim()
  const normalizedParentId: string | null = parentId || null

  if (normalizedParentId) {
    const parent = await findById<Category>('Category', normalizedParentId)
    if (!parent || parent.scope !== 'marketplace') {
      return NextResponse.json({ error: 'Parent category not found' }, { status: 404 })
    }
    if (parent.parentId) {
      return NextResponse.json({ error: 'Subcategories cannot be nested more than one level deep' }, { status: 400 })
    }
  }

  // SQL treats every NULL as distinct (true in SQLite, MySQL and Postgres alike), so
  // the unique index never actually fires when parentId/userId is null — check
  // explicitly instead of relying on it.
  const existing = await findOne<Category>('Category', { scope: 'marketplace', parentId: normalizedParentId, name: trimmed })
  if (existing) {
    return NextResponse.json({ error: 'That category already exists' }, { status: 409 })
  }

  const [last] = await findMany<Category>('Category', { where: { scope: 'marketplace', parentId: normalizedParentId }, orderBy: '`position` DESC', limit: 1 })

  const category = await insert<Category>('Category', {
    name: trimmed,
    scope: 'marketplace',
    parentId: normalizedParentId,
    position: last ? last.position + 1 : 0,
  })

  return NextResponse.json({ category }, { status: 201 })
}
