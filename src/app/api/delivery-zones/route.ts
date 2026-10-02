import { NextResponse } from 'next/server'
import { findMany } from '@/lib/db'
import type { DeliveryZone } from '@/lib/types'

export async function GET() {
  const zones = await findMany<DeliveryZone>('DeliveryZone', { orderBy: '`name` ASC' })
  return NextResponse.json({ zones })
}
