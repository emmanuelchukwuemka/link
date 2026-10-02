import { NextRequest, NextResponse } from 'next/server'
import { updateWhere } from '@/lib/db'
import { requireRole } from '@/lib/auth'

export async function POST(req: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  const admin = await requireRole('admin')
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { userId } = await params
  await updateWhere('SupportMessage', { userId, sender: 'user', read: false }, { read: true })

  return NextResponse.json({ success: true })
}
