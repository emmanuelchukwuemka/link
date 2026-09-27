import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import { cookies } from 'next/headers'
import { prisma } from './prisma'

const JWT_SECRET = process.env.JWT_SECRET || 'linktree-clone-secret-key-2024'

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12)
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword)
}

export function generateToken(userId: string, expiresIn: '1d' | '7d' | '30d' = '7d'): string {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn })
}

export function verifyToken(token: string): { userId: string } | null {
  try {
    return jwt.verify(token, JWT_SECRET) as { userId: string }
  } catch {
    return null
  }
}

export async function getCurrentUser() {
  const cookieStore = await cookies()
  const token = cookieStore.get('auth-token')?.value

  if (!token) return null

  const payload = verifyToken(token)
  if (!payload) return null

  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: { isActive: true },
  })
  if (!user || !user.isActive) return null

  return payload
}

export async function requireRole(...roles: string[]) {
  const authData = await getCurrentUser()
  if (!authData) return null

  const user = await prisma.user.findUnique({
    where: { id: authData.userId },
    select: { id: true, accountType: true, businessId: true, username: true, email: true },
  })

  if (!user || !roles.includes(user.accountType)) return null
  return user
}
