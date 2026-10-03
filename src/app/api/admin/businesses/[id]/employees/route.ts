import { NextRequest, NextResponse } from 'next/server'
import { findMany } from '@/lib/db'
import { requireRole } from '@/lib/auth'
import type { User } from '@/lib/types'

// Platform admin: list a business's team, for assigning reserved cards to a specific person.
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireRole('admin')
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id } = await params
  const rows = await findMany<User>('User', { where: { businessId: id }, orderBy: '`displayName` ASC' })
  const employees = rows.map((u) => ({ id: u.id, username: u.username, displayName: u.displayName, jobTitle: u.jobTitle }))

  return NextResponse.json({ employees })
}
