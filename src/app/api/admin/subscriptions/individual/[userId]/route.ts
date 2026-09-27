import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/auth'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  const admin = await requireRole('admin')
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { userId } = await params
  const { plan, planExpiresAt } = await req.json()

  if (!['free', 'pro'].includes(plan)) {
    return NextResponse.json({ error: 'plan must be free or pro' }, { status: 400 })
  }

  const user = await prisma.user.findUnique({ where: { id: userId }, select: { accountType: true } })
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })
  if (user.accountType !== 'individual') {
    return NextResponse.json({ error: 'Only individual accounts can have a Pro subscription' }, { status: 400 })
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data: { plan, planExpiresAt: plan === 'free' ? null : planExpiresAt ? new Date(planExpiresAt) : null },
    select: { id: true, username: true, displayName: true, email: true, plan: true, planExpiresAt: true },
  })

  return NextResponse.json({ user: updated })
}
