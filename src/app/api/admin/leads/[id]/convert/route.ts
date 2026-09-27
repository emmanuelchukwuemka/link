import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireRole, hashPassword } from '@/lib/auth'

function slugify(name: string): string {
  return name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireRole('admin')
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id } = await params
  const { type, username, password, businessName } = await req.json()

  if (!['individual', 'business'].includes(type)) {
    return NextResponse.json({ error: 'type must be individual or business' }, { status: 400 })
  }
  if (!username || !password) {
    return NextResponse.json({ error: 'Username and temporary password are required' }, { status: 400 })
  }
  if (type === 'business' && !businessName) {
    return NextResponse.json({ error: 'Business name is required' }, { status: 400 })
  }

  const lead = await prisma.lead.findUnique({ where: { id } })
  if (!lead) return NextResponse.json({ error: 'Lead not found' }, { status: 404 })
  if (!lead.email) return NextResponse.json({ error: 'This lead has no email on file, so an account cannot be created' }, { status: 400 })

  const existing = await prisma.user.findFirst({ where: { OR: [{ email: lead.email }, { username }] } })
  if (existing) return NextResponse.json({ error: 'A user with this email or username already exists' }, { status: 409 })

  const hashedPassword = await hashPassword(password)

  const account = await prisma.$transaction(async (tx) => {
    if (type === 'individual') {
      const user = await tx.user.create({
        data: {
          email: lead.email!,
          username,
          password: hashedPassword,
          displayName: lead.name,
          phone: lead.phone || null,
          accountType: 'individual',
        },
        select: { id: true, username: true, email: true, displayName: true, accountType: true },
      })
      return { user }
    }

    const baseSlug = slugify(businessName) || 'business'
    let slug = baseSlug
    let suffix = 1
    while (await tx.business.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${suffix++}`
    }
    const owner = await tx.user.create({
      data: {
        email: lead.email!,
        username,
        password: hashedPassword,
        displayName: lead.name,
        phone: lead.phone || null,
        accountType: 'business_admin',
      },
    })
    const business = await tx.business.create({
      data: { name: businessName, slug, ownerId: owner.id, phone: lead.phone || null, email: lead.email },
      select: { id: true, name: true, slug: true },
    })
    return { business, owner: { id: owner.id, username: owner.username, email: owner.email } }
  })

  const updatedLead = await prisma.lead.update({
    where: { id },
    data: { status: 'converted' },
    include: { owner: { select: { username: true, displayName: true } } },
  })

  return NextResponse.json({ lead: updatedLead, account }, { status: 201 })
}
