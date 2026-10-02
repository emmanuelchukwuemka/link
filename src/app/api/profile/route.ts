import { NextRequest, NextResponse } from 'next/server'
import { findById, updateById } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { isProActive, FREE_TEMPLATE, FREE_FONT } from '@/lib/subscription'
import type { User } from '@/lib/types'

const ALLOWED_FIELDS = [
  'displayName', 'jobTitle', 'department', 'bio', 'aboutText', 'avatarUrl',
  'phone', 'whatsapp', 'website', 'address', 'businessHours', 'leadFormEnabled',
  'theme', 'template', 'bgType', 'bgColor', 'bgGradient', 'bgImage',
  'buttonStyle', 'buttonSize', 'buttonColor', 'buttonTextColor', 'fontFamily', 'textColor',
] as const

export async function PUT(req: NextRequest) {
  try {
    const authData = await getCurrentUser()
    if (!authData) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

    const data = await req.json()

    const updateData: Record<string, unknown> = {}
    for (const field of ALLOWED_FIELDS) {
      if (field in data) updateData[field] = data[field]
    }

    const needsProCheck =
      updateData.leadFormEnabled === true ||
      (updateData.template !== undefined && updateData.template !== FREE_TEMPLATE) ||
      (updateData.fontFamily !== undefined && updateData.fontFamily !== FREE_FONT) ||
      (updateData.bgType !== undefined && updateData.bgType !== 'solid')

    if (needsProCheck) {
      const current = await findById<User>('User', authData.userId)
      const isPro = isProActive(current?.plan || 'free', current?.planExpiresAt || null)
      if (!isPro) {
        if (updateData.leadFormEnabled === true) {
          return NextResponse.json({ error: 'Lead capture is a Pro feature. Upgrade to enable it.' }, { status: 403 })
        }
        if (updateData.template !== undefined && updateData.template !== FREE_TEMPLATE) {
          return NextResponse.json({ error: 'Templates other than Minimal are a Pro feature. Upgrade to unlock them.' }, { status: 403 })
        }
        if (updateData.fontFamily !== undefined && updateData.fontFamily !== FREE_FONT) {
          return NextResponse.json({ error: 'Custom fonts are a Pro feature. Upgrade to unlock more fonts.' }, { status: 403 })
        }
        if (updateData.bgType !== undefined && updateData.bgType !== 'solid') {
          return NextResponse.json({ error: 'Gradient and image backgrounds are a Pro feature. Upgrade to unlock custom backgrounds.' }, { status: 403 })
        }
      }
    }

    const user = await updateById<User>('User', authData.userId, updateData)

    return NextResponse.json({ user })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
