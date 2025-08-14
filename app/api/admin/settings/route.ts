import { NextRequest, NextResponse } from 'next/server'
import { checkAuth } from '@/lib/auth-middleware'
import { prisma } from '@/lib/prisma'

// GET /api/admin/settings -> list all settings
export async function GET(request: NextRequest) {
  const user = await checkAuth(request)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const settings = await prisma.setting.findMany({ orderBy: { key: 'asc' } })
    return NextResponse.json({ settings })
  } catch (e) {
    console.error('Failed to fetch settings:', e)
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 })
  }
}

// POST /api/admin/settings -> upsert one or many settings
// Body can be { key, value } or { items: [{ key, value }, ...] }
export async function POST(request: NextRequest) {
  const user = await checkAuth(request)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const body = await request.json().catch(() => ({}))
    const items = Array.isArray(body?.items)
      ? body.items
      : body?.key
      ? [{ key: body.key, value: body.value ?? null }]
      : []

    const sanitized = items
      .filter((it: any) => typeof it?.key === 'string')
      .map((it: any) => ({ key: String(it.key).trim(), value: it.value ?? null }))
      .filter((it: any) => it.key.length > 0)

    if (!sanitized.length) {
      return NextResponse.json({ error: 'No valid settings provided' }, { status: 400 })
    }

    const results = [] as any[]
    for (const it of sanitized) {
      const res = await prisma.setting.upsert({
        where: { key: it.key },
        create: { key: it.key, value: it.value },
        update: { value: it.value },
      })
      results.push(res)
    }

    return NextResponse.json({ updated: results.length, items: results })
  } catch (e) {
    console.error('Failed to upsert settings:', e)
    return NextResponse.json({ error: 'Failed to save settings' }, { status: 500 })
  }
}

// DELETE /api/admin/settings -> delete by key or keys
// Body can be { key } or { keys: [] }
export async function DELETE(request: NextRequest) {
  const user = await checkAuth(request)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const body = await request.json().catch(() => ({}))
    const keys: string[] = Array.isArray(body?.keys)
      ? body.keys.filter((k: any) => typeof k === 'string')
      : typeof body?.key === 'string'
      ? [body.key]
      : []

    if (!keys.length) return NextResponse.json({ error: 'No keys provided' }, { status: 400 })

    const result = await prisma.setting.deleteMany({ where: { key: { in: keys } } })
    return NextResponse.json({ deleted: result.count })
  } catch (e) {
    console.error('Failed to delete settings:', e)
    return NextResponse.json({ error: 'Failed to delete settings' }, { status: 500 })
  }
}
