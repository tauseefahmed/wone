import { NextRequest, NextResponse } from 'next/server'
import { checkAuth } from '@/lib/auth-middleware'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  const user = await checkAuth(request)
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { currentPassword, newPassword } = body || {}

    if (typeof currentPassword !== 'string' || typeof newPassword !== 'string') {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
    }

    if (newPassword.length < 8) {
      return NextResponse.json({ error: 'New password must be at least 8 characters long.' }, { status: 400 })
    }

    // Fetch the user from DB
    const dbUser = await prisma.user.findUnique({ where: { email: user.email } })
    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Verify current password
    const ok = await bcrypt.compare(currentPassword, dbUser.password)
    if (!ok) {
      return NextResponse.json({ error: 'Current password is incorrect.' }, { status: 400 })
    }

    // Prevent using the same password
    const same = await bcrypt.compare(newPassword, dbUser.password)
    if (same) {
      return NextResponse.json({ error: 'New password must be different from the current password.' }, { status: 400 })
    }

    const hashed = await bcrypt.hash(newPassword, 10)
    await prisma.user.update({ where: { id: dbUser.id }, data: { password: hashed } })

    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('Change password error:', e)
    return NextResponse.json({ error: 'Failed to change password' }, { status: 500 })
  }
}
