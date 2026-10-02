import { NextRequest, NextResponse } from 'next/server'
import { findMany, query, insert } from '@/lib/db'
import { requireRole, hashPassword } from '@/lib/auth'
import type { User, Business } from '@/lib/types'

export async function GET(req: NextRequest) {
  const admin = await requireRole('admin')
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const type = req.nextUrl.searchParams.get('type')

  const userRows = await findMany<User>('User', { where: type ? { accountType: type } : undefined, orderBy: '`createdAt` DESC' })
  const businessIds = [...new Set(userRows.map((u) => u.businessId).filter((v): v is string => !!v))]
  const [employerBusinesses, ownedBusinesses] = await Promise.all([
    businessIds.length ? findMany<Business>('Business', { where: { id: businessIds } }) : Promise.resolve([]),
    findMany<Business>('Business', { where: { ownerId: userRows.map((u) => u.id) } }),
  ])
  const employerMap = new Map(employerBusinesses.map((b) => [b.id, b]))
  const ownedMap = new Map(ownedBusinesses.map((b) => [b.ownerId, b]))

  const users = userRows.map((u) => ({
    id: u.id, username: u.username, email: u.email, displayName: u.displayName, accountType: u.accountType,
    plan: u.plan, planExpiresAt: u.planExpiresAt, businessId: u.businessId, createdAt: u.createdAt, isActive: u.isActive,
    business: u.businessId && employerMap.has(u.businessId) ? { name: employerMap.get(u.businessId)!.name } : null,
    ownedBusiness: ownedMap.has(u.id) ? { name: ownedMap.get(u.id)!.name } : null,
  }))

  return NextResponse.json({ users })
}

export async function POST(req: NextRequest) {
  const admin = await requireRole('admin')
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  try {
    const { email, username, password, displayName, accountType, businessId } = await req.json()

    if (!email || !username || !password) {
      return NextResponse.json({ error: 'Email, username and password are required' }, { status: 400 })
    }
    if (!['individual', 'employee'].includes(accountType)) {
      return NextResponse.json({ error: 'accountType must be individual or employee' }, { status: 400 })
    }
    if (accountType === 'employee' && !businessId) {
      return NextResponse.json({ error: 'businessId is required for employee accounts' }, { status: 400 })
    }

    const existingRows = await query<User>('SELECT * FROM `User` WHERE `email` = ? OR `username` = ? LIMIT 1', [email, username])
    if (existingRows[0]) {
      return NextResponse.json({ error: 'A user with this email or username already exists' }, { status: 409 })
    }

    const hashedPassword = await hashPassword(password)
    const created = await insert<User>('User', {
      email, username, password: hashedPassword,
      displayName: displayName || username,
      accountType,
      businessId: accountType === 'employee' ? businessId : null,
    })
    const user = { id: created.id, username: created.username, email: created.email, displayName: created.displayName, accountType: created.accountType }

    return NextResponse.json({ user }, { status: 201 })
  } catch (error) {
    console.error('Admin create user error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
