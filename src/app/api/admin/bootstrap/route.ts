import { NextRequest, NextResponse } from 'next/server'
import { findOne, insert, updateWhere, removeById } from '@/lib/db'
import { hashPassword } from '@/lib/auth'
import type { User } from '@/lib/types'

// One-time admin account creation, for hosts with no shell access to run
// prisma/promote-admin.js directly (see that script's comment — there's no
// self-serve admin signup by design). Gated by BOOTSTRAP_SECRET; if that env
// var isn't set, this refuses unconditionally. Remove this route (or unset
// the env var) once it's no longer needed.
// Creates the admin if the email doesn't exist yet, or promotes it in place
// if it does (so this is safe to call again without creating duplicates).
// Optional removeEmail deletes a prior bootstrap account in the same call,
// for replacing one admin identity with another.
export async function POST(req: NextRequest) {
  const secret = process.env.BOOTSTRAP_SECRET
  if (!secret) {
    return NextResponse.json({ error: 'Not available' }, { status: 404 })
  }

  const { email, username, password, displayName, removeEmail, secret: provided } = await req.json()
  if (provided !== secret) {
    return NextResponse.json({ error: 'Not available' }, { status: 404 })
  }

  if (removeEmail) {
    const toRemove = await findOne<User>('User', { email: removeEmail })
    if (toRemove) await removeById('User', toRemove.id)
  }

  if (!email || !username || !password) {
    return NextResponse.json({ error: 'email, username and password are required' }, { status: 400 })
  }

  const existing = await findOne<User>('User', { email })
  if (existing) {
    await updateWhere('User', { email }, { accountType: 'admin' })
    return NextResponse.json({ ok: true, email, action: 'promoted' })
  }

  const hashedPassword = await hashPassword(password)
  const user = await insert<User>('User', {
    email,
    username,
    password: hashedPassword,
    displayName: displayName || username,
    accountType: 'admin',
  })
  return NextResponse.json({ ok: true, email: user.email, action: 'created' })
}
