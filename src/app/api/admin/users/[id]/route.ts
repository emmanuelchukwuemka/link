import { NextRequest, NextResponse } from 'next/server'
import { updateById } from '@/lib/db'
import { requireRole } from '@/lib/auth'
import type { User } from '@/lib/types'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireRole('admin')
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id } = await params
  const { isActive } = await req.json()

  if (typeof isActive !== 'boolean') {
    return NextResponse.json({ error: 'isActive must be a boolean' }, { status: 400 })
  }
  if (id === admin.id) {
    return NextResponse.json({ error: 'You cannot suspend your own account' }, { status: 400 })
  }

  const updatedUser = await updateById<User>('User', id, { isActive })
  const user = updatedUser && { id: updatedUser.id, isActive: updatedUser.isActive }

  return NextResponse.json({ user })
}
