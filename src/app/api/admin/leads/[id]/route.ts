import { NextRequest, NextResponse } from 'next/server'
import { findById, updateById, removeById } from '@/lib/db'
import { requireRole } from '@/lib/auth'
import type { Lead, User } from '@/lib/types'

const VALID_STATUSES = ['new', 'contacted', 'interested', 'converted', 'lost']

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireRole('admin')
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id } = await params
  const { name, email, phone, message, source, status, notes } = await req.json()

  if (status !== undefined && !VALID_STATUSES.includes(status)) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
  }

  const existing = await findById<Lead>('Lead', id)
  if (!existing) return NextResponse.json({ error: 'Lead not found' }, { status: 404 })

  const updatedLead = await updateById<Lead>('Lead', id, {
    name: name !== undefined ? name : undefined,
    email: email !== undefined ? (email || null) : undefined,
    phone: phone !== undefined ? (phone || null) : undefined,
    message: message !== undefined ? (message || null) : undefined,
    source: source !== undefined ? source : undefined,
    status: status !== undefined ? status : undefined,
    notes: notes !== undefined ? (notes || null) : undefined,
  })
  const owner = updatedLead ? await findById<User>('User', updatedLead.ownerId) : null
  const lead = updatedLead && { ...updatedLead, owner: owner ? { username: owner.username, displayName: owner.displayName } : null }

  return NextResponse.json({ lead })
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireRole('admin')
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id } = await params
  await removeById('Lead', id)
  return NextResponse.json({ success: true })
}
