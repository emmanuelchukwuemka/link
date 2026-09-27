import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireRole, hashPassword } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const admin = await requireRole('admin')
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const type = req.nextUrl.searchParams.get('type')

  const users = await prisma.user.findMany({
    where: type ? { accountType: type } : undefined,
    select: {
      id: true, username: true, email: true, displayName: true, accountType: true,
      plan: true, planExpiresAt: true, businessId: true, createdAt: true, isActive: true,
      business: { select: { name: true } },
      ownedBusiness: { select: { name: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

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

    const existing = await prisma.user.findFirst({ where: { OR: [{ email }, { username }] } })
    if (existing) {
      return NextResponse.json({ error: 'A user with this email or username already exists' }, { status: 409 })
    }

    const hashedPassword = await hashPassword(password)
    const user = await prisma.user.create({
      data: {
        email, username, password: hashedPassword,
        displayName: displayName || username,
        accountType,
        businessId: accountType === 'employee' ? businessId : null,
      },
      select: { id: true, username: true, email: true, displayName: true, accountType: true },
    })

    return NextResponse.json({ user }, { status: 201 })
  } catch (error) {
    console.error('Admin create user error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
