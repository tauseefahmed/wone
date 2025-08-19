import Link from 'next/link'
import { formatDate, truncateText, stripHtml, readingTime } from '@/lib/utils'
import { prisma } from '@/lib/prisma'
import { Suspense } from 'react'
import FrontShell from '@/components/FrontShell'

interface Post {
  id: string
  title: string
  slug: string
  content: string
  excerpt: string | null
  featuredImage: string | null
  published: boolean
  featured?: boolean
  createdAt: string | Date
  author: {
    name: string | null
    email: string
  }
  categories: Array<{
    category: {
      id: string
      name: string
      slug: string
    }
  }>
  tags: Array<{
    tag: {
      id: string
      name: string
      slug: string
    }
  }>
}

interface HomePageProps {
  searchParams: { page?: string }
}

async function getPosts(page: number = 1, limit: number = 6, excludeId?: string) {
  const skip = (page - 1) * limit
  
  const [posts, total] = await Promise.all([
    prisma.post.findMany({
      where: { published: true, ...(excludeId ? { id: { not: excludeId } } : {}) },
      include: {
        author: {
          select: {
            name: true,
            email: true,
          },
        },
        categories: {
          include: {
            category: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
          },
        },
        tags: {
          include: {
            tag: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      skip,
      take: limit,
    }),
    prisma.post.count({
      where: { published: true, ...(excludeId ? { id: { not: excludeId } } : {}) },
    }),
  ])

  return {
    posts,
    total,
    totalPages: Math.ceil(total / limit),
    currentPage: page,
  }
}

async function getFeaturedPost(): Promise<Post | null> {
  const post = await prisma.post.findFirst({
    where: { published: true, featured: true },
    include: {
      author: { select: { name: true, email: true } },
      categories: { include: { category: { select: { id: true, name: true, slug: true } } } },
      tags: { include: { tag: { select: { id: true, name: true, slug: true } } } },
    },
    orderBy: { createdAt: 'desc' },
  })
  return post as any
}

function PostCard({ post }: { post: Post }) {
  return (
    <article className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300">
      <div className="p-6">
        <div className="flex items-center text-sm text-gray-500 mb-2">
          <time dateTime={new Date(post.createdAt as any).toISOString()}>
            {formatDate(post.createdAt as any)}
          </time>
          <span className="mx-2">•</span>
          <span>{post.author.name || post.author.email}</span>
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-3">
          <Link 
            href={`/${post.slug}`}
            className="hover:text-green-600 transition-colors duration-200"
          >
            {post.title}
          </Link>
        </h2>
        <p className="text-gray-600 mb-4 leading-relaxed">
          {post.excerpt || truncateText(post.content.replace(/<[^>]*>/g, ''), 150)}
        </p>
        <div className="flex flex-wrap gap-2 mb-4">
          {post.categories.map(({ category }) => (
            <span
              key={category.id}
              className="inline-block bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full"
            >
              {category.name}
            </span>
          ))}
          {post.tags.map(({ tag }) => (
            <span
              key={tag.id}
              className="inline-block bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded-full"
            >
              #{tag.name}
            </span>
          ))}
        </div>
        <Link
          href={`/${post.slug}`}
          className="inline-flex items-center text-green-600 hover:text-green-800 font-medium transition-colors duration-200"
        >
          Read more
          <svg className="ml-1 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      </div>
    </article>
  )
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const _currentPage = Number(searchParams.page) || 1 // unused now on home
  const featuredPost = await getFeaturedPost()
  const { posts, total } = await getPosts(1, 6, featuredPost?.id)

  return (
    <FrontShell>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Featured Post */}
        {featuredPost && (
          <section className="relative overflow-hidden rounded-2xl mb-10 bg-gray-900 text-white min-h-[380px] sm:min-h-[420px] lg:min-h-[520px] flex items-center">
            <div className="absolute inset-0">
              {featuredPost.featuredImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={featuredPost.featuredImage} alt={featuredPost.title} className="w-full h-full object-cover" />
              ) : null}
              <div className="hero-animated-bg opacity-80" />
            </div>
            <div className="relative z-10 w-full p-8 sm:p-12 lg:p-16">
              <div className="w-full max-w-3xl">
                <div className="text-sm text-gray-200 mb-3 flex items-center flex-wrap gap-x-2 gap-y-1">
                  <time dateTime={new Date(featuredPost.createdAt as any).toISOString()} className="opacity-90">{formatDate(featuredPost.createdAt as any)}</time>
                  <span className="opacity-80">•</span>
                  <span className="opacity-90">{featuredPost.author.name || featuredPost.author.email}</span>
                  <span className="opacity-80">•</span>
                  <span className="opacity-90">{readingTime(featuredPost.content)}</span>
                </div>
                <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight mb-4">{featuredPost.title}</h1>
                <p className="text-gray-200 mb-6">
                  {featuredPost.excerpt || truncateText(stripHtml(featuredPost.content), 220)}
                </p>
                <Link href={`/${featuredPost.slug}`} className="inline-flex items-center bg-white text-gray-900 px-5 py-2.5 rounded-md font-semibold hover:bg-gray-100 transition">
                  Read now
                  <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
            </div>
          </section>
        )}

        {posts.length === 0 ? (
          <div className="text-center py-12">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">No posts found</h2>
            <p className="text-gray-600">There are no published posts yet. Check back later!</p>
          </div>
        ) : (
          <>
            {/* Posts Grid */}
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3 mb-12">
              {posts.map((post) => (
                <article key={post.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300">
                  {/* Featured image or placeholder */}
                  {post.featuredImage ? (
                    <img
                      src={post.featuredImage}
                      alt={post.title}
                      className="w-full h-48 object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-48 bg-gray-200 flex items-center justify-center text-gray-500">
                      <span className="text-sm">No image</span>
                    </div>
                  )}
                  <div className="p-6">
                    <div className="flex items-center text-sm text-gray-500 mb-2 flex-wrap gap-x-2 gap-y-1">
                      <time dateTime={new Date(post.createdAt as any).toISOString()}>
                        {formatDate(post.createdAt as any)}
                      </time>
                      <span>•</span>
                      <span>{post.author.name || post.author.email}</span>
                      <span>•</span>
                      <span>{readingTime(post.content)}</span>
                    </div>
                    
                    <h2 className="text-xl font-semibold text-gray-900 mb-3">
                      <Link 
                        href={`/${post.slug}`}
                        className="hover:text-green-600 transition-colors duration-200"
                      >
                        {post.title}
                      </Link>
                    </h2>
                    
                    <p className="text-gray-600 mb-4 leading-relaxed">
                      {post.excerpt || truncateText(stripHtml(post.content), 150)}
                    </p>
                    
                    <div className="flex flex-wrap gap-2 mb-4">
                      {(() => {
                        const cats = post.categories.map(c => c.category)
                        const tags = post.tags.map(t => t.tag)
                        const showCats = cats.slice(0, 2)
                        const showTags = tags.slice(0, 2)
                        const moreCats = Math.max(0, cats.length - showCats.length)
                        const moreTags = Math.max(0, tags.length - showTags.length)
                        return (
                          <>
                            {showCats.map((category) => (
                              <span key={category.id} className="inline-block bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                                {category.name}
                              </span>
                            ))}
                            {moreCats > 0 && (
                              <span className="inline-block bg-green-50 text-green-700 text-xs px-2 py-1 rounded-full">+{moreCats}</span>
                            )}
                            {showTags.map((tag) => (
                              <span key={tag.id} className="inline-block bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded-full">
                                #{tag.name}
                              </span>
                            ))}
                            {moreTags > 0 && (
                              <span className="inline-block bg-gray-50 text-gray-700 text-xs px-2 py-1 rounded-full">+{moreTags}</span>
                            )}
                          </>
                        )
                      })()}
                    </div>
                    
                    <Link
                      href={`/${post.slug}`}
                      className="inline-flex items-center text-green-600 hover:text-green-800 font-medium transition-colors duration-200"
                    >
                      Read more
                      <svg className="ml-1 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </Link>
                  </div>
                </article>
              ))}
            </div>
            {/* View all posts link if there are more than shown */}
            {total > posts.length && (
              <div className="flex justify-end">
                <Link href="/blog" className="text-green-600 hover:text-green-800 font-medium inline-flex items-center">
                  View all posts
                  <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
            )}
          </>
        )}
      </main>
    </FrontShell>
  )
}
