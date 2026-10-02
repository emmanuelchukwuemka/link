import { NextRequest, NextResponse } from 'next/server'
import { findById, removeById } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import type { Category } from '@/lib/types'

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authData = await getCurrentUser()
  if (!authData) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const { id } = await params
  const category = await findById<Category>('Category', id)
  if (!category || category.scope !== 'store' || category.userId !== authData.userId) {
    return NextResponse.json({ error: 'Category not found' }, { status: 404 })
  }

  await removeById('Category', id)
  return NextResponse.json({ success: true })
}
