import { NextRequest, NextResponse } from 'next/server'
import { checkAuth } from '@/lib/auth-middleware'
import { prisma } from '@/lib/prisma'
import { createSlug } from '@/lib/utils'

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const user = await checkAuth(request)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const page = await prisma.page.findUnique({
      where: { id: params.id },
      include: { author: { select: { name: true, email: true } } },
    })
    if (!page) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json(page)
  } catch (e) {
    return NextResponse.json({ error: 'Failed to fetch page' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const user = await checkAuth(request)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await request.json()
    const { title, slug: rawSlug, content, featuredImage, metaTitle, metaDescription, published } = body

    const normalizedProvided = typeof rawSlug === 'string' && rawSlug.trim().length > 0 ? createSlug(rawSlug) : ''
    const titleBased = createSlug(title)
    const slug = normalizedProvided || titleBased
    if (!slug) {
      return NextResponse.json({ error: 'Slug is required' }, { status: 400 })
    }

    const exists = await prisma.page.findFirst({ where: { slug, NOT: { id: params.id } } })
    if (exists) {
      return NextResponse.json({ error: 'A page with this slug already exists' }, { status: 400 })
    }

    const updated = await prisma.page.update({
      where: { id: params.id },
      data: {
        title,
        slug,
        content,
        featuredImage,
        metaTitle,
        metaDescription,
        published: !!published,
        publishedAt: published ? new Date() : null,
      },
    })
    return NextResponse.json(updated)
  } catch (e) {
    console.error('Error updating page:', e)
    return NextResponse.json({ error: 'Failed to update page' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const user = await checkAuth(request)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const { searchParams } = new URL(request.url)
    const force = searchParams.get('force') === '1'
    if (force) {
      await prisma.page.delete({ where: { id: params.id } })
      return NextResponse.json({ success: true, message: 'Page permanently deleted' })
    } else {
      await prisma.page.update({ where: { id: params.id }, data: { deletedAt: new Date() } })
      return NextResponse.json({ success: true, message: 'Page moved to trash' })
    }
  } catch (e) {
    return NextResponse.json({ error: 'Failed to delete page' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const user = await checkAuth(request)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    await prisma.page.update({ where: { id: params.id }, data: { deletedAt: null } })
    return NextResponse.json({ success: true, message: 'Page restored from trash' })
  } catch (e) {
    return NextResponse.json({ error: 'Failed to restore page' }, { status: 500 })
  }
}
