import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireRole, hashPassword } from '@/lib/auth'
import { businessEmployeeLimit } from '@/lib/subscription'

export async function GET() {
  const admin = await requireRole('business_admin')
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const business = await prisma.business.findUnique({ where: { ownerId: admin.id } })
  if (!business) return NextResponse.json({ error: 'Business not found' }, { status: 404 })

  const employees = await prisma.user.findMany({
    where: { businessId: business.id },
    select: {
      id: true, username: true, email: true, displayName: true, jobTitle: true, department: true, createdAt: true,
      cards: { select: { id: true, code: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json({ employees })
}

export async function POST(req: NextRequest) {
  const admin = await requireRole('business_admin')
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const business = await prisma.business.findUnique({ where: { ownerId: admin.id } })
  if (!business) return NextResponse.json({ error: 'Business not found' }, { status: 404 })

  const { email, username, password, displayName, jobTitle, department } = await req.json()
  if (!email || !username || !password) {
    return NextResponse.json({ error: 'Email, username and password are required' }, { status: 400 })
  }

  const currentCount = await prisma.user.count({ where: { businessId: business.id } })
  const limit = businessEmployeeLimit(business.plan)
  if (currentCount >= limit) {
    return NextResponse.json(
      { error: `Your ${business.plan} plan supports up to ${limit} team members. Upgrade to add more.` },
      { status: 403 }
    )
  }

  const existing = await prisma.user.findFirst({ where: { OR: [{ email }, { username }] } })
  if (existing) {
    return NextResponse.json({ error: 'A user with this email or username already exists' }, { status: 409 })
  }

  const hashedPassword = await hashPassword(password)

  const employee = await prisma.user.create({
    data: {
      email, username, password: hashedPassword,
      displayName: displayName || username,
      jobTitle,
      department,
      accountType: 'employee',
      businessId: business.id,
    },
    select: { id: true, username: true, email: true, displayName: true, jobTitle: true, department: true, createdAt: true },
  })

  return NextResponse.json({ employee }, { status: 201 })
}
