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

interface PageItem {
  id: string
  title: string
  slug: string
  content: string
  featuredImage: string | null
  published: boolean
  createdAt: Date
  author: {
    name: string | null
    email: string
  }
}

export async function generateMetadata({ searchParams }: { searchParams: { q?: string } }): Promise<Metadata> {
  const q = searchParams?.q?.toString() || ''
  return {
    title: q ? `Search: ${q}` : 'Search',
    description: q ? `Results for "${q}"` : 'Search posts and pages',
  }
}

type CombinedItem = {
  type: 'post' | 'page'
  id: string
  title: string
  slug: string
  content: string
  excerpt?: string | null
  featuredImage: string | null
  createdAt: Date
  authorName: string
  url: string
}

async function searchAll(q: string, page: number = 1, limit: number = 9) {
  const wherePost = q
    ? {
        published: true,
        OR: [
          { title: { contains: q } },
          { excerpt: { contains: q } },
          { content: { contains: q } },
          { metaTitle: { contains: q } },
          { metaDescription: { contains: q } },
        ],
      }
    : { published: true }

  const wherePage = q
    ? {
        published: true,
        OR: [
          { title: { contains: q } },
          { content: { contains: q } },
          { metaTitle: { contains: q } },
          { metaDescription: { contains: q } },
        ],
      }
    : { published: true }

  // Fetch a reasonable upper bound, then paginate in-memory
  const [posts, pages, postsTotal, pagesTotal] = await Promise.all([
    prisma.post.findMany({
      where: wherePost,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        title: true,
        slug: true,
        content: true,
        excerpt: true,
        featuredImage: true,
        createdAt: true,
        author: { select: { name: true, email: true } },
      },
      take: 200,
    }),
    prisma.page.findMany({
      where: wherePage,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        title: true,
        slug: true,
        content: true,
        featuredImage: true,
        createdAt: true,
        author: { select: { name: true, email: true } },
      },
      take: 200,
    }),
    prisma.post.count({ where: wherePost }),
    prisma.page.count({ where: wherePage }),
  ])

  const combined: CombinedItem[] = [
    ...posts.map((p) => ({
      type: 'post' as const,
      id: p.id,
      title: p.title,
      slug: p.slug,
      content: p.content,
      excerpt: (p as any).excerpt ?? null,
      featuredImage: p.featuredImage,
      createdAt: p.createdAt,
      authorName: p.author.name || p.author.email,
      url: `/${p.slug}`,
    })),
    ...pages.map((pg) => ({
      type: 'page' as const,
      id: pg.id,
      title: pg.title,
      slug: pg.slug,
      content: pg.content,
      featuredImage: pg.featuredImage,
      createdAt: pg.createdAt,
      authorName: pg.author.name || pg.author.email,
      url: `/pages/${pg.slug}`,
    })),
  ]

  combined.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())

  const total = postsTotal + pagesTotal
  const totalPages = Math.max(1, Math.ceil(total / limit))
  const start = (page - 1) * limit
  const end = start + limit
  const pageItems = combined.slice(start, end)

  return { results: pageItems, total, totalPages, currentPage: page }
}

export default async function SearchPage({ searchParams }: { searchParams: { q?: string; page?: string } }) {
  const q = (searchParams?.q || '').toString()
  const currentPage = Number(searchParams?.page) || 1
  const { results, total, totalPages } = await searchAll(q, currentPage, 9)

  return (
    <FrontShell>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Search</h1>
          {q ? (
            <p className="text-gray-600">Showing results for: <span className="font-medium">"{q}"</span> ({total})</p>
          ) : (
            <p className="text-gray-600">Enter a query in the search box above.</p>
          )}
        </div>

        {total === 0 ? (
          <div className="text-center py-16 bg-white rounded-lg border">
            <p className="text-gray-600">No results found.</p>
          </div>
        ) : (
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {results.map((item) => (
              <article key={item.id + item.type} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300">
                {item.featuredImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={item.featuredImage} alt={item.title} className="w-full h-44 object-cover" />
                ) : (
                  <div className="w-full h-44 bg-gray-200 flex items-center justify-center text-gray-500">
                    <span className="text-sm">No image</span>
                  </div>
                )}
                <div className="p-6">
                  <div className="flex items-center text-sm text-gray-500 mb-2">
                    <time dateTime={item.createdAt.toISOString()}>{formatDate(item.createdAt)}</time>
                    <span className="mx-2">•</span>
                    <span>{item.authorName}</span>
                    <span className="ml-2 inline-block rounded bg-gray-100 text-gray-600 text-[11px] px-2 py-0.5 uppercase">{item.type}</span>
                  </div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-2">
                    <Link href={item.url} className="hover:text-green-600 transition-colors">{item.title}</Link>
                  </h2>
                  <p className="text-gray-600 mb-4">
                    {'excerpt' in item && item.excerpt
                      ? item.excerpt || truncateText(item.content.replace(/<[^>]*>/g, ''), 140)
                      : truncateText(item.content.replace(/<[^>]*>/g, ''), 140)}
                  </p>
                  <Link href={item.url} className="text-green-600 hover:text-green-800 font-medium">Read more →</Link>
                </div>
              </article>
            ))}
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex justify-center mt-10">
            <nav className="flex items-center space-x-2">
              {currentPage > 1 && (
                <Link
                  href={`/search?q=${encodeURIComponent(q)}&page=${currentPage - 1}`}
                  className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 hover:text-gray-700"
                >
                  Previous
                </Link>
              )}
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <Link
                  key={page}
                  href={`/search?q=${encodeURIComponent(q)}&page=${page}`}
                  className={`px-3 py-2 text-sm font-medium rounded-md ${
                    page === currentPage
                      ? 'bg-green-600 text-white'
                      : 'text-gray-500 bg-white border border-gray-300 hover:bg-gray-50 hover:text-gray-700'
                  }`}
                >
                  {page}
                </Link>
              ))}
            </nav>
          </div>
        )}
      </main>
    </FrontShell>
  )
}
