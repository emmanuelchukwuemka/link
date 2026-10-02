import { NextRequest, NextResponse } from 'next/server'
import { findMany, findOne, query, insert, withTransaction } from '@/lib/db'
import { requireRole, hashPassword } from '@/lib/auth'
import type { Business, User } from '@/lib/types'

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

  const rows = await findMany<Business>('Business', { orderBy: '`name` ASC' })
  const businesses = rows.map((b) => ({ id: b.id, name: b.name, slug: b.slug, plan: b.plan }))

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

    const existingRows = await query<User>('SELECT * FROM `User` WHERE `email` = ? OR `username` = ? LIMIT 1', [email, username])
    if (existingRows[0]) {
      return NextResponse.json({ error: 'A user with this email or username already exists' }, { status: 409 })
    }

    const baseSlug = slugify(businessName) || 'business'
    let slug = baseSlug
    let suffix = 1
    while (await findOne<Business>('Business', { slug })) {
      slug = `${baseSlug}-${suffix++}`
    }

    const hashedPassword = await hashPassword(password)
    const business = await withTransaction(async (tx) => {
      const owner = await insert<User>(
        'User',
        { email, username, password: hashedPassword, displayName: displayName || username, accountType: 'business_admin' },
        undefined,
        tx
      )
      const created = await insert<Business>('Business', { name: businessName, slug, ownerId: owner.id }, undefined, tx)
      return { id: created.id, name: created.name, slug: created.slug }
    })

    return NextResponse.json({ business }, { status: 201 })
  } catch (error) {
    console.error('Admin create business error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
