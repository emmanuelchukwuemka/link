import { NextRequest, NextResponse } from 'next/server'
import { findById, updateById, removeById } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import type { Service } from '@/lib/types'

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const authData = await getCurrentUser()
    if (!authData) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

    const { id } = await params
    const { name, description, price, ctaType } = await req.json()

    const existing = await findById<Service>('Service', id)
    if (!existing || existing.userId !== authData.userId) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    const service = await updateById<Service>('Service', id, { name, description, price, ctaType })

    return NextResponse.json({ service })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const authData = await getCurrentUser()
    if (!authData) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

    const { id } = await params

    const existing = await findById<Service>('Service', id)
    if (!existing || existing.userId !== authData.userId) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    await removeById('Service', id)

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
