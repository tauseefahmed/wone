'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)
  const [user, setUser] = useState<{ email: string } | null>(null)
  const [siteName, setSiteName] = useState<string>('CMS Admin')
  const router = useRouter()
  const pathname = usePathname()

  // Don't check authentication for login page
  const isLoginPage = pathname === '/admin/login'

  useEffect(() => {
    if (isLoginPage) {
      setIsAuthenticated(true) // Skip auth check for login page
      return
    }

    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/check')
        if (response.ok) {
          const userData = await response.json()
          setUser(userData)
          setIsAuthenticated(true)
          // Load site_name setting once authenticated
          try {
            const sres = await fetch('/api/admin/settings', { cache: 'no-store' })
            if (sres.ok) {
              const data = await sres.json()
              const found = Array.isArray(data?.settings) ? data.settings.find((s: any) => s.key === 'site_name') : null
              if (found && typeof found.value === 'string' && found.value.trim().length) {
                setSiteName(found.value.trim())
              }
            }
          } catch {}
        } else {
          setIsAuthenticated(false)
          router.push('/admin/login')
        }
      } catch (error) {
        setIsAuthenticated(false)
        router.push('/admin/login')
      }
    }

    checkAuth()
  }, [router, isLoginPage])

  // Re-fetch site_name when navigating inside admin (e.g., after saving settings)
  useEffect(() => {
    if (isLoginPage) return
    const loadSiteName = async () => {
      try {
        const sres = await fetch('/api/admin/settings', { cache: 'no-store' })
        if (sres.ok) {
          const data = await sres.json()
          const found = Array.isArray(data?.settings) ? data.settings.find((s: any) => s.key === 'site_name') : null
          if (found && typeof found.value === 'string' && found.value.trim().length) {
            setSiteName(found.value.trim())
          }
        }
      } catch {}
    }
    loadSiteName()
  }, [pathname, isLoginPage])

  // Listen for settings updates to refresh site name immediately
  useEffect(() => {
    if (isLoginPage) return
    const handler = () => {
      fetch('/api/admin/settings', { cache: 'no-store' })
        .then((r) => (r.ok ? r.json() : null))
        .then((data) => {
          const found = Array.isArray(data?.settings) ? data.settings.find((s: any) => s.key === 'site_name') : null
          if (found && typeof found.value === 'string' && found.value.trim().length) {
            setSiteName(found.value.trim())
          }
        })
        .catch(() => {})
    }
    window.addEventListener('settings-updated', handler as any)
    return () => window.removeEventListener('settings-updated', handler as any)
  }, [isLoginPage])

  if (isAuthenticated === null) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>
  }

  if (!isAuthenticated) {
    return null
  }

  // For login page, just render children without admin layout
  if (isLoginPage) {
    return <>{children}</>
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex items-center">
                <Link href="/admin" className="text-xl font-bold text-gray-900">
                  {siteName || 'CMS Admin'}
                </Link>
              </div>
              <div className="hidden sm:ml-6 sm:flex sm:space-x-8 flex items-center">
                <Link
                  href="/admin"
                  className="border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm"
                >
                  Dashboard
                </Link>
                <Link
                  href="/admin/posts"
                  className="border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm"
                >
                  Posts
                </Link>
                <Link
                  href="/admin/pages"
                  className="border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm"
                >
                  Pages
                </Link>
                <Link
                  href="/admin/media"
                  className="border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm"
                >
                  Media
                </Link>
                <Link
                  href="/admin/categories"
                  className="border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm"
                >
                  Categories
                </Link>
                <Link
                  href="/admin/settings"
                  className="border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm"
                >
                  Settings
                </Link>
              </div>
            </div>
            <div className="flex items-center">
              <span className="text-gray-700 mr-4">Welcome, {user?.email}</span>
              <button
                onClick={async () => {
                  await fetch('/api/auth/signout', { method: 'POST' })
                  window.location.href = '/admin/login'
                }}
                className="bg-gray-800 text-white px-3 py-2 rounded-md text-sm font-medium hover:bg-gray-700"
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      </nav>
      <main className="py-10">
        <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
          {children}
        </div>
      </main>
    </div>
  )
}
