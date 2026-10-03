import { findOne, query } from './db'
import type { Card } from './types'

export const CARD_PRODUCTS = ['mini', 'standard', 'wristband'] as const
export type CardProduct = (typeof CARD_PRODUCTS)[number]

export const CARD_STATUSES = ['unassigned', 'reserved', 'active', 'deactivated'] as const

export type CardTapStats = { taps30d: number; lastTap: Date | null }

// Reuses the NFC_TAP analytics events already written by /c/[code] — no
// separate counter to keep in sync. meta is a plain TEXT column (not native
// JSON on this host), so cardCode is matched as a JSON-shaped substring
// rather than via JSON_EXTRACT.
export async function getCardTapStats(codes: string[]): Promise<Map<string, CardTapStats>> {
  const stats = new Map<string, CardTapStats>()
  if (codes.length === 0) return stats

  const since = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)
  const likeClauses = codes.map(() => '`meta` LIKE ?').join(' OR ')
  const rows = await query<{ meta: string; createdAt: Date }>(
    `SELECT \`meta\`, \`createdAt\` FROM \`AnalyticsEvent\` WHERE \`type\` = 'NFC_TAP' AND \`createdAt\` >= ? AND (${likeClauses})`,
    [since, ...codes.map((c) => `%"cardCode":"${c}"%`)]
  )

  const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000
  for (const row of rows) {
    let code: string | undefined
    try {
      code = JSON.parse(row.meta)?.cardCode
    } catch {
      continue
    }
    if (!code) continue
    const entry = stats.get(code) || { taps30d: 0, lastTap: null }
    const createdAt = new Date(row.createdAt)
    if (createdAt.getTime() >= thirtyDaysAgo) entry.taps30d++
    if (!entry.lastTap || createdAt > entry.lastTap) entry.lastTap = createdAt
    stats.set(code, entry)
  }
  return stats
}

const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // no 0/O/1/I to avoid confusion

function randomCode(length = 6): string {
  let out = ''
  for (let i = 0; i < length; i++) {
    out += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)]
  }
  return out
}

export async function generateUniqueCardCode(): Promise<string> {
  for (let attempt = 0; attempt < 10; attempt++) {
    const code = `TC-${randomCode()}`
    const existing = await findOne<Card>('Card', { code })
    if (!existing) return code
  }
  throw new Error('Could not generate a unique card code')
}
