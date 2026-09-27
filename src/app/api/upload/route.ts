import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { mkdir, writeFile } from 'fs/promises'
import path from 'path'

const MAX_SIZE_BYTES = 5 * 1024 * 1024 // 5MB
const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
const EXT_BY_TYPE: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
}

// Local-disk upload for a single-server deployment. Files land in
// public/uploads/<userId>/ and are served directly by Next's static file
// handling — no object storage configured yet.
//
// Auth is optional: card-customization uploads happen during guest checkout
// (login isn't required until the post-payment profile-setup step), so
// unauthenticated uploads are scoped to public/uploads/guest/ instead.
export async function POST(req: NextRequest) {
  try {
    const authData = await getCurrentUser()
    const scope = authData?.userId || 'guest'

    const formData = await req.formData()
    const file = formData.get('file')

    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }
    if (!ALLOWED_TYPES.has(file.type)) {
      return NextResponse.json({ error: 'Unsupported file type. Use JPG, PNG, WEBP or GIF.' }, { status: 400 })
    }
    if (file.size > MAX_SIZE_BYTES) {
      return NextResponse.json({ error: 'File is too large. Max size is 5MB.' }, { status: 400 })
    }

    const uploadDir = path.join(process.cwd(), 'public', 'uploads', scope)
    await mkdir(uploadDir, { recursive: true })

    const ext = EXT_BY_TYPE[file.type]
    const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`
    const filePath = path.join(uploadDir, filename)

    const buffer = Buffer.from(await file.arrayBuffer())
    await writeFile(filePath, buffer)

    return NextResponse.json({ url: `/uploads/${scope}/${filename}` }, { status: 201 })
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
  }
}
