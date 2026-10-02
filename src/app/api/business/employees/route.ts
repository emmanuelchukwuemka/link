import { NextRequest, NextResponse } from 'next/server'
import { findOne, findMany, count, query, insert } from '@/lib/db'
import { requireRole, hashPassword } from '@/lib/auth'
import { businessEmployeeLimit } from '@/lib/subscription'
import type { Business, User, Card } from '@/lib/types'

export async function GET() {
  const admin = await requireRole('business_admin')
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const business = await findOne<Business>('Business', { ownerId: admin.id })
  if (!business) return NextResponse.json({ error: 'Business not found' }, { status: 404 })

  const employeeRows = await findMany<User>('User', { where: { businessId: business.id }, orderBy: '`createdAt` DESC' })
  const employeeIds = employeeRows.map((e) => e.id)
  const cards = employeeIds.length ? await findMany<Card>('Card', { where: { userId: employeeIds } }) : []
  const employees = employeeRows.map((e) => ({
    id: e.id, username: e.username, email: e.email, displayName: e.displayName, jobTitle: e.jobTitle, department: e.department, createdAt: e.createdAt,
    cards: cards.filter((c) => c.userId === e.id).map((c) => ({ id: c.id, code: c.code })),
  }))

  return NextResponse.json({ employees })
}

export async function POST(req: NextRequest) {
  const admin = await requireRole('business_admin')
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const business = await findOne<Business>('Business', { ownerId: admin.id })
  if (!business) return NextResponse.json({ error: 'Business not found' }, { status: 404 })

  const { email, username, password, displayName, jobTitle, department } = await req.json()
  if (!email || !username || !password) {
    return NextResponse.json({ error: 'Email, username and password are required' }, { status: 400 })
  }

  const currentCount = await count('User', { businessId: business.id })
  const limit = businessEmployeeLimit(business.plan)
  if (currentCount >= limit) {
    return NextResponse.json(
      { error: `Your ${business.plan} plan supports up to ${limit} team members. Upgrade to add more.` },
      { status: 403 }
    )
  }

  const existingRows = await query<User>('SELECT * FROM `User` WHERE `email` = ? OR `username` = ? LIMIT 1', [email, username])
  if (existingRows[0]) {
    return NextResponse.json({ error: 'A user with this email or username already exists' }, { status: 409 })
  }

  const hashedPassword = await hashPassword(password)

  const created = await insert<User>('User', {
    email, username, password: hashedPassword,
    displayName: displayName || username,
    jobTitle: jobTitle ?? null,
    department: department ?? null,
    accountType: 'employee',
    businessId: business.id,
  })
  const employee = { id: created.id, username: created.username, email: created.email, displayName: created.displayName, jobTitle: created.jobTitle, department: created.department, createdAt: created.createdAt }

  return NextResponse.json({ employee }, { status: 201 })
}
