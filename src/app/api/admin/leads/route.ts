import { NextRequest, NextResponse } from 'next/server'
import { findMany, findById, insert } from '@/lib/db'
import { requireRole } from '@/lib/auth'
import type { Lead, User } from '@/lib/types'

async function withOwner<T extends { ownerId: string }>(leads: T[]) {
  const ownerIds = [...new Set(leads.map((l) => l.ownerId))]
  const owners = ownerIds.length ? await findMany<User>('User', { where: { id: ownerIds } }) : []
  const ownerMap = new Map(owners.map((o) => [o.id, { username: o.username, displayName: o.displayName }]))
  return leads.map((l) => ({ ...l, owner: ownerMap.get(l.ownerId) ?? null }))
}

export async function GET() {
  const admin = await requireRole('admin')
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const leadRows = await findMany<Lead>('Lead', { orderBy: '`createdAt` DESC', limit: 500 })
  const leads = await withOwner(leadRows)

  return NextResponse.json({ leads })
}

export async function POST(req: NextRequest) {
  const admin = await requireRole('admin')
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { ownerId, name, email, phone, message, source, status } = await req.json()

  if (!ownerId || !name) {
    return NextResponse.json({ error: 'Owner and name are required' }, { status: 400 })
  }

  const owner = await findById<User>('User', ownerId)
  if (!owner) return NextResponse.json({ error: 'Owner not found' }, { status: 404 })

  const createdLead = await insert<Lead>('Lead', {
    ownerId,
    name,
    email: email || null,
    phone: phone || null,
    message: message || null,
    source: source || 'Other',
    status: status || 'new',
  })
  const [lead] = await withOwner([createdLead])

  return NextResponse.json({ lead }, { status: 201 })
}
