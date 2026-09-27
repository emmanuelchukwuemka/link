import { prisma } from './prisma'

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
    const existing = await prisma.card.findUnique({ where: { code } })
    if (!existing) return code
  }
  throw new Error('Could not generate a unique card code')
}
