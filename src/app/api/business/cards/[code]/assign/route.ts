import { NextRequest, NextResponse } from 'next/server'
import { findOne, findById, updateWhere } from '@/lib/db'
import { requireRole } from '@/lib/auth'
import type { Business, User, Card } from '@/lib/types'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ code: string }> }) {
  const admin = await requireRole('business_admin')
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const business = await findOne<Business>('Business', { ownerId: admin.id })
  if (!business) return NextResponse.json({ error: 'Business not found' }, { status: 404 })

  const { code } = await params
  const { employeeId } = await req.json()

  const card = await findOne<Card>('Card', { code })
  if (!card || card.businessId !== business.id) {
    return NextResponse.json({ error: 'This card is not part of your business pool' }, { status: 404 })
  }

  if (employeeId) {
    const employee = await findById<User>('User', employeeId)
    if (!employee || employee.businessId !== business.id) {
      return NextResponse.json({ error: 'That employee is not on your team' }, { status: 400 })
    }
  }

  await updateWhere(
    'Card',
    { code },
    employeeId
      ? { userId: employeeId, status: 'active', assignedAt: new Date() }
      // Unassigning from an employee returns it to this business's pool, not
      // to the platform-wide unassigned pool — businessId stays set.
      : { userId: null, status: 'reserved', assignedAt: null }
  )
  const updated = await findOne<Card>('Card', { code })

  return NextResponse.json({ card: updated })
}
