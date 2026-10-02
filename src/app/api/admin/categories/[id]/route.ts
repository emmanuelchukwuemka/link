import { NextRequest, NextResponse } from 'next/server'
import { findById, removeById, updateById, query } from '@/lib/db'
import { requireRole } from '@/lib/auth'
import type { Category } from '@/lib/types'

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireRole('admin')
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id } = await params
  const category = await findById<Category>('Category', id)
  if (!category || category.scope !== 'marketplace') {
    return NextResponse.json({ error: 'Category not found' }, { status: 404 })
  }

  await removeById('Category', id)
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

  const category = await findById<Category>('Category', id)
  if (!category || category.scope !== 'marketplace') {
    return NextResponse.json({ error: 'Category not found' }, { status: 404 })
  }

  const trimmed = name.trim()
  const clashRows = category.parentId
    ? await query<Category>('SELECT * FROM `Category` WHERE `scope` = ? AND `parentId` = ? AND `name` = ? AND `id` != ? LIMIT 1', ['marketplace', category.parentId, trimmed, id])
    : await query<Category>('SELECT * FROM `Category` WHERE `scope` = ? AND `parentId` IS NULL AND `name` = ? AND `id` != ? LIMIT 1', ['marketplace', trimmed, id])
  if (clashRows[0]) {
    return NextResponse.json({ error: 'That category already exists' }, { status: 409 })
  }

  const updated = await updateById<Category>('Category', id, { name: trimmed })
  return NextResponse.json({ category: updated })
}
