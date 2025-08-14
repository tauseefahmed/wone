import { NextRequest } from 'next/server'
import { prisma } from './prisma'

export async function checkAuth(request: NextRequest) {
  try {
    // Check for auth cookie
    const authCookie = request.cookies.get('admin-auth')
    
    if (!authCookie || authCookie.value !== 'authenticated') {
      return null
    }
    
    // Get the actual admin user from database
    const user = await prisma.user.findUnique({
      where: { email: 'admin@example.com' }
    })
    
    if (!user) {
      return null
    }
    
    return {
      id: user.id,
      email: user.email,
      name: user.name
    }
  } catch (error) {
    console.error('Auth check error:', error)
    return null
  }
}
