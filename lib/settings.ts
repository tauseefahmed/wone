import { prisma } from '@/lib/prisma'

export async function getSetting(key: string): Promise<string | null> {
  try {
    const item = await prisma.setting.findUnique({ where: { key } })
    return (item?.value ?? null) as string | null
  } catch (e) {
    console.error('getSetting error:', e)
    return null
  }
}

export async function getSiteName(defaultValue: string = 'My CMS Blog'): Promise<string> {
  const val = await getSetting('site_name')
  return (typeof val === 'string' && val.trim().length > 0) ? val : defaultValue
}

export async function getSiteFavicon(): Promise<string | null> {
  const val = await getSetting('site_favicon')
  return (typeof val === 'string' && val.trim().length > 0) ? val : null
}

export async function getFooterText(): Promise<string | null> {
  const val = await getSetting('footer_text')
  return (typeof val === 'string' && val.trim().length > 0) ? val : null
}

export type AboutAuthor = {
  name?: string
  bio?: string
  avatarUrl?: string
  website?: string
  twitter?: string
  github?: string
  linkedin?: string
}

export async function getAboutAuthor(): Promise<AboutAuthor | null> {
  const raw = await getSetting('about_author')
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw)
    if (parsed && typeof parsed === 'object') return parsed as AboutAuthor
  } catch (e) {
    console.error('getAboutAuthor parse error:', e)
  }
  return null
}
