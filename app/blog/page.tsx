import Link from 'next/link'
import type { Metadata } from 'next'
import { prisma } from '@/lib/prisma'
import FrontShell from '@/components/FrontShell'
import { formatDate, truncateText } from '@/lib/utils'

interface Post {
  id: string
  title: string
  slug: string
  content: string
  excerpt: string | null
  featuredImage: string | null
  published: boolean
  createdAt: Date
  author: {
    name: string | null
    email: string
  }
}

export const metadata: Metadata = {
  title: 'All Posts',
  description: 'Browse all blog posts',
}

async function getAllPosts(page: number = 1, limit: number = 12) {
  const skip = (page - 1) * limit
  const [posts, total] = await Promise.all([
    prisma.post.findMany({
      where: { published: true },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        title: true,
        slug: true,
        content: true,
        excerpt: true,
        featuredImage: true,
        published: true,
        createdAt: true,
        author: { select: { name: true, email: true } },
      },
      skip,
      take: limit,
    }),
    prisma.post.count({ where: { published: true } }),
  ])

  return { posts: posts as unknown as Post[], total, totalPages: Math.ceil(total / limit), currentPage: page }
}

export default async function BlogIndex({ searchParams }: { searchParams: { page?: string } }) {
  const currentPage = Number(searchParams?.page) || 1
  const { posts, total, totalPages } = await getAllPosts(currentPage, 12)

  return (
    <FrontShell>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">All Posts</h1>
          <p className="text-gray-600">{total} posts</p>
        </div>

        {posts.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-lg border">
            <p className="text-gray-600">No posts found.</p>
          </div>
        ) : (
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3 mb-12">
            {posts.map((post) => (
              <article key={post.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300">
                {post.featuredImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={post.featuredImage} alt={post.title} className="w-full h-48 object-cover" />
                ) : (
                  <div className="w-full h-48 bg-gray-200 flex items-center justify-center text-gray-500">
                    <span className="text-sm">No image</span>
                  </div>
                )}
                <div className="p-6">
                  <div className="flex items-center text-sm text-gray-500 mb-2">
                    <time dateTime={post.createdAt.toISOString()}>{formatDate(post.createdAt)}</time>
                    <span className="mx-2">•</span>
                    <span>{post.author.name || post.author.email}</span>
                  </div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-2">
                    <Link href={`/${post.slug}`} className="hover:text-green-600 transition-colors">{post.title}</Link>
                  </h2>
                  <p className="text-gray-600 mb-4">
                    {post.excerpt || truncateText(post.content.replace(/<[^>]*>/g, ''), 150)}
                  </p>
                  <Link href={`/${post.slug}`} className="text-green-600 hover:text-green-800 font-medium">Read more →</Link>
                </div>
              </article>
            ))}
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex justify-center">
            <nav className="flex items-center space-x-2">
              {currentPage > 1 && (
                <Link
                  href={`/blog?page=${currentPage - 1}`}
                  className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 hover:text-gray-700 transition-colors duration-200"
                >
                  Previous
                </Link>
              )}

              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <Link
                  key={page}
                  href={`/blog?page=${page}`}
                  className={`px-3 py-2 text-sm font-medium rounded-md transition-colors duration-200 ${
                    page === currentPage
                      ? 'bg-green-600 text-white'
                      : 'text-gray-500 bg-white border border-gray-300 hover:bg-gray-50 hover:text-gray-700'
                  }`}
                >
                  {page}
                </Link>
              ))}

              {currentPage < totalPages && (
                <Link
                  href={`/blog?page=${currentPage + 1}`}
                  className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 hover:text-gray-700 transition-colors duration-200"
                >
                  Next
                </Link>
              )}
            </nav>
          </div>
        )}
      </main>
    </FrontShell>
  )
}
