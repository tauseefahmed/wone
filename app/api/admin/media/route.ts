import { NextRequest, NextResponse } from 'next/server'
import { checkAuth } from '@/lib/auth-middleware'
import { readdir, stat, unlink } from 'fs/promises'
import path from 'path'

export const runtime = 'nodejs'

const uploadsDir = path.join(process.cwd(), 'public', 'uploads')

export async function GET(request: NextRequest) {
  const user = await checkAuth(request)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const files = await readdir(uploadsDir).catch(() => [])
    const items = await Promise.all(
      files.map(async (name) => {
        const full = path.join(uploadsDir, name)
        const s = await stat(full).catch(() => null)
        if (!s || !s.isFile()) return null
        const url = `/uploads/${name}`
        return { name, url, size: s.size, modifiedAt: s.mtimeMs }
      })
    )
    const list = items.filter(Boolean).sort((a: any, b: any) => b.modifiedAt - a.modifiedAt)
    return NextResponse.json({ media: list })
  } catch (e) {
    console.error('MEDIA LIST ERROR', e)
    return NextResponse.json({ error: 'Failed to list media' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  const user = await checkAuth(request)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const { name } = await request.json()
    if (!name || typeof name !== 'string') {
      return NextResponse.json({ error: 'name required' }, { status: 400 })
    }
    // prevent path traversal
    if (name.includes('..') || name.includes('/') || name.includes('\\')) {
      return NextResponse.json({ error: 'Invalid name' }, { status: 400 })
    }
    const full = path.join(uploadsDir, name)
    await unlink(full)
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('MEDIA DELETE ERROR', e)
    return NextResponse.json({ error: 'Failed to delete media' }, { status: 500 })
  }
}
