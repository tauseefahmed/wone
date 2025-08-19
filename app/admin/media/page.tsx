'use client'

import { useEffect, useMemo, useState } from 'react'
import { Upload as UploadIcon, Copy as CopyIcon, Trash2, Plus, Check, ImagePlus } from 'lucide-react'

type MediaItem = {
  name: string
  url: string
  size: number
  modifiedAt: number
}

export default function MediaLibraryPage() {
  const [media, setMedia] = useState<MediaItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [filter, setFilter] = useState('')
  const [dragOver, setDragOver] = useState(false)
  const isPicker = useMemo(() => typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('picker') === '1', [])
  const multi = useMemo(() => typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('multi') === '1', [])
  const [selected, setSelected] = useState<Record<string, boolean>>({})

  const load = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/media', { cache: 'no-store' })
      if (!res.ok) throw new Error('Failed to load media')
      const data = await res.json()
      setMedia(Array.isArray(data.media) ? data.media : [])
    } catch (e: any) {
      setError(e?.message || 'Failed to load media')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const uploadFiles = async (files: FileList | File[]) => {
    const list = Array.from(files)
    if (list.length === 0) return
    setUploading(true)
    try {
      for (const file of list) {
        const fd = new FormData()
        fd.append('file', file)
        const res = await fetch('/api/admin/upload', { method: 'POST', body: fd })
        if (!res.ok) throw new Error('Upload failed')
      }
      await load()
    } catch (err: any) {
      alert(err?.message || 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  const onUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      await uploadFiles(e.target.files)
      ;(e.target as any).value = ''
    }
  }

  const onDelete = async (name: string) => {
    if (!confirm('Delete this file?')) return
    try {
      const res = await fetch('/api/admin/media', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name }) })
      if (!res.ok) throw new Error('Delete failed')
      await load()
    } catch (e: any) {
      alert(e?.message || 'Delete failed')
    }
  }

  const onCopy = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url)
    } catch {}
  }

  const postSelect = (payload: any) => {
    try {
      if (window.opener) {
        window.opener.postMessage(payload, '*')
      }
    } catch {}
    try {
      localStorage.setItem('media-select', JSON.stringify({ ...payload, t: Date.now() }))
    } catch {}
    try { window.close() } catch {}
  }

  const onInsert = (url: string) => {
    if (isPicker) {
      postSelect({ type: 'media-select', url })
    }
  }

  const onInsertSelected = () => {
    if (!isPicker) return
    const urls = Object.keys(selected).filter((k) => selected[k]).map((name) => {
      const item = media.find(m => m.name === name)
      return item?.url
    }).filter(Boolean) as string[]
    if (!urls.length) return
    postSelect({ type: 'media-select', urls })
  }

  const filtered = useMemo(() => media.filter(m => m.name.toLowerCase().includes(filter.toLowerCase())), [media, filter])

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold" style={{ color: 'var(--admin-text)' }}>{isPicker ? 'Select Media' : 'Media Library'}</h1>
        {!isPicker && (
          <label className="inline-flex items-center gap-3 cursor-pointer">
            <input multiple type="file" accept="image/*,audio/*,video/*,application/pdf" onChange={onUpload} disabled={uploading} className="hidden" />
            <span className={`btn btn-secondary inline-flex items-center gap-2 ${uploading ? 'opacity-60 cursor-not-allowed' : ''}`}>
              <UploadIcon className="w-4 h-4" />
              {uploading ? 'Uploading...' : 'Upload'}
            </span>
          </label>
        )}
      </div>

      <div className="flex items-center gap-3 mb-4">
        <input value={filter} onChange={e => setFilter(e.target.value)} placeholder="Filter by name..." className="input w-full max-w-sm" />
        <button onClick={load} className="btn btn-ghost inline-flex items-center gap-2"><ImagePlus className="w-4 h-4" />Refresh</button>
      </div>

      {loading && <div className="card">Loading...</div>}
      {error && <div className="card" style={{ color: 'var(--admin-danger)' }}>{error}</div>}

      <div
        className={`grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 p-2 rounded`}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={async (e) => { e.preventDefault(); setDragOver(false); if (e.dataTransfer?.files?.length) await uploadFiles(e.dataTransfer.files) }}
      >
        {filtered.map(item => (
          <div key={item.name} className="card p-0 overflow-hidden">
            {isPicker && multi && (
              <label className="absolute m-2 p-1 rounded shadow text-xs inline-flex items-center gap-1" style={{ background: 'color-mix(in srgb, var(--admin-surface), #fff 20%)' }}>
                <input type="checkbox" checked={!!selected[item.name]} onChange={(e) => setSelected(s => ({ ...s, [item.name]: e.target.checked }))} />
                Select
              </label>
            )}
            <div className="aspect-square flex items-center justify-center overflow-hidden" style={{ background: 'var(--admin-surface)' }}>
              {item.url.match(/\.(png|jpe?g|gif|webp|svg|ico)$/i) ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={item.url} alt={item.name} className="object-contain w-full h-full" />
              ) : (
                <div className="text-xs p-2 break-all" style={{ color: 'var(--admin-text-muted)' }}>{item.name}</div>
              )}
            </div>
            <div className="p-2 flex items-center justify-between gap-2 text-sm">
              <div className="truncate" title={item.name} style={{ color: 'var(--admin-text)' }}>{item.name}</div>
            </div>
            <div className="p-2 flex items-center gap-2 text-sm" style={{ borderTop: '1px solid var(--admin-border)' }}>
              <button onClick={() => onCopy(item.url)} className="btn btn-ghost inline-flex items-center gap-1">
                <CopyIcon className="w-4 h-4" />
                Copy URL
              </button>
              {isPicker ? (
                multi ? (
                  <button onClick={() => setSelected(s => ({ ...s, [item.name]: !s[item.name] }))} className={`btn inline-flex items-center gap-1 ${selected[item.name] ? 'btn-secondary' : 'btn-ghost'}`}>
                    {selected[item.name] ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                    {selected[item.name] ? 'Selected' : 'Select'}
                  </button>
                ) : (
                  <button onClick={() => onInsert(item.url)} className="btn btn-secondary inline-flex items-center gap-1">
                    <Plus className="w-4 h-4" />
                    Insert
                  </button>
                )
              ) : (
                <button onClick={() => onDelete(item.name)} className="btn btn-danger inline-flex items-center gap-1">
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {!loading && filtered.length === 0 && (
        <div className="card" style={{ color: 'var(--admin-text-muted)' }}>No media found.</div>
      )}

      {isPicker && multi && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 shadow-lg rounded-full px-4 py-2 flex items-center gap-3" style={{ background: 'var(--admin-surface)', border: '1px solid var(--admin-border)' }}>
          <div className="text-sm" style={{ color: 'var(--admin-text-muted)' }}>{Object.values(selected).filter(Boolean).length} selected</div>
          <button onClick={onInsertSelected} className="btn btn-secondary rounded-full inline-flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Insert Selected
          </button>
        </div>
      )}
    </div>
  )
}
