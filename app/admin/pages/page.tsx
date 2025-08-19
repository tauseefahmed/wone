"use client"

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { formatDate } from '@/lib/utils'
import { Edit as EditIcon, Eye, Trash2, RotateCcw, XCircle, Plus } from 'lucide-react'

interface PageItem {
  id: string
  title: string
  slug: string
  published: boolean
  createdAt: string
  author: { name: string | null; email: string }
}

export default function PagesPage() {
  const [pages, setPages] = useState<PageItem[]>([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [showTrash, setShowTrash] = useState(false)
  const [search, setSearch] = useState('')

  const fetchPages = async (page: number = 1, trash: boolean = showTrash) => {
    try {
      const res = await fetch(`/api/admin/pages?page=${page}&limit=10&trash=${trash ? '1' : '0'}`)
      if (res.ok) {
        const data = await res.json()
        setPages(data.pages)
        setTotalPages(data.pagination.pages)
        setCurrentPage(page)
      }
    } catch (e) {
      console.error('Failed to fetch pages:', e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPages()
  }, [])

  const isAllSelected = pages.length > 0 && selectedIds.length === pages.length

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  }

  const toggleSelectAll = () => {
    setSelectedIds(isAllSelected ? [] : pages.map((p) => p.id))
  }

  const bulkTrash = async () => {
    if (selectedIds.length === 0) return
    if (!confirm(`Move ${selectedIds.length} selected page(s) to trash?`)) return
    try {
      const resp = await fetch('/api/admin/pages', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: selectedIds })
      })
      if (resp.ok) {
        setSelectedIds([])
        fetchPages(currentPage)
      } else {
        const err = await resp.json().catch(() => ({} as any))
        alert(err?.error || 'Failed to move to trash')
      }
    } catch (e) {
      console.error('Error bulk trash pages:', e)
      alert('Failed to move to trash')
    }
  }

  const bulkRestore = async () => {
    if (selectedIds.length === 0) return
    try {
      const resp = await fetch(`/api/admin/pages`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: selectedIds })
      })
      if (resp.ok) { setSelectedIds([]); fetchPages(currentPage) }
      else { const err = await resp.json().catch(() => ({} as any)); alert(err?.error || 'Failed to restore pages') }
    } catch (e) {
      console.error('Error restoring pages:', e)
      alert('Failed to restore pages')
    }
  }

  const bulkForceDelete = async () => {
    if (selectedIds.length === 0) return
    if (!confirm(`Permanently delete ${selectedIds.length} selected page(s)? This cannot be undone.`)) return
    try {
      const resp = await fetch(`/api/admin/pages?force=1`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: selectedIds })
      })
      if (resp.ok) { setSelectedIds([]); fetchPages(currentPage) }
      else { const err = await resp.json().catch(() => ({} as any)); alert(err?.error || 'Failed to permanently delete pages') }
    } catch (e) {
      console.error('Error permanently deleting pages:', e)
      alert('Failed to permanently delete pages')
    }
  }

  const handleTrash = async (id: string) => {
    if (!confirm('Move this page to trash?')) return
    try {
      const resp = await fetch(`/api/admin/pages/${id}`, { method: 'DELETE' })
      if (resp.ok) { fetchPages(currentPage) } else { alert('Failed to move to trash') }
    } catch (e) {
      console.error('Error trashing page:', e)
      alert('Failed to move to trash')
    }
  }

  const handleRestore = async (id: string) => {
    try {
      const resp = await fetch(`/api/admin/pages/${id}`, { method: 'PATCH' })
      if (resp.ok) { fetchPages(currentPage) } else { alert('Failed to restore page') }
    } catch (e) {
      console.error('Error restoring page:', e)
      alert('Failed to restore page')
    }
  }

  const handleForceDelete = async (id: string) => {
    if (!confirm('Permanently delete this page? This cannot be undone.')) return
    try {
      const resp = await fetch(`/api/admin/pages/${id}?force=1`, { method: 'DELETE' })
      if (resp.ok) { fetchPages(currentPage) } else { alert('Failed to permanently delete page') }
    } catch (e) {
      console.error('Error permanently deleting page:', e)
      alert('Failed to permanently delete page')
    }
  }

  const filteredPages = useMemo(() => {
    if (!search.trim()) return pages
    const q = search.toLowerCase()
    return pages.filter(p => p.title.toLowerCase().includes(q) || p.slug.toLowerCase().includes(q))
  }, [pages, search])

  if (loading) return <div className="text-center">Loading pages...</div>

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-center mb-8">
        <h1 className="text-3xl font-bold" style={{ color: 'var(--admin-text)' }}>Pages</h1>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 mr-4 w-full sm:w-auto">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search pages..."
              className="input w-full sm:w-64"
            />
          </div>
          <div className="flex items-center gap-2 mr-4">
            <button
              onClick={() => { setShowTrash(false); setSelectedIds([]); setLoading(true); fetchPages(1, false) }}
              className={`btn ${!showTrash ? 'btn-secondary' : 'btn-ghost'}`}
            >
              All
            </button>
            <button
              onClick={() => { setShowTrash(true); setSelectedIds([]); setLoading(true); fetchPages(1, true) }}
              className={`btn ${showTrash ? 'btn-secondary' : 'btn-ghost'}`}
            >
              Trash
            </button>
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
            href="/admin/pages/new"
            className="btn btn-secondary inline-flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add New Page
          </Link>
        </div>
      </div>

      {pages.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-lg" style={{ color: 'var(--admin-text-muted)' }}>No pages found</p>
          <Link
            href="/admin/pages/new"
            className="mt-4 inline-flex items-center gap-2 btn btn-secondary"
          >
            <Plus className="w-4 h-4" />
            Create your first page
          </Link>
        </div>
      ) : (
        <>
          <div className="card p-0 overflow-hidden">
            <ul className="divide-y" style={{ borderColor: 'var(--admin-border)' }}>
              {filteredPages.map((page) => (
                <li key={page.id}>
                  <div className="px-4 py-4 sm:px-6">
                    <div className="flex items-start sm:items-center justify-between gap-3">
                      <div className="flex items-start sm:items-center gap-3 flex-1">
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(page.id)}
                          onChange={() => toggleSelect(page.id)}
                          className="mt-1 h-4 w-4"
                        />
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <p className="text-lg font-medium truncate" style={{ color: 'var(--admin-secondary)' }}>
                              <Link href={`/admin/pages/${page.id}`}>{page.title}</Link>
                            </p>
                            <div className="ml-2 flex-shrink-0 flex">
                              {page.published && (
                                <span className="badge badge-success">Published</span>
                              )}
                            </div>
                          </div>
                          <div className="mt-2 sm:flex sm:justify-between">
                            <div className="sm:flex">
                              <p className="flex items-center text-sm" style={{ color: 'var(--admin-text-muted)' }}>/{page.slug}</p>
                              <p className="mt-2 flex items-center text-sm sm:mt-0 sm:ml-6" style={{ color: 'var(--admin-text-muted)' }}>
                                By {page.author?.name || page.author?.email}
                              </p>
                            </div>
                            <div className="mt-2 flex items-center text-sm sm:mt-0" style={{ color: 'var(--admin-text-muted)' }}>
                              <p>Created {formatDate(page.createdAt)}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="ml-4 flex-shrink-0 flex space-x-2">
                        {!showTrash ? (
                          <>
                            <Link href={`/admin/pages/${page.id}`} className="text-sm font-medium inline-flex items-center gap-1" style={{ color: 'var(--admin-secondary)' }}>
                              <EditIcon className="w-4 h-4" />
                              Edit
                            </Link>
                            <Link href={`/pages/${page.slug}`} target="_blank" className="text-sm font-medium inline-flex items-center gap-1" style={{ color: 'var(--admin-success)' }}>
                              <Eye className="w-4 h-4" />
                              View
                            </Link>
                            <button onClick={() => handleTrash(page.id)} className="text-sm font-medium inline-flex items-center gap-1" style={{ color: 'var(--admin-warning)' }}>
                              <Trash2 className="w-4 h-4" />
                              Trash
                            </button>
                          </>
                        ) : (
                          <>
                            <button onClick={() => handleRestore(page.id)} className="text-sm font-medium inline-flex items-center gap-1" style={{ color: 'var(--admin-success)' }}>
                              <RotateCcw className="w-4 h-4" />
                              Restore
                            </button>
                            <button onClick={() => handleForceDelete(page.id)} className="text-sm font-medium inline-flex items-center gap-1" style={{ color: 'var(--admin-danger)' }}>
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
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    onClick={() => fetchPages(p)}
                    className={`btn ${currentPage === p ? 'btn-secondary' : 'btn-ghost'}`}
                  >
                    {p}
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
