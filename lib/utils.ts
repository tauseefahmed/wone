import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import slugify from "slugify"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function createSlug(text: string): string {
  return slugify(text, {
    lower: true,
    strict: true,
    remove: /[*+~.()'"!:@]/g
  })
}

export function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

export function truncateText(text: string, length: number = 150): string {
  if (text.length <= length) return text
  return text.substring(0, length).trim() + '...'
}

// Remove HTML tags and collapse whitespace
export function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, ' ') // drop tags
    .replace(/&nbsp;|&#160;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim()
}

// Estimate reading time assuming ~200 wpm
export function readingTime(htmlOrText: string): string {
  const text = stripHtml(htmlOrText)
  const words = text ? text.split(/\s+/).filter(Boolean).length : 0
  const minutes = Math.max(1, Math.ceil(words / 200))
  return `${minutes} min read`
}
