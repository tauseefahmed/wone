import { formatDate } from '@/lib/utils'
import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import FrontShell from '@/components/FrontShell'

interface PageItem {
  id: string
  title: string
  slug: string
  content: string
  featuredImage: string | null
  metaTitle: string | null
  metaDescription: string | null
  published: boolean
  createdAt: Date
  author: {
    name: string | null
    email: string
  }
}

async function getPage(slug: string): Promise<PageItem | null> {
  try {
    const page = await prisma.page.findFirst({
      // Use any to account for schema client re-gen timing for deletedAt
      where: { slug, published: true, deletedAt: null } as any,
      include: {
        author: { select: { name: true, email: true } },
      },
    })
    return (page as unknown as PageItem) || null
  } catch (e) {
    console.error('getPage error:', e)
    return null
  }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const page = await getPage(slug)
  if (!page) return { title: 'Page Not Found' }
  return {
    title: page.metaTitle || page.title,
    description: page.metaDescription || undefined,
    openGraph: {
      title: page.metaTitle || page.title,
      description: page.metaDescription || undefined,
      type: 'article',
      publishedTime: page.createdAt.toISOString(),
      authors: [page.author.name || page.author.email],
      url: `/pages/${page.slug}`,
      images: page.featuredImage ? [{ url: page.featuredImage }] : undefined,
    },
  }
}

export default async function PublicPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const page = await getPage(slug)
  if (!page) notFound()

  return (
    <FrontShell>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <article className="bg-white rounded-lg shadow-lg overflow-hidden">
          {page.featuredImage ? (
            <img src={page.featuredImage} alt={page.title} className="w-full h-80 object-cover" />
          ) : (
            <div className="w-full h-80 bg-gray-200 flex items-center justify-center text-gray-500">
              <span className="text-sm">No image</span>
            </div>
          )}
          <div className="px-8 py-8 border-b border-gray-200">
            <div className="flex items-center text-sm text-gray-500 mb-4">
              <time dateTime={page.createdAt.toISOString()}>{formatDate(page.createdAt as any)}</time>
              <span className="mx-2">•</span>
              <span>By {page.author.name || page.author.email}</span>
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-4">{page.title}</h1>
            {page.metaDescription && (
              <p className="text-xl text-gray-600 leading-relaxed">{page.metaDescription}</p>
            )}
          </div>
          <div className="px-8 py-8">
            <div className="prose-content" dangerouslySetInnerHTML={{ __html: page.content }} />
          </div>
        </article>
      </main>
    </FrontShell>
  )
}
