import { NextRequest, NextResponse } from 'next/server'
import { findMany, findById, insert } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { isProActive } from '@/lib/subscription'
import type { Service, User } from '@/lib/types'

export async function GET() {
  try {
    const authData = await getCurrentUser()
    if (!authData) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

    const services = await findMany<Service>('Service', { where: { userId: authData.userId }, orderBy: '`position` ASC' })

    return NextResponse.json({ services })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const authData = await getCurrentUser()
    if (!authData) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

    const user = await findById<User>('User', authData.userId)
    if (!isProActive(user?.plan || 'free', user?.planExpiresAt || null)) {
      return NextResponse.json({ error: 'Services are a Pro feature. Upgrade to add service listings.' }, { status: 403 })
    }

    const { name, description, price, ctaType } = await req.json()

    const [last] = await findMany<Service>('Service', { where: { userId: authData.userId }, orderBy: '`position` DESC', limit: 1 })
    const position = last ? last.position + 1 : 0

    const service = await insert<Service>('Service', {
      name: name || 'New Service',
      description: description ?? null,
      price: price ?? null,
      ctaType: ctaType || 'contact',
      position,
      userId: authData.userId,
    })

    return NextResponse.json({ service }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
