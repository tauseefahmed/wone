import { NextRequest, NextResponse } from 'next/server'
import { checkAuth } from '@/lib/auth-middleware'
import { prisma } from '@/lib/prisma'
import { createSlug } from '@/lib/utils'

export async function GET(request: NextRequest) {
  const user = await checkAuth(request)
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const { searchParams } = new URL(request.url)
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '10')
  const skip = (page - 1) * limit
  const showTrash = searchParams.get('trash') === '1'
  const q = (searchParams.get('q') || '').trim()

  try {
    const baseWhere = showTrash ? { deletedAt: { not: null } } : { deletedAt: null }
    const textFilter = q
      ? {
          OR: [
            { title: { contains: q } },
            { content: { contains: q } },
            { metaTitle: { contains: q } },
            { metaDescription: { contains: q } },
          ],
        }
      : {}
    const where = { ...baseWhere, ...(textFilter as any) }

    const [pages, total] = await Promise.all([
      prisma.page.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          author: { select: { name: true, email: true } },
        },
        where,
      }),
      prisma.page.count({ where }),
    ])

    return NextResponse.json({
      pages,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Failed to fetch pages:', error)
    return NextResponse.json({ error: 'Failed to fetch pages' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const user = await checkAuth(request)
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { title, slug: rawSlug, content, featuredImage, metaTitle, metaDescription, published } = body

    const normalizedProvided = typeof rawSlug === 'string' && rawSlug.trim().length > 0 ? createSlug(rawSlug) : ''
    const titleBased = createSlug(title)
    const slug = normalizedProvided || titleBased
    if (!slug) {
      return NextResponse.json({ error: 'Slug is required' }, { status: 400 })
    }

    const existing = await prisma.page.findUnique({ where: { slug } })
    if (existing) {
      return NextResponse.json({ error: 'A page with this slug already exists' }, { status: 400 })
    }

    const page = await prisma.page.create({
      data: {
        title,
        slug,
        content,
        featuredImage,
        metaTitle,
        metaDescription,
        published: !!published,
        publishedAt: published ? new Date() : null,
        authorId: user.id,
      },
      include: { author: { select: { name: true, email: true } } },
    })

    return NextResponse.json(page, { status: 201 })
  } catch (error) {
    console.error('Error creating page:', error)
    return NextResponse.json({ error: 'Failed to create page' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  const user = await checkAuth(request)
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  try {
    const { searchParams } = new URL(request.url)
    const force = searchParams.get('force') === '1'
    const body = await request.json().catch(() => ({}))
    const ids = Array.isArray(body?.ids) ? body.ids.filter((v: unknown) => typeof v === 'string') : []
    if (!ids.length) {
      return NextResponse.json({ error: 'No page IDs provided' }, { status: 400 })
    }
    if (force) {
      const result = await prisma.page.deleteMany({ where: { id: { in: ids } } })
      return NextResponse.json({ deletedCount: result.count })
    } else {
      const result = await prisma.page.updateMany({ where: { id: { in: ids } }, data: { deletedAt: new Date() } })
      return NextResponse.json({ trashedCount: result.count })
    }
  } catch (error) {
    console.error('Error bulk deleting pages:', error)
    return NextResponse.json({ error: 'Failed to bulk delete pages' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  const user = await checkAuth(request)
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  try {
    const body = await request.json().catch(() => ({}))
    const ids = Array.isArray(body?.ids) ? body.ids.filter((v: unknown) => typeof v === 'string') : []
    if (!ids.length) {
      return NextResponse.json({ error: 'No page IDs provided' }, { status: 400 })
    }
    const result = await prisma.page.updateMany({ where: { id: { in: ids } }, data: { deletedAt: null } })
    return NextResponse.json({ restoredCount: result.count })
  } catch (error) {
    console.error('Error restoring pages:', error)
    return NextResponse.json({ error: 'Failed to restore pages' }, { status: 500 })
  }
}
