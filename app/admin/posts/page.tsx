'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { formatDate } from '@/lib/utils'
import { Edit as EditIcon, Eye, Trash2, RotateCcw, XCircle, Plus } from 'lucide-react'

interface Post {
  id: string
  title: string
  slug: string
  published: boolean
  featured: boolean
  createdAt: string
  author: {
    name: string | null
    email: string
  }
  categories: Array<{
    category: {
      name: string
    }
  }>
}

interface Category {
  id: string
  name: string
}

export default function PostsPage() {
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [showTrash, setShowTrash] = useState(false)
  const [search, setSearch] = useState('')
  const [categories, setCategories] = useState<Category[]>([])
  const [categoryId, setCategoryId] = useState<string>('')

  const fetchPosts = async (page: number = 1, trash: boolean = showTrash) => {
    try {
      const response = await fetch(`/api/admin/posts?page=${page}&limit=10&trash=${trash ? '1' : '0'}`)
      if (response.ok) {
        const data = await response.json()
        setPosts(data.posts)
        setTotalPages(data.pagination.pages)
        setCurrentPage(page)
      }
    } catch (error) {
      console.error('Failed to fetch posts:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPosts()
    // Load categories for filter
    fetch('/api/admin/categories')
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(data => setCategories(Array.isArray(data?.categories) ? data.categories : []))
      .catch(() => {})
  }, [])

  const isAllSelected = posts.length > 0 && selectedIds.length === posts.length

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )
  }

  const toggleSelectAll = () => {
    setSelectedIds((prev) => (isAllSelected ? [] : posts.map((p) => p.id)))
  }

  const bulkTrash = async () => {
    if (selectedIds.length === 0) return
    if (!confirm(`Move ${selectedIds.length} selected post(s) to trash?`)) return
    try {
      const response = await fetch(`/api/admin/posts`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: selectedIds })
      })
      if (response.ok) {
        setSelectedIds([])
        fetchPosts(currentPage)
      } else {
        const err = await response.json().catch(() => ({} as any))
        alert(err?.error || 'Failed to move to trash')
      }
    } catch (error) {
      console.error('Error bulk trash posts:', error)
      alert('Failed to move to trash')
    }
  }

  const bulkRestore = async () => {
    if (selectedIds.length === 0) return
    try {
      const response = await fetch(`/api/admin/posts`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: selectedIds })
      })
      if (response.ok) {
        setSelectedIds([])
        fetchPosts(currentPage)
      } else {
        const err = await response.json().catch(() => ({} as any))
        alert(err?.error || 'Failed to restore posts')
      }
    } catch (error) {
      console.error('Error restoring posts:', error)
      alert('Failed to restore posts')
    }
  }

  const bulkForceDelete = async () => {
    if (selectedIds.length === 0) return
    if (!confirm(`Permanently delete ${selectedIds.length} selected post(s)? This cannot be undone.`)) return
    try {
      const response = await fetch(`/api/admin/posts?force=1`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: selectedIds })
      })
      if (response.ok) {
        setSelectedIds([])
        fetchPosts(currentPage)
      } else {
        const err = await response.json().catch(() => ({} as any))
        alert(err?.error || 'Failed to permanently delete posts')
      }
    } catch (error) {
      console.error('Error permanently deleting posts:', error)
      alert('Failed to permanently delete posts')
    }
  }

  const handleTrash = async (id: string) => {
    if (!confirm('Move this post to trash?')) return

    try {
      const response = await fetch(`/api/admin/posts/${id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        fetchPosts(currentPage)
      } else {
        alert('Failed to move to trash')
      }
    } catch (error) {
      console.error('Error trashing post:', error)
      alert('Failed to move to trash')
    }
  }

  const handleRestore = async (id: string) => {
    try {
      const response = await fetch(`/api/admin/posts/${id}`, { method: 'PATCH' })
      if (response.ok) fetchPosts(currentPage)
      else alert('Failed to restore post')
    } catch (e) {
      console.error(e)
      alert('Failed to restore post')
    }
  }

  const handleForceDelete = async (id: string) => {
    if (!confirm('Permanently delete this post? This cannot be undone.')) return
    try {
      const response = await fetch(`/api/admin/posts/${id}?force=1`, { method: 'DELETE' })
      if (response.ok) fetchPosts(currentPage)
      else alert('Failed to permanently delete post')
    } catch (e) {
      console.error(e)
      alert('Failed to permanently delete post')
    }
  }

  const filteredPosts = useMemo(() => {
    let list = posts
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter((p) => p.title.toLowerCase().includes(q) || p.slug.toLowerCase().includes(q))
    }
    if (categoryId) {
      const selected = categories.find((c) => c.id === categoryId)
      const selectedName = selected?.name
      if (selectedName) {
        list = list.filter((p) => p.categories?.some((c) => c.category?.name === selectedName))
      }
    }
    return list
  }, [posts, search, categoryId, categories])

  if (loading) {
    return <div className="text-center">Loading posts...</div>
  }

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-center mb-8">
        <h1 className="text-3xl font-bold" style={{ color: 'var(--admin-text)' }}>Posts</h1>
        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-2 mr-4">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search posts..."
              className="input w-56"
            />
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="input w-44"
            >
              <option value="">All categories</option>
              {categories.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2 mr-4">
            <button
              onClick={() => { setShowTrash(false); setSelectedIds([]); setLoading(true); fetchPosts(1, false) }}
              className={`btn ${!showTrash ? 'btn-secondary' : 'btn-ghost'}`}
            >
              All
            </button>
            <button
              onClick={() => { setShowTrash(true); setSelectedIds([]); setLoading(true); fetchPosts(1, true) }}
              className={`btn ${showTrash ? 'btn-secondary' : 'btn-ghost'}`}
            >
              Trash
            </button>
          </div>
          <div className="sm:hidden flex items-center gap-2 mr-4 w-full">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search posts..."
              className="input flex-1"
            />
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="input"
            >
              <option value="">All</option>
              {categories.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2 px-3 py-2 rounded-md" style={{ border: '1px solid var(--admin-border)', background: 'var(--admin-surface)' }}>
            <input
              id="select-all"
              type="checkbox"
              checked={isAllSelected}
              onChange={toggleSelectAll}
              className="h-4 w-4"
            />
            <label htmlFor="select-all" className="text-sm" style={{ color: 'var(--admin-text-muted)' }}>Select all</label>
          </div>
          {!showTrash ? (
            <button
              onClick={bulkTrash}
              disabled={selectedIds.length === 0}
              className={`btn ${selectedIds.length === 0 ? 'btn-ghost cursor-not-allowed opacity-60' : 'btn-warning'}`}
            >
              Move to Trash
            </button>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={bulkRestore}
                disabled={selectedIds.length === 0}
                className={`btn ${selectedIds.length === 0 ? 'btn-ghost cursor-not-allowed opacity-60' : 'btn-success'}`}
              >
                Restore
              </button>
              <button
                onClick={bulkForceDelete}
                disabled={selectedIds.length === 0}
                className={`btn ${selectedIds.length === 0 ? 'btn-ghost cursor-not-allowed opacity-60' : 'btn-danger'}`}
              >
                Delete Permanently
              </button>
            </div>
          )}
          <Link
            href="/admin/posts/new"
            className="btn btn-secondary inline-flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add New Post
          </Link>
        </div>
      </div>

      {posts.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-lg" style={{ color: 'var(--admin-text-muted)' }}>No posts found</p>
          <Link
            href="/admin/posts/new"
            className="mt-4 inline-flex items-center gap-2 btn btn-secondary"
          >
            <Plus className="w-4 h-4" />
            Create your first post
          </Link>
        </div>
      ) : (
        <>
          <div className="card p-0 overflow-hidden">
            <ul className="divide-y" style={{ borderColor: 'var(--admin-border)' }}>
              {filteredPosts.map((post) => (
                <li key={post.id}>
                  <div className="px-4 py-4 sm:px-6">
                    <div className="flex items-start sm:items-center justify-between gap-3">
                      <div className="flex items-start sm:items-center gap-3 flex-1">
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(post.id)}
                          onChange={() => toggleSelect(post.id)}
                          className="mt-1 h-4 w-4"
                        />
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <p className="text-lg font-medium truncate" style={{ color: 'var(--admin-secondary)' }}>
                              <Link href={`/admin/posts/${post.id}`}>
                                {post.title}
                              </Link>
                            </p>
                            <div className="ml-2 flex-shrink-0 flex">
                              {post.published && (
                                <span className="badge badge-success">Published</span>
                              )}
                              {post.featured && (
                                <span className="ml-2 badge badge-warning">Featured</span>
                              )}
                            </div>
                          </div>
                          <div className="mt-2 sm:flex sm:justify-between">
                            <div className="sm:flex">
                              <p className="flex items-center text-sm" style={{ color: 'var(--admin-text-muted)' }}>
                                By {post.author.name || post.author.email}
                              </p>
                              {post.categories.length > 0 && (
                                <p className="mt-2 flex items-center text-sm sm:mt-0 sm:ml-6" style={{ color: 'var(--admin-text-muted)' }}>
                                  Categories: {post.categories.map(c => c.category.name).join(', ')}
                                </p>
                              )}
                            </div>
                            <div className="mt-2 flex items-center text-sm sm:mt-0" style={{ color: 'var(--admin-text-muted)' }}>
                              <p>Created {formatDate(post.createdAt)}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="ml-4 flex-shrink-0 flex space-x-2">
                        {!showTrash ? (
                          <>
                            <Link
                              href={`/admin/posts/${post.id}`}
                              className="text-sm font-medium inline-flex items-center gap-1"
                              style={{ color: 'var(--admin-secondary)' }}
                            >
                              <EditIcon className="w-4 h-4" />
                              Edit
                            </Link>
                            <Link
                              href={`/${post.slug}`}
                              target="_blank"
                              className="text-sm font-medium inline-flex items-center gap-1"
                              style={{ color: 'var(--admin-success)' }}
                            >
                              <Eye className="w-4 h-4" />
                              View
                            </Link>
                            <button
                              onClick={() => handleTrash(post.id)}
                              className="text-sm font-medium inline-flex items-center gap-1"
                              style={{ color: 'var(--admin-warning)' }}
                            >
                              <Trash2 className="w-4 h-4" />
                              Trash
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => handleRestore(post.id)}
                              className="text-sm font-medium inline-flex items-center gap-1"
                              style={{ color: 'var(--admin-success)' }}
                            >
                              <RotateCcw className="w-4 h-4" />
                              Restore
                            </button>
                            <button
                              onClick={() => handleForceDelete(post.id)}
                              className="text-sm font-medium inline-flex items-center gap-1"
                              style={{ color: 'var(--admin-danger)' }}
                            >
                              <XCircle className="w-4 h-4" />
                              Delete Permanently
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {totalPages > 1 && (
            <div className="mt-6 flex justify-center">
              <nav className="flex space-x-2">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => fetchPosts(page)}
                    className={`btn ${currentPage === page ? 'btn-secondary' : 'btn-ghost'}`}
                  >
                    {page}
                  </button>
                ))}
              </nav>
            </div>
          )}
        </>
      )}
    </div>
  )
}
