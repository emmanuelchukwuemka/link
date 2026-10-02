import { NextResponse } from 'next/server'
import { findOne, findMany } from '@/lib/db'
import { requireRole } from '@/lib/auth'
import type { Business, User, Lead } from '@/lib/types'

// Business admins can see leads submitted to any of their employees' profiles
// (per the spec's lead-privacy rule: owner + authorized business admins).
export async function GET() {
  const admin = await requireRole('business_admin')
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const business = await findOne<Business>('Business', { ownerId: admin.id })
  if (!business) return NextResponse.json({ error: 'Business not found' }, { status: 404 })

  const employeeIds = (await findMany<User>('User', { where: { businessId: business.id } })).map((u) => u.id)
  const ownerIds = [...employeeIds, admin.id]

  const leadRows = await findMany<Lead>('Lead', { where: { ownerId: ownerIds }, orderBy: '`createdAt` DESC' })
  const owners = await findMany<User>('User', { where: { id: ownerIds } })
  const ownerMap = new Map(owners.map((o) => [o.id, o]))
  const leads = leadRows.map((l) => ({
    ...l,
    owner: ownerMap.has(l.ownerId) ? { username: ownerMap.get(l.ownerId)!.username, displayName: ownerMap.get(l.ownerId)!.displayName } : null,
  }))

  return NextResponse.json({ leads })
}
