import { NextRequest, NextResponse } from 'next/server'
import { checkAuth } from '@/lib/auth-middleware'
import { prisma } from '@/lib/prisma'
import { createSlug } from '@/lib/utils'
import { XMLParser } from 'fast-xml-parser'

export const runtime = 'nodejs'

// Helper to coerce a value to string
function asString(v: any): string | null {
  if (v == null) return null
  if (typeof v === 'string') return v
  if (typeof v === 'number' || typeof v === 'boolean') return String(v)
  return null
}

function firstNonEmpty(...vals: Array<any>): string | null {
  for (const v of vals) {
    const s = asString(v)?.trim()
    if (s) return s
  }
  return null
}

function parseDateLike(v: any): Date | null {
  const s = asString(v)
  if (!s) return null
  const d = new Date(s)
  return isNaN(d.getTime()) ? null : d
}

function looksLikeWXR(obj: any): boolean {
  return !!(obj?.rss && obj?.rss?.channel && Array.isArray(obj?.rss?.channel?.item))
}

function toArray<T = any>(v: any): T[] {
  if (v == null) return []
  if (Array.isArray(v)) return v
  return [v]
}

// Heuristic mapping from a generic XML node to a normalized content object
function mapNodeToContent(node: any) {
  // Common fields across formats
  const title = firstNonEmpty(node?.title, node?.name, node?.headline)
  const content = firstNonEmpty(
    node?.['content:encoded'],
    node?.content,
    node?.body,
    node?.description,
    node?.html
  )
  const excerpt = firstNonEmpty(node?.excerpt, node?.summary, node?.description_short)
  const slugRaw = firstNonEmpty(node?.slug, node?.link, node?.permalink, node?.guid)
  const status = firstNonEmpty(node?.status, node?.post_status, node?.state)
  const publishedAt = parseDateLike(firstNonEmpty(node?.date, node?.pubDate, node?.published, node?.created_at))
  const featuredImage = firstNonEmpty(node?.featured_image, node?.thumbnail, node?.image, node?.['wp:attachment_url'])

  return {
    title,
    content,
    excerpt,
    slugRaw,
    status,
    publishedAt,
    featuredImage,
  }
}

// Specialized mapping for WordPress WXR items
function mapWxrItem(item: any) {
  const title = firstNonEmpty(item?.title)
  const content = firstNonEmpty(item?.['content:encoded'], item?.description)
  const excerpt = firstNonEmpty(item?.['excerpt:encoded'])
  const slugRaw = firstNonEmpty(item?.['wp:post_name'], item?.link, item?.guid)
  const status = firstNonEmpty(item?.['wp:status'])
  const postType = firstNonEmpty(item?.['wp:post_type'])
  const publishedAt = parseDateLike(firstNonEmpty(item?.pubDate, item?.['wp:post_date']))
  // Try image from media attachments linked in content or separate meta; best-effort
  const featuredImage = firstNonEmpty(item?.featured_image, item?.['wp:attachment_url'])
  return { title, content, excerpt, slugRaw, status, postType, publishedAt, featuredImage }
}

export async function POST(request: NextRequest) {
  const user = await checkAuth(request)
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const form = await request.formData()
    const file = form.get('file') as unknown as File | null
    const target = (form.get('target') as string | null)?.toLowerCase() as 'auto' | 'posts' | 'pages' | undefined

    if (!file) return NextResponse.json({ error: 'No file uploaded' }, { status: 400 })
    if (!file.name.toLowerCase().endsWith('.xml')) {
      return NextResponse.json({ error: 'Only .xml files are allowed' }, { status: 400 })
    }

    const buf = Buffer.from(await file.arrayBuffer())
    const xml = buf.toString('utf8')

    const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '', allowBooleanAttributes: true })
    const data = parser.parse(xml)

    let items: any[] = []
    let isWXR = false

    if (looksLikeWXR(data)) {
      isWXR = true
      const wxrItems = toArray<any>(data.rss.channel.item)
      items = wxrItems.map((it) => ({ __raw: it, __kind: 'wxr' }))
    } else {
      // Try to find likely arrays: posts, post, pages, page, items, entry, article
      const candidates = [
        data?.posts?.post,
        data?.pages?.page,
        data?.items?.item,
        data?.rss?.channel?.item,
        data?.entry,
        data?.articles?.article,
        data?.post,
        data?.page,
        data?.item,
      ].flatMap(toArray).filter(Boolean)

      if (candidates.length) {
        items = candidates.map((it) => ({ __raw: it, __kind: 'generic' }))
      } else {
        return NextResponse.json({ error: 'Could not find recognizable content items in XML' }, { status: 400 })
      }
    }

    let importedPosts = 0
    let importedPages = 0
    let skipped = 0
    const errors: string[] = []

    for (const entry of items) {
      try {
        const node = entry.__raw
        let mapped:
          | (ReturnType<typeof mapWxrItem> & { postType?: string | null })
          | ReturnType<typeof mapNodeToContent>

        if (entry.__kind === 'wxr') {
          mapped = mapWxrItem(node)
        } else {
          mapped = mapNodeToContent(node)
        }

        const title = mapped.title?.trim()
        const content = mapped.content?.trim()

        if (!title || !content) {
          skipped++
          continue
        }

        // Determine destination type
        let dest: 'post' | 'page' = 'post'
        if (target === 'posts') dest = 'post'
        else if (target === 'pages') dest = 'page'
        else {
          // auto
          const pt = (entry.__kind === 'wxr' ? (mapped as any).postType : null)?.toLowerCase()
          if (pt === 'page') dest = 'page'
          else dest = 'post'
        }

        // Build slug
        const slugBase = createSlug(mapped.slugRaw || title)
        let slug = slugBase
        if (!slug) {
          skipped++
          continue
        }

        // Ensure slug uniqueness per model
        const ensureUnique = async (model: 'post' | 'page', base: string) => {
          let candidate = base
          let i = 1
          while (true) {
            const exists = model === 'post'
              ? await prisma.post.findUnique({ where: { slug: candidate } })
              : await prisma.page.findUnique({ where: { slug: candidate } })
            if (!exists) return candidate
            candidate = `${base}-${Date.now().toString().slice(-6)}-${i++}`
          }
        }
        slug = await ensureUnique(dest, slug)

        const published = (mapped as any).status?.toLowerCase?.() === 'publish' || (mapped as any).status?.toLowerCase?.() === 'published'
        const publishedAt = mapped.publishedAt || (published ? new Date() : null)
        const featuredImage = mapped.featuredImage || null

        if (dest === 'post') {
          await prisma.post.create({
            data: {
              title,
              slug,
              content,
              excerpt: mapped.excerpt || null,
              featuredImage,
              metaTitle: title,
              metaDescription: (mapped.excerpt || '').slice(0, 160) || null,
              published,
              featured: false,
              publishedAt: published ? (publishedAt as Date | null) : null,
              authorId: user.id,
            },
          })
          importedPosts++
        } else {
          await prisma.page.create({
            data: {
              title,
              slug,
              content,
              featuredImage,
              metaTitle: title,
              metaDescription: (mapped.excerpt || '').slice(0, 160) || null,
              published,
              publishedAt: published ? (publishedAt as Date | null) : null,
              authorId: user.id,
            },
          })
          importedPages++
        }
      } catch (e: any) {
        skipped++
        errors.push(e?.message || 'Unknown error importing an item')
      }
    }

    return NextResponse.json({ importedPosts, importedPages, skipped, errors })
  } catch (error) {
    console.error('Import failed:', error)
    return NextResponse.json({ error: 'Failed to import' }, { status: 500 })
  }
}
