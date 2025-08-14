import { NextRequest, NextResponse } from 'next/server'
import { checkAuth } from '@/lib/auth-middleware'
import { prisma } from '@/lib/prisma'
import { createSlug } from '@/lib/utils'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await checkAuth(request)
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const post = await prisma.post.findUnique({
      where: { id: params.id },
      include: {
        author: { select: { name: true, email: true } },
        categories: { include: { category: true } },
        tags: { include: { tag: true } }
      }
    })

    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    }

    return NextResponse.json(post)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch post' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await checkAuth(request)
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { title, slug: rawSlug, content, excerpt, featuredImage, metaTitle, metaDescription, published, featured, showAuthor, categoryIds, tagIds } = body

    const normalizedProvided = typeof rawSlug === 'string' && rawSlug.trim().length > 0 ? createSlug(rawSlug) : ''
    const titleBased = createSlug(title)
    const slug = normalizedProvided || titleBased
    if (!slug) {
      return NextResponse.json({ error: 'Slug is required' }, { status: 400 })
    }
    
    // Check if slug already exists for another post
    const existingPost = await prisma.post.findFirst({
      where: { 
        slug,
        NOT: { id: params.id }
      }
    })
    
    if (existingPost) {
      return NextResponse.json({ error: 'A post with this slug already exists' }, { status: 400 })
    }

    // Delete existing relationships
    await prisma.postCategory.deleteMany({
      where: { postId: params.id }
    })
    
    await prisma.postTag.deleteMany({
      where: { postId: params.id }
    })

    const post = await prisma.post.update({
      where: { id: params.id },
      data: ({
        title,
        slug,
        content,
        excerpt,
        featuredImage,
        metaTitle,
        metaDescription,
        published: published || false,
        featured: featured || false,
        showAuthor: !!showAuthor,
        publishedAt: published ? new Date() : null,
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
      }) as any,
      include: {
        author: { select: { name: true, email: true } },
        categories: { include: { category: true } },
        tags: { include: { tag: true } }
      }
    })

    return NextResponse.json(post)
  } catch (error) {
    console.error('Error updating post:', error)
    return NextResponse.json({ error: 'Failed to update post' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await checkAuth(request)
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const force = searchParams.get('force') === '1'
    if (force) {
      // Permanent delete
      await prisma.postCategory.deleteMany({ where: { postId: params.id } }).catch(() => {})
      await prisma.postTag.deleteMany({ where: { postId: params.id } }).catch(() => {})
      await prisma.post.delete({ where: { id: params.id } })
      return NextResponse.json({ message: 'Post permanently deleted' })
    } else {
      // Soft delete (trash)
      await prisma.post.update({ where: { id: params.id }, data: { deletedAt: new Date() } })
      return NextResponse.json({ message: 'Post moved to trash' })
    }
  } catch (error) {
    console.error('Error deleting post:', error)
    return NextResponse.json({ error: 'Failed to delete post' }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await checkAuth(request)
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  try {
    await prisma.post.update({ where: { id: params.id }, data: { deletedAt: null } })
    return NextResponse.json({ message: 'Post restored from trash' })
  } catch (error) {
    console.error('Error restoring post:', error)
    return NextResponse.json({ error: 'Failed to restore post' }, { status: 500 })
  }
}
