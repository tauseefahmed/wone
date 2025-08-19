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

  try {
    const [posts, total] = await Promise.all([
      prisma.post.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          author: { select: { name: true, email: true } },
          categories: { include: { category: true } },
          tags: { include: { tag: true } }
        },
        where: showTrash ? { deletedAt: { not: null } } : { deletedAt: null }
      }),
      prisma.post.count({ where: showTrash ? { deletedAt: { not: null } } : { deletedAt: null } })
    ])

    return NextResponse.json({
      posts,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch posts' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const user = await checkAuth(request)
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { title, slug: rawSlug, content, excerpt, featuredImage, metaTitle, metaDescription, published, featured, categoryIds, tagIds } = body

    const normalizedProvided = typeof rawSlug === 'string' && rawSlug.trim().length > 0 ? createSlug(rawSlug) : ''
    const titleBased = createSlug(title)
    const slug = normalizedProvided || titleBased
    if (!slug) {
      return NextResponse.json({ error: 'Slug is required' }, { status: 400 })
    }
    
    // Check if slug already exists
    const existingPost = await prisma.post.findUnique({ where: { slug } })
    if (existingPost) {
      return NextResponse.json({ error: 'A post with this slug already exists' }, { status: 400 })
    }

    const post = await prisma.post.create({
      data: {
        title,
        slug,
        content,
        excerpt,
        featuredImage,
        metaTitle,
        metaDescription,
        published: published || false,
        featured: featured || false,
        publishedAt: published ? new Date() : null,
        authorId: user.id,
        categories: {
          create: categoryIds?.map((categoryId: string) => ({
            categoryId
          })) || []
        },
        tags: {
          create: tagIds?.map((tagId: string) => ({
            tagId
          })) || []
        }
      },
      include: {
        author: { select: { name: true, email: true } },
        categories: { include: { category: true } },
        tags: { include: { tag: true } }
      }
    })

    return NextResponse.json(post, { status: 201 })
  } catch (error) {
    console.error('Error creating post:', error)
    return NextResponse.json({ error: 'Failed to create post' }, { status: 500 })
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

    if (ids.length === 0) {
      return NextResponse.json({ error: 'No post IDs provided' }, { status: 400 })
    }

    if (force) {
      // Permanent delete
      await prisma.postCategory.deleteMany({ where: { postId: { in: ids } } }).catch(() => {})
      await prisma.postTag.deleteMany({ where: { postId: { in: ids } } }).catch(() => {})
      const result = await prisma.post.deleteMany({ where: { id: { in: ids } } })
      return NextResponse.json({ deletedCount: result.count })
    } else {
      // Soft delete (move to trash)
      const result = await prisma.post.updateMany({ where: { id: { in: ids } }, data: { deletedAt: new Date() } })
      return NextResponse.json({ trashedCount: result.count })
    }
  } catch (error) {
    console.error('Error bulk deleting posts:', error)
    return NextResponse.json({ error: 'Failed to bulk delete posts' }, { status: 500 })
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
    if (ids.length === 0) {
      return NextResponse.json({ error: 'No post IDs provided' }, { status: 400 })
    }
    const result = await prisma.post.updateMany({ where: { id: { in: ids } }, data: { deletedAt: null } })
    return NextResponse.json({ restoredCount: result.count })
  } catch (error) {
    console.error('Error restoring posts:', error)
    return NextResponse.json({ error: 'Failed to restore posts' }, { status: 500 })
  }
}
