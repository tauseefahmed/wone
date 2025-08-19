'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { Inter } from 'next/font/google'
import {
  LayoutDashboard,
  FileText,
  Images,
  Layers,
  Settings,
  Bell,
  Menu,
  LogOut,
  Search as SearchIcon,
} from 'lucide-react'

const inter = Inter({ subsets: ['latin'], weight: ['300', '400', '600', '700'] })

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
  // Hooks must be declared before any conditional returns
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

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

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/')
  const NavItem = ({ href, label, icon }: { href: string; label: string; icon?: React.ReactNode }) => (
    <Link href={href} className={`nav-item ${isActive(href) ? 'active' : ''}`} onClick={() => setMobileOpen(false)}>
      {icon}
      <span>{label}</span>
    </Link>
  )

  return (
    <div className={`${inter.className} admin-theme min-h-screen`}>
      <div className="layout">
        {/* Mobile overlay */}
        {mobileOpen && (
          <div className="fixed inset-0 z-40 bg-black/30 md:hidden" onClick={() => setMobileOpen(false)} />
        )}

        {/* Sidebar */}
        <aside className={`admin-sidebar p-4 ${collapsed ? 'collapsed' : ''} hidden md:block`}>
          <div className="mb-6 flex items-center justify-between">
            <Link href="/admin" className="text-xl font-bold brand" style={{ color: 'var(--admin-text)' }}>
              {siteName || 'CMS Admin'}
            </Link>
            <button className="btn btn-ghost collapse-toggle" onClick={() => setCollapsed((v) => !v)} aria-label="Toggle sidebar">
              <Menu size={18} />
            </button>
          </div>
          <div className="space-y-1">
            <NavItem href="/admin" label="Dashboard" icon={<LayoutDashboard size={18} />} />
            <NavItem href="/admin/posts" label="Posts" icon={<FileText size={18} />} />
            <NavItem href="/admin/pages" label="Pages" icon={<Layers size={18} />} />
            <NavItem href="/admin/media" label="Media" icon={<Images size={18} />} />
            <NavItem href="/admin/categories" label="Categories" icon={<Layers size={18} />} />
            <div className="mt-4 pt-4" style={{ borderTop: '1px solid #E5E7EB' }} />
            <NavItem href="/admin/settings" label="Settings" icon={<Settings size={18} />} />
          </div>
        </aside>

        {/* Mobile Sidebar Drawer */}
        <aside className={`admin-sidebar p-4 fixed z-50 top-0 left-0 h-full md:hidden ${mobileOpen ? '' : 'hidden'}`}>
          <div className="mb-6 flex items-center justify-between">
            <Link href="/admin" className="text-xl font-bold brand" style={{ color: 'var(--admin-text)' }}>
              {siteName || 'CMS Admin'}
            </Link>
            <button className="btn btn-ghost" onClick={() => setMobileOpen(false)} aria-label="Close menu">
              <Menu size={18} />
            </button>
          </div>
          <div className="space-y-1">
            <NavItem href="/admin" label="Dashboard" icon={<LayoutDashboard size={18} />} />
            <NavItem href="/admin/posts" label="Posts" icon={<FileText size={18} />} />
            <NavItem href="/admin/pages" label="Pages" icon={<Layers size={18} />} />
            <NavItem href="/admin/media" label="Media" icon={<Images size={18} />} />
            <NavItem href="/admin/categories" label="Categories" icon={<Layers size={18} />} />
            <div className="mt-4 pt-4" style={{ borderTop: '1px solid #E5E7EB' }} />
            <NavItem href="/admin/settings" label="Settings" icon={<Settings size={18} />} />
          </div>
        </aside>

        {/* Content */}
        <div className="admin-content">
          <header className="admin-topbar">
            <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center gap-4">
              <button className="btn btn-ghost md:hidden" onClick={() => setMobileOpen(true)} aria-label="Open menu">
                <Menu size={18} />
              </button>
              <div className="hidden md:flex items-center gap-2 flex-1">
                <SearchIcon size={18} color="#9CA3AF" />
                <input className="input" placeholder="Search..." />
              </div>
              <button className="btn btn-ghost" aria-label="Notifications"><Bell size={18} /></button>
              <div className="avatar avatar-md">
                <img src={`https://www.gravatar.com/avatar?d=identicon`} alt="profile" />
              </div>
              <button
                onClick={async () => {
                  await fetch('/api/auth/signout', { method: 'POST' })
                  window.location.href = '/admin/login'
                }}
                className="btn btn-primary"
              >
                <LogOut size={16} />
                Sign out
              </button>
            </div>
          </header>
          <main className="p-6">
            <div className="max-w-7xl mx-auto">
              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}
