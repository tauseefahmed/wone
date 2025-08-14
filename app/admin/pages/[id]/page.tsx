'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Trash2, X, Save } from 'lucide-react'
import { useParams, useRouter } from 'next/navigation'
import Editor from '@/components/editor'
import { createSlug } from '@/lib/utils'

interface PageData {
  id: string
  title: string
  slug: string
  content: string
  featuredImage: string | null
  metaTitle: string | null
  metaDescription: string | null
  published: boolean
}

export default function EditPage() {
  const params = useParams() as { id: string }
  const router = useRouter()
  const [data, setData] = useState<PageData | null>(null)
  const [title, setTitle] = useState('')
  const [slug, setSlug] = useState('')
  const [slugDirty, setSlugDirty] = useState(false)
  const [content, setContent] = useState('')
  const [featuredImage, setFeaturedImage] = useState('')
  const [metaTitle, setMetaTitle] = useState('')
  const [metaDescription, setMetaDescription] = useState('')
  const [published, setPublished] = useState(false)
  const [saving, setSaving] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  const MAX_UPLOAD_MB = Number(process.env.NEXT_PUBLIC_MAX_UPLOAD_MB ?? '5')

  useEffect(() => {
    const load = async () => {
      const res = await fetch(`/api/admin/pages/${params.id}`)
      if (res.ok) {
        const json = await res.json()
        setData(json)
        setTitle(json.title)
        setSlug(json.slug)
        setSlugDirty(json.slug !== createSlug(json.title))
        setContent(json.content)
        setFeaturedImage(json.featuredImage || '')
        setMetaTitle(json.metaTitle || '')
        setMetaDescription(json.metaDescription || '')
        setPublished(!!json.published)
      }
    }
    load()
  }, [params.id])

  useEffect(() => {
    if (!slugDirty) {
      if (title) setSlug(createSlug(title))
      else setSlug('')
    }
  }, [title, slugDirty])

  const handleImageUpload = async (file: File | null) => {
    if (!file) return
    const MAX_BYTES = MAX_UPLOAD_MB * 1024 * 1024
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    if (!allowed.includes(file.type)) {
      alert('Unsupported file type. Please upload JPG, PNG, WEBP, or GIF.')
      return
    }
    if (file.size > MAX_BYTES) {
      alert(`File too large. Max size is ${MAX_UPLOAD_MB} MB.`)
      return
    }
    setUploadingImage(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch('/api/admin/upload', { method: 'POST', body: fd })
      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        throw new Error(j.error || 'Upload failed')
      }
      const { url } = await res.json()
      setFeaturedImage(url)
    } catch (e: any) {
      alert(e.message || 'Failed to upload image')
    } finally {
      setUploadingImage(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/pages/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          slug,
          content,
          featuredImage: featuredImage || null,
          metaTitle,
          metaDescription,
          published,
        }),
      })
      if (res.ok) {
        router.push('/admin/pages')
      } else {
        const j = await res.json()
        alert(j.error || 'Failed to update page')
      }
    } catch (e) {
      console.error('Error updating page:', e)
      alert('Failed to update page')
    } finally {
      setSaving(false)
    }
  }

  const handleTrash = async () => {
    if (!confirm('Move this page to trash?')) return
    const res = await fetch(`/api/admin/pages/${params.id}`, { method: 'DELETE' })
    if (res.ok) {
      router.push('/admin/pages')
    } else {
      alert('Failed to move page to trash')
    }
  }

  if (!data) return <div className="text-center">Loading...</div>

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Edit Page</h1>
        <div className="space-x-4">
          <Link href="/admin/pages" className="text-blue-600 inline-flex items-center gap-2"><ArrowLeft className="w-4 h-4" />Back</Link>
          <button onClick={handleTrash} className="text-red-600 inline-flex items-center gap-2"><Trash2 className="w-4 h-4" />Trash</button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white shadow px-4 py-5 sm:rounded-lg sm:p-6">
          <div>
            <div className="mb-4">
              <h3 className="text-lg font-medium leading-6 text-gray-900">Page Details</h3>
              <p className="mt-1 text-sm text-gray-500">Basic information about your page.</p>
            </div>
            <div>
              <div className="grid grid-cols-6 gap-6">
                <div className="col-span-6">
                  <label htmlFor="title" className="block text-sm font-medium text-gray-700">Title</label>
                  <input id="title" type="text" value={title} onChange={(e) => setTitle(e.target.value)} required className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm text-base text-gray-900 border-gray-300 rounded-md px-4 py-2.5" />
                </div>
                <div className="col-span-6">
                  <label htmlFor="slug" className="block text-sm font-medium text-gray-700">Slug</label>
                  <input id="slug" type="text" value={slug} onChange={(e) => { setSlug(createSlug(e.target.value)); setSlugDirty(true) }} className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm text-base text-gray-900 border-gray-300 rounded-md px-4 py-2.5" />
                </div>
                <div className="col-span-6">
                  <label htmlFor="featuredImage" className="block text-sm font-medium text-gray-700">Featured Image</label>
                  <div className="mt-1 flex items-center gap-4">
                    <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e.target.files?.[0] || null)} className="block w-full text-sm text-gray-700 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100" />
                  </div>
                  {uploadingImage && <p className="mt-2 text-xs text-gray-500">Uploading...</p>}
                  {featuredImage && (
                    <div className="mt-2">
                      <img src={featuredImage} alt="Featured preview" className="h-24 w-24 object-cover rounded" />
                      <p className="mt-1 text-xs text-gray-500">Uploaded</p>
                    </div>
                  )}
                  <p className="mt-1 text-xs text-gray-500">Upload an image to use on cards and Open Graph. Max {MAX_UPLOAD_MB} MB.</p>
                </div>
                <div className="col-span-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Content</label>
                  <Editor content={content} onChange={setContent} placeholder="Write your page content here..." />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white shadow px-4 py-5 sm:rounded-lg sm:p-6">
          <div className="md:grid md:grid-cols-3 md:gap-6">
            <div className="md:col-span-1">
              <h3 className="text-lg font-medium leading-6 text-gray-900">SEO Settings</h3>
              <p className="mt-1 text-sm text-gray-500">Optimize your page for search engines.</p>
            </div>
            <div className="mt-5 md:mt-0 md:col-span-2">
              <div className="grid grid-cols-6 gap-6">
                <div className="col-span-6">
                  <label htmlFor="metaTitle" className="block text-sm font-medium text-gray-700">Meta Title</label>
                  <input id="metaTitle" type="text" value={metaTitle} onChange={(e) => setMetaTitle(e.target.value)} className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm text-base text-gray-900 border-gray-300 rounded-md px-4 py-2.5" />
                </div>
                <div className="col-span-6">
                  <label htmlFor="metaDescription" className="block text-sm font-medium text-gray-700">Meta Description</label>
                  <textarea id="metaDescription" rows={3} value={metaDescription} onChange={(e) => setMetaDescription(e.target.value)} className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm text-base text-gray-900 border-gray-300 rounded-md px-4 py-2.5" placeholder="Description for search engines..." />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white shadow px-4 py-5 sm:rounded-lg sm:p-6">
          <div className="md:grid md:grid-cols-3 md:gap-6">
            <div className="md:col-span-1">
              <h3 className="text-lg font-medium leading-6 text-gray-900">Publishing Options</h3>
              <p className="mt-1 text-sm text-gray-500">Control how your page is displayed.</p>
            </div>
            <div className="mt-5 md:mt-0 md:col-span-2">
              <div className="space-y-4">
                <div className="flex items-center">
                  <input id="published" type="checkbox" checked={published} onChange={(e) => setPublished(e.target.checked)} className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded" />
                  <label htmlFor="published" className="ml-2 text-sm text-gray-700">Published</label>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-3">
          <button type="button" onClick={() => router.push('/admin/pages')} className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 inline-flex items-center gap-2"><X className="w-4 h-4" />Cancel</button>
          <button type="submit" disabled={saving} className="inline-flex justify-center items-center gap-2 py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"><Save className="w-4 h-4" />{saving ? 'Saving...' : 'Save Changes'}</button>
        </div>
      </form>
    </div>
  )
}
