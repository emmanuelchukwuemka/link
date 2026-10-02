import { NextRequest, NextResponse } from 'next/server'
import { findById, updateById, removeById } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import type { PortfolioItem } from '@/lib/types'

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const authData = await getCurrentUser()
    if (!authData) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

    const { id } = await params
    const { title, description, imageUrl, videoUrl } = await req.json()

    const existing = await findById<PortfolioItem>('PortfolioItem', id)
    if (!existing || existing.userId !== authData.userId) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    const item = await updateById<PortfolioItem>('PortfolioItem', id, { title, description, imageUrl, videoUrl })

    return NextResponse.json({ item })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const authData = await getCurrentUser()
    if (!authData) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

    const { id } = await params

    const existing = await findById<PortfolioItem>('PortfolioItem', id)
    if (!existing || existing.userId !== authData.userId) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    await removeById('PortfolioItem', id)

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
