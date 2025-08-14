import { NextRequest, NextResponse } from 'next/server'
import { checkAuth } from '@/lib/auth-middleware'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  const user = await checkAuth(request)
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const [posts, pages, categories, publishedPosts] = await Promise.all([
      prisma.post.count(),
      prisma.page.count(),
      prisma.category.count(),
      prisma.post.count({ where: { published: true } })
    ])

    return NextResponse.json({
      posts,
      pages,
      categories,
      publishedPosts
    })
  } catch (error) {
    console.error('Error fetching stats:', error)
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 })
  }
}
