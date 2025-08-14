import { NextRequest, NextResponse } from 'next/server'
import { checkAuth } from '@/lib/auth-middleware'
import { mkdir, writeFile } from 'fs/promises'
import { randomUUID } from 'crypto'
import path from 'path'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  const user = await checkAuth(request)
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Basic validation
    const allowed = [
      // images
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/gif',
      'image/svg+xml',
      'image/x-icon',
      'image/vnd.microsoft.icon',
      // documents
      'application/pdf',
      // audio
      'audio/mpeg', // mp3
      'audio/ogg',
      'audio/wav',
      // video (to complement editor video node)
      'video/mp4',
      'video/webm',
    ]
    if (!allowed.includes(file.type)) {
      return NextResponse.json({ error: 'Unsupported file type' }, { status: 400 })
    }

    // Size validation - configurable via env (MAX_UPLOAD_MB), default 5 MB
    const MAX_MB = Number(process.env.MAX_UPLOAD_MB ?? '5')
    const MAX_BYTES = MAX_MB * 1024 * 1024
    if ((file as any).size && (file as any).size > MAX_BYTES) {
      return NextResponse.json({ error: `File too large. Max size is ${MAX_MB} MB.` }, { status: 413 })
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Ensure uploads directory exists
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads')
    await mkdir(uploadsDir, { recursive: true })

    const ext = mimeExtension(file.type)
    const filename = `${randomUUID()}.${ext}`
    const fullPath = path.join(uploadsDir, filename)

    await writeFile(fullPath, buffer)

    // Public URL
    const url = `/uploads/${filename}`
    return NextResponse.json({ url })
  } catch (e) {
    console.error('Upload error:', e)
    return NextResponse.json({ error: 'Failed to upload file' }, { status: 500 })
  }
}

function mimeExtension(mime: string): string {
  switch (mime) {
    case 'image/jpeg':
      return 'jpg'
    case 'image/png':
      return 'png'
    case 'image/webp':
      return 'webp'
    case 'image/gif':
      return 'gif'
    case 'image/svg+xml':
      return 'svg'
    case 'image/x-icon':
    case 'image/vnd.microsoft.icon':
      return 'ico'
    case 'application/pdf':
      return 'pdf'
    case 'audio/mpeg':
      return 'mp3'
    case 'audio/ogg':
      return 'ogg'
    case 'audio/wav':
      return 'wav'
    case 'video/mp4':
      return 'mp4'
    case 'video/webm':
      return 'webm'
    default:
      return 'bin'
  }
}
