import { NextRequest, NextResponse } from 'next/server'
import { findOne, count, insert, updateWhere } from '@/lib/db'
import { requireRole, hashPassword } from '@/lib/auth'
import { businessEmployeeLimit } from '@/lib/subscription'
import { parseCsv, generateTempPassword } from '@/lib/csv'
import type { Business, User, Card } from '@/lib/types'

function slugifyUsername(email: string, name: string): string {
  const base = (email.split('@')[0] || name).toLowerCase().replace(/[^a-z0-9]+/g, '') || 'employee'
  return base
}

// CSV columns (header row required): Full name, Email, Phone, Job title, Department, Profile photo, Card ID
// "Profile photo" is a URL to an already-hosted image (CSV can't carry binary
// files) — upload it somewhere first, e.g. via each employee's own dashboard,
// or host it externally and paste the link.
// Username + a temporary password are generated server-side since the CSV
// format in the spec doesn't include login credentials.
export async function POST(req: NextRequest) {
  const admin = await requireRole('business_admin')
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const business = await findOne<Business>('Business', { ownerId: admin.id })
  if (!business) return NextResponse.json({ error: 'Business not found' }, { status: 404 })

  const { csv } = await req.json()
  if (!csv || typeof csv !== 'string') {
    return NextResponse.json({ error: 'CSV text is required' }, { status: 400 })
  }

  const rows = parseCsv(csv)
  if (rows.length < 2) {
    return NextResponse.json({ error: 'CSV must have a header row and at least one data row' }, { status: 400 })
  }

  const header = rows[0].map((h) => h.trim().toLowerCase())
  const col = (name: string) => header.findIndex((h) => h.includes(name))
  const nameIdx = col('name')
  const emailIdx = col('email')
  const phoneIdx = col('phone')
  const jobIdx = col('job') !== -1 ? col('job') : col('title')
  const deptIdx = col('department') !== -1 ? col('department') : col('dept')
  const photoIdx = col('photo') !== -1 ? col('photo') : col('avatar')
  const cardIdx = col('card')

  if (nameIdx === -1 || emailIdx === -1) {
    return NextResponse.json({ error: 'CSV must include at least "Full name" and "Email" columns' }, { status: 400 })
  }

  const dataRows = rows.slice(1)
  const currentCount = await count('User', { businessId: business.id })
  const limit = businessEmployeeLimit(business.plan)
  if (currentCount + dataRows.length > limit) {
    return NextResponse.json({
      error: `Your ${business.plan} plan supports up to ${limit} team members (currently ${currentCount}). This upload would exceed that — upgrade your plan or reduce the list.`,
    }, { status: 403 })
  }

  const created: { displayName: string; username: string; email: string; tempPassword: string }[] = []
  const skipped: { row: number; reason: string }[] = []

  for (let i = 0; i < dataRows.length; i++) {
    const cols = dataRows[i]
    const displayName = cols[nameIdx]?.trim()
    const email = cols[emailIdx]?.trim()
    const phone = phoneIdx !== -1 ? cols[phoneIdx]?.trim() : undefined
    const jobTitle = jobIdx !== -1 ? cols[jobIdx]?.trim() : undefined
    const department = deptIdx !== -1 ? cols[deptIdx]?.trim() : undefined
    const avatarUrl = photoIdx !== -1 ? cols[photoIdx]?.trim() || undefined : undefined
    const cardCode = cardIdx !== -1 ? cols[cardIdx]?.trim().toUpperCase() : undefined

    if (!displayName || !email) {
      skipped.push({ row: i + 2, reason: 'Missing name or email' })
      continue
    }

    const existingUser = await findOne<User>('User', { email })
    if (existingUser) {
      skipped.push({ row: i + 2, reason: `Email ${email} already registered` })
      continue
    }

    let username = slugifyUsername(email, displayName)
    let suffix = 1
    while (await findOne<User>('User', { username })) {
      username = `${slugifyUsername(email, displayName)}${suffix++}`
    }

    const tempPassword = generateTempPassword()
    const employee = await insert<User>('User', {
      email, username, password: await hashPassword(tempPassword),
      displayName, phone: phone ?? null, jobTitle: jobTitle ?? null, department: department ?? null, avatarUrl: avatarUrl ?? null,
      accountType: 'employee',
      businessId: business.id,
    })

    if (cardCode) {
      const card = await findOne<Card>('Card', { code: cardCode })
      if (card && (card.businessId === business.id || (!card.businessId && !card.userId))) {
        await updateWhere('Card', { code: cardCode }, { userId: employee.id, businessId: business.id, status: 'active', assignedAt: new Date() })
      }
    }

    created.push({ displayName, username, email, tempPassword })
  }

  return NextResponse.json({ created, skipped }, { status: 201 })
}
