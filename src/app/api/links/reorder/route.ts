import { NextRequest, NextResponse } from 'next/server'
import { findMany, withTransaction, updateById } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import type { Link } from '@/lib/types'

export async function PATCH(req: NextRequest) {
  try {
    const authData = await getCurrentUser()
    if (!authData) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

    const { ids } = await req.json()
    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: 'Missing ids' }, { status: 400 })
    }

    const owned = await findMany<Link>('Link', { where: { userId: authData.userId } })
    const ownedIds = new Set(owned.map((l) => l.id))
    if (!ids.every((id: string) => ownedIds.has(id))) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    await withTransaction(async (tx) => {
      for (let i = 0; i < ids.length; i++) {
        await updateById('Link', ids[i], { position: i }, tx)
      }
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Link reorder error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
