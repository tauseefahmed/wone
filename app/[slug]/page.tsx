import { formatDate } from '@/lib/utils'
import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import FrontShell from '@/components/FrontShell'
import { getAboutAuthor } from '@/lib/settings'

interface Post {
  id: string
  title: string
  slug: string
  content: string
  excerpt: string | null
  featuredImage: string | null
  metaTitle: string | null
  metaDescription: string | null
  published: boolean
  showAuthor?: boolean
  createdAt: Date
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

async function getPost(slug: string): Promise<Post | null> {
  try {
    const post = await prisma.post.findFirst({
      where: { slug, published: true },
      include: {
        author: { select: { name: true, email: true } },
        categories: { include: { category: { select: { id: true, name: true, slug: true } } } },
        tags: { include: { tag: { select: { id: true, name: true, slug: true } } } },
      },
    })
    return post
  } catch (e) {
    console.error('getPost error:', e)
    return null
  }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const post = await getPost(slug)
  if (!post) return { title: 'Post Not Found' }
  return {
    title: post.metaTitle || post.title,
    description: post.metaDescription || post.excerpt || undefined,
    openGraph: {
      title: post.metaTitle || post.title,
      description: post.metaDescription || post.excerpt || undefined,
      type: 'article',
      publishedTime: post.createdAt.toISOString(),
      authors: [post.author.name || post.author.email],
      url: `/${post.slug}`,
      images: post.featuredImage ? [{ url: post.featuredImage }] : undefined,
    },
  }
}

export default async function PostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const post = await getPost(slug)
  if (!post) notFound()
  const authorProfile = await getAboutAuthor()

  return (
    <FrontShell>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <article className="bg-white rounded-lg shadow-lg overflow-hidden">
          {/* Featured image or placeholder */}
          {post.featuredImage ? (
            <img
              src={post.featuredImage}
              alt={post.title}
              className="w-full h-80 object-cover"
            />
          ) : (
            <div className="w-full h-80 bg-gray-200 flex items-center justify-center text-gray-500">
              <span className="text-sm">No image</span>
            </div>
          )}
          <div className="px-8 py-8 border-b border-gray-200">
            <div className="flex items-center text-sm text-gray-500 mb-4">
              <time dateTime={post.createdAt.toISOString()}>{formatDate(post.createdAt)}</time>
              <span className="mx-2">•</span>
              <span>By {post.author.name || post.author.email}</span>
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-4">{post.title}</h1>
            {post.excerpt && <p className="text-xl text-gray-600 leading-relaxed">{post.excerpt}</p>}
          </div>

          {(post.categories.length > 0 || post.tags.length > 0) && (
            <div className="px-8 py-4 bg-gray-50 border-b border-gray-200">
              {post.categories.length > 0 && (
                <div className="mb-2">
                  <span className="text-sm font-medium text-gray-700 mr-2">Categories:</span>
                  {post.categories.map(({ category }) => (
                    <span key={category.id} className="inline-block bg-blue-100 text-blue-800 text-sm px-3 py-1 rounded-full mr-2">{category.name}</span>
                  ))}
                </div>
              )}
              {post.tags.length > 0 && (
                <div>
                  <span className="text-sm font-medium text-gray-700 mr-2">Tags:</span>
                  {post.tags.map(({ tag }) => (
                    <span key={tag.id} className="inline-block bg-gray-100 text-gray-700 text-sm px-3 py-1 rounded-full mr-2">#{tag.name}</span>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="px-8 py-8">
            <div className="prose-content" dangerouslySetInnerHTML={{ __html: post.content }} />
          </div>
          {post.showAuthor && authorProfile && (
            <div className="px-8 pb-10">
              <div className="mt-4 p-6 bg-gray-50 rounded-lg border">
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-200 border flex-shrink-0">
                    {authorProfile.avatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={authorProfile.avatarUrl} alt={authorProfile.name || 'Author'} className="w-16 h-16 object-cover" />
                    ) : (
                      <div className="w-16 h-16" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-lg font-semibold text-gray-900">{authorProfile.name || post.author.name || post.author.email}</h3>
                    {authorProfile.bio && <p className="mt-1 text-sm text-gray-700 whitespace-pre-line">{authorProfile.bio}</p>}
                    <div className="mt-2 flex flex-wrap items-center gap-3 text-sm">
                      {authorProfile.website && (
                        <a href={authorProfile.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Website</a>
                      )}
                      {authorProfile.twitter && (
                        <a href={authorProfile.twitter} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Twitter</a>
                      )}
                      {authorProfile.github && (
                        <a href={authorProfile.github} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">GitHub</a>
                      )}
                      {authorProfile.linkedin && (
                        <a href={authorProfile.linkedin} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">LinkedIn</a>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </article>

      </main>
    </FrontShell>
  )
}
