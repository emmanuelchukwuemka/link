import { NextRequest, NextResponse } from 'next/server'
import { findById, updateById } from '@/lib/db'
import { requireRole } from '@/lib/auth'
import type { User } from '@/lib/types'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  const admin = await requireRole('admin')
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { userId } = await params
  const { plan, planExpiresAt } = await req.json()

  if (!['free', 'pro'].includes(plan)) {
    return NextResponse.json({ error: 'plan must be free or pro' }, { status: 400 })
  }

  const user = await findById<User>('User', userId)
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })
  if (user.accountType !== 'individual') {
    return NextResponse.json({ error: 'Only individual accounts can have a Pro subscription' }, { status: 400 })
  }

  const updatedRow = await updateById<User>('User', userId, {
    plan,
    planExpiresAt: plan === 'free' ? null : planExpiresAt ? new Date(planExpiresAt) : null,
  })
  const updated = updatedRow && { id: updatedRow.id, username: updatedRow.username, displayName: updatedRow.displayName, email: updatedRow.email, plan: updatedRow.plan, planExpiresAt: updatedRow.planExpiresAt }

  return NextResponse.json({ user: updated })
}
