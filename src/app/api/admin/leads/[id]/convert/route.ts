import { NextRequest, NextResponse } from 'next/server'
import { findById, findOne, query, insert, updateById, withTransaction } from '@/lib/db'
import { requireRole, hashPassword } from '@/lib/auth'
import type { Lead, User, Business } from '@/lib/types'

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

  const lead = await findById<Lead>('Lead', id)
  if (!lead) return NextResponse.json({ error: 'Lead not found' }, { status: 404 })
  if (!lead.email) return NextResponse.json({ error: 'This lead has no email on file, so an account cannot be created' }, { status: 400 })

  const existingRows = await query<User>('SELECT * FROM `User` WHERE `email` = ? OR `username` = ? LIMIT 1', [lead.email, username])
  if (existingRows[0]) return NextResponse.json({ error: 'A user with this email or username already exists' }, { status: 409 })

  const hashedPassword = await hashPassword(password)

  const account = await withTransaction(async (tx) => {
    if (type === 'individual') {
      const created = await insert<User>(
        'User',
        { email: lead.email!, username, password: hashedPassword, displayName: lead.name, phone: lead.phone || null, accountType: 'individual' },
        undefined,
        tx
      )
      return { user: { id: created.id, username: created.username, email: created.email, displayName: created.displayName, accountType: created.accountType } }
    }

    const baseSlug = slugify(businessName) || 'business'
    let slug = baseSlug
    let suffix = 1
    while (await findOne<Business>('Business', { slug }, tx)) {
      slug = `${baseSlug}-${suffix++}`
    }
    const owner = await insert<User>(
      'User',
      { email: lead.email!, username, password: hashedPassword, displayName: lead.name, phone: lead.phone || null, accountType: 'business_admin' },
      undefined,
      tx
    )
    const createdBusiness = await insert<Business>(
      'Business',
      { name: businessName, slug, ownerId: owner.id, phone: lead.phone || null, email: lead.email },
      undefined,
      tx
    )
    return {
      business: { id: createdBusiness.id, name: createdBusiness.name, slug: createdBusiness.slug },
      owner: { id: owner.id, username: owner.username, email: owner.email },
    }
  })

  const updatedLead = await updateById<Lead>('Lead', id, { status: 'converted' })
  const leadOwner = updatedLead ? await findById<User>('User', updatedLead.ownerId) : null
  const lead2 = updatedLead && { ...updatedLead, owner: leadOwner ? { username: leadOwner.username, displayName: leadOwner.displayName } : null }

  return NextResponse.json({ lead: lead2, account }, { status: 201 })
}
