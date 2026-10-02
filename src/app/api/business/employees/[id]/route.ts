import { NextRequest, NextResponse } from 'next/server'
import { findOne, findById, updateWhere, withTransaction } from '@/lib/db'
import { requireRole } from '@/lib/auth'
import type { Business, User } from '@/lib/types'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireRole('business_admin')
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const business = await findOne<Business>('Business', { ownerId: admin.id })
  if (!business) return NextResponse.json({ error: 'Business not found' }, { status: 404 })

  const { id } = await params
  const employee = await findById<User>('User', id)
  if (!employee || employee.businessId !== business.id) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const { displayName, jobTitle, department } = await req.json()
  await updateWhere('User', { id }, { displayName, jobTitle, department })
  const updatedUser = await findById<User>('User', id)
  const updated = updatedUser && { id: updatedUser.id, username: updatedUser.username, displayName: updatedUser.displayName, jobTitle: updatedUser.jobTitle, department: updatedUser.department }

  return NextResponse.json({ employee: updated })
}

// Removes the employee from the business (their personal profile is kept intact).
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireRole('business_admin')
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const business = await findOne<Business>('Business', { ownerId: admin.id })
  if (!business) return NextResponse.json({ error: 'Business not found' }, { status: 404 })

  const { id } = await params
  const employee = await findById<User>('User', id)
  if (!employee || employee.businessId !== business.id) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  await withTransaction(async (tx) => {
    await updateWhere('User', { id }, { businessId: null, accountType: 'individual' }, tx)
    await updateWhere('Card', { userId: id, businessId: business.id }, { userId: null, status: 'unassigned', assignedAt: null }, tx)
  })

  return NextResponse.json({ success: true })
}
