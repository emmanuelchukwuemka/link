import { NextRequest, NextResponse } from 'next/server'
import { findById, updateById } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import type { Notification } from '@/lib/types'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authData = await getCurrentUser()
  if (!authData) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const { id } = await params
  const existing = await findById<Notification>('Notification', id)
  if (!existing || existing.userId !== authData.userId) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const notification = await updateById<Notification>('Notification', id, { read: true })
  return NextResponse.json({ notification })
}
