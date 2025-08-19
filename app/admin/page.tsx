'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import AdminChart from '@/components/AdminChart'

interface Stats {
  posts: number
  pages: number
  categories: number
  publishedPosts: number
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats>({
    posts: 0,
    pages: 0,
    categories: 0,
    publishedPosts: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/admin/stats')
        if (response.ok) {
          const data = await response.json()
          setStats(data)
        }
      } catch (error) {
        console.error('Failed to fetch stats:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

  if (loading) {
    return <div className="text-center">Loading dashboard...</div>
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold" style={{ color: 'var(--admin-text)' }}>Dashboard</h1>
        <p className="mt-2" style={{ color: 'var(--admin-text-muted)' }}>Welcome to your CMS admin panel</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="card">
          <div className="">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 rounded-md flex items-center justify-center" style={{ background: 'var(--admin-secondary)', color: '#fff' }}>
                  <span className="font-bold">P</span>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium truncate" style={{ color: 'var(--admin-text-muted)' }}>
                    Total Posts
                  </dt>
                  <dd className="text-lg font-medium" style={{ color: 'var(--admin-text)' }}>
                    {stats.posts}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 rounded-md flex items-center justify-center" style={{ background: 'var(--admin-success)', color: '#fff' }}>
                  <span className="font-bold">✓</span>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium truncate" style={{ color: 'var(--admin-text-muted)' }}>
                    Published Posts
                  </dt>
                  <dd className="text-lg font-medium" style={{ color: 'var(--admin-text)' }}>
                    {stats.publishedPosts}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 rounded-md flex items-center justify-center" style={{ background: '#8b5cf6', color: '#fff' }}>
                  <span className="font-bold">D</span>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium truncate" style={{ color: 'var(--admin-text-muted)' }}>
                    Pages
                  </dt>
                  <dd className="text-lg font-medium" style={{ color: 'var(--admin-text)' }}>
                    {stats.pages}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 rounded-md flex items-center justify-center" style={{ background: 'var(--admin-primary)', color: '#fff' }}>
                  <span className="font-bold">C</span>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium truncate" style={{ color: 'var(--admin-text-muted)' }}>
                    Categories
                  </dt>
                  <dd className="text-lg font-medium" style={{ color: 'var(--admin-text)' }}>
                    {stats.categories}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="text-lg font-medium mb-4" style={{ color: 'var(--admin-text)' }}>Quick Actions</h2>
          <div className="space-y-3">
            <Link
              href="/admin/posts/new"
              className="btn btn-secondary w-full"
            >
              Create New Post
            </Link>
            <Link
              href="/admin/pages/new"
              className="btn btn-primary w-full"
            >
              Create New Page
            </Link>
            <Link
              href="/admin/categories/new"
              className="btn btn-ghost w-full"
            >
              Add Category
            </Link>
            <Link
              href="/"
              target="_blank"
              className="btn btn-ghost w-full"
            >
              View Site
            </Link>
          </div>
        </div>

        <div className="card">
          <h2 className="text-lg font-medium mb-4" style={{ color: 'var(--admin-text)' }}>Traffic Overview</h2>
          <AdminChart
            type="line"
            data={[
              { label: 'Mon', value: 10 },
              { label: 'Tue', value: 15 },
              { label: 'Wed', value: 12 },
              { label: 'Thu', value: 22 },
              { label: 'Fri', value: 18 },
              { label: 'Sat', value: 25 },
              { label: 'Sun', value: 20 },
            ]}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <div className="card">
          <h2 className="text-lg font-medium mb-4" style={{ color: 'var(--admin-text)' }}>Recent Activity</h2>
          <div className="text-center py-8" style={{ color: 'var(--admin-text-muted)' }}>
            <p>No recent activity to display</p>
            <p className="text-sm mt-2">Start creating content to see activity here</p>
          </div>
        </div>
        <div className="card">
          <h2 className="text-lg font-medium mb-4" style={{ color: 'var(--admin-text)' }}>Top Categories</h2>
          <AdminChart
            type="bar"
            data={[
              { label: 'Tech', value: 30 },
              { label: 'News', value: 18 },
              { label: 'Design', value: 22 },
              { label: 'Tips', value: 12 },
            ]}
          />
        </div>
      </div>
    </div>
  )
}
