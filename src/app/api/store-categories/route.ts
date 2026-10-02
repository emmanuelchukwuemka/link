import { NextRequest, NextResponse } from 'next/server'
import { findMany, insert } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import type { Category } from '@/lib/types'

export async function GET() {
  const authData = await getCurrentUser()
  if (!authData) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const categories = await findMany<Category>('Category', { where: { scope: 'store', userId: authData.userId }, orderBy: '`position` ASC' })
  return NextResponse.json({ categories })
}

export async function POST(req: NextRequest) {
  const authData = await getCurrentUser()
  if (!authData) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const { name } = await req.json()
  if (!name || !name.trim()) {
    return NextResponse.json({ error: 'Category name is required' }, { status: 400 })
  }

  const [last] = await findMany<Category>('Category', { where: { scope: 'store', userId: authData.userId }, orderBy: '`position` DESC', limit: 1 })

  try {
    const category = await insert<Category>('Category', {
      name: name.trim(),
      scope: 'store',
      userId: authData.userId,
      position: last ? last.position + 1 : 0,
    })
    return NextResponse.json({ category }, { status: 201 })
  } catch (e) {
    if ((e as { code?: string }).code === 'ER_DUP_ENTRY') {
      return NextResponse.json({ error: 'That category already exists' }, { status: 409 })
    }
    throw e
  }
}
