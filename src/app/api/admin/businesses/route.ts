import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireRole, hashPassword } from '@/lib/auth'

function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

export async function GET() {
  const admin = await requireRole('admin')
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const businesses = await prisma.business.findMany({
    select: { id: true, name: true, slug: true, plan: true },
    orderBy: { name: 'asc' },
  })

  return NextResponse.json({ businesses })
}

export async function POST(req: NextRequest) {
  const admin = await requireRole('admin')
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  try {
    const { businessName, email, username, password, displayName } = await req.json()

    if (!businessName || !email || !username || !password) {
      return NextResponse.json({ error: 'Business name, owner email, username and password are required' }, { status: 400 })
    }

    const existingUser = await prisma.user.findFirst({ where: { OR: [{ email }, { username }] } })
    if (existingUser) {
      return NextResponse.json({ error: 'A user with this email or username already exists' }, { status: 409 })
    }

    const baseSlug = slugify(businessName) || 'business'
    let slug = baseSlug
    let suffix = 1
    while (await prisma.business.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${suffix++}`
    }

    const hashedPassword = await hashPassword(password)
    const business = await prisma.$transaction(async (tx) => {
      const owner = await tx.user.create({
        data: {
          email, username, password: hashedPassword,
          displayName: displayName || username,
          accountType: 'business_admin',
        },
      })
      return tx.business.create({
        data: { name: businessName, slug, ownerId: owner.id },
        select: { id: true, name: true, slug: true },
      })
    })

    return NextResponse.json({ business }, { status: 201 })
  } catch (error) {
    console.error('Admin create business error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
