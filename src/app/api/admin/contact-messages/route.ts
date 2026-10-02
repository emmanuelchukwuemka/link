import { NextResponse } from 'next/server'
import { findMany } from '@/lib/db'
import { requireRole } from '@/lib/auth'
import type { ContactMessage } from '@/lib/types'

export async function GET() {
  const admin = await requireRole('admin')
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const messages = await findMany<ContactMessage>('ContactMessage', { orderBy: '`createdAt` DESC' })
  return NextResponse.json({ messages })
}
