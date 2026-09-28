import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/auth'

type CategoryNode = {
  id: string
  name: string
  position: number
  parentId: string | null
  directCount: number
  totalCount: number
  children: CategoryNode[]
}

export async function GET() {
  const admin = await requireRole('admin')
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const [categories, products] = await Promise.all([
    prisma.category.findMany({ where: { scope: 'marketplace' }, orderBy: { position: 'asc' } }),
    prisma.product.findMany({ select: { category: true } }),
  ])

  const directCounts = new Map<string, number>()
  for (const p of products) directCounts.set(p.category, (directCounts.get(p.category) || 0) + 1)

  const byId = new Map<string, CategoryNode>()
  for (const c of categories) {
    byId.set(c.id, {
      id: c.id,
      name: c.name,
      position: c.position,
      parentId: c.parentId,
      directCount: directCounts.get(c.name) || 0,
      totalCount: 0,
      children: [],
    })
  }

  const roots: CategoryNode[] = []
  for (const c of categories) {
    const node = byId.get(c.id)!
    if (c.parentId && byId.has(c.parentId)) byId.get(c.parentId)!.children.push(node)
    else roots.push(node)
  }

  const computeTotal = (node: CategoryNode): number => {
    node.totalCount = node.directCount + node.children.reduce((sum, child) => sum + computeTotal(child), 0)
    return node.totalCount
  }
  roots.forEach(computeTotal)

  return NextResponse.json({ categories: roots })
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
    const parent = await prisma.category.findUnique({ where: { id: normalizedParentId } })
    if (!parent || parent.scope !== 'marketplace') {
      return NextResponse.json({ error: 'Parent category not found' }, { status: 404 })
    }
    if (parent.parentId) {
      return NextResponse.json({ error: 'Subcategories cannot be nested more than one level deep' }, { status: 400 })
    }
  }

  // SQLite treats every NULL as distinct, so the unique index never actually fires
  // when parentId/userId is null — check explicitly instead of relying on it.
  const existing = await prisma.category.findFirst({
    where: { scope: 'marketplace', parentId: normalizedParentId, name: trimmed },
  })
  if (existing) {
    return NextResponse.json({ error: 'That category already exists' }, { status: 409 })
  }

  const last = await prisma.category.findFirst({
    where: { scope: 'marketplace', parentId: normalizedParentId },
    orderBy: { position: 'desc' },
  })

  const category = await prisma.category.create({
    data: { name: trimmed, scope: 'marketplace', parentId: normalizedParentId, position: last ? last.position + 1 : 0 },
  })

  return NextResponse.json({ category }, { status: 201 })
}
