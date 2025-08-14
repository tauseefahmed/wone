"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"

interface Setting {
  key: string
  value: string | null
}

export default function SettingsPage() {
  const [items, setItems] = useState<Setting[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [formKey, setFormKey] = useState("")
  const [formValue, setFormValue] = useState("")
  const [filter, setFilter] = useState("")
  const [editingKey, setEditingKey] = useState<string | null>(null)
  const [editValue, setEditValue] = useState("")
  // Favicon management state
  const [faviconUrl, setFaviconUrl] = useState<string | null>(null)
  const [faviconPreview, setFaviconPreview] = useState<string | null>(null)
  const [uploadingFavicon, setUploadingFavicon] = useState(false)
  const [faviconError, setFaviconError] = useState<string | null>(null)
  // Footer text state
  const [footerText, setFooterText] = useState<string>("")
  const [footerSaving, setFooterSaving] = useState(false)
  // Change Password state
  const [cpCurrent, setCpCurrent] = useState("")
  const [cpNew, setCpNew] = useState("")
  const [cpConfirm, setCpConfirm] = useState("")
  const [cpLoading, setCpLoading] = useState(false)
  const [cpError, setCpError] = useState<string | null>(null)
  const [cpSuccess, setCpSuccess] = useState<string | null>(null)
  // About Author state
  const [authorName, setAuthorName] = useState("")
  const [authorBio, setAuthorBio] = useState("")
  const [authorAvatar, setAuthorAvatar] = useState<string | null>(null)
  const [authorWebsite, setAuthorWebsite] = useState("")
  const [authorTwitter, setAuthorTwitter] = useState("")
  const [authorGithub, setAuthorGithub] = useState("")
  const [authorLinkedin, setAuthorLinkedin] = useState("")
  const [authorSaving, setAuthorSaving] = useState(false)
  const [authorUploading, setAuthorUploading] = useState(false)

  const filtered = useMemo(() => {
    const q = filter.trim().toLowerCase()
    if (!q) return items
    return items.filter((it) => it.key.toLowerCase().includes(q))
  }, [items, filter])

  const load = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/admin/settings", { cache: "no-store" })
      if (!res.ok) throw new Error("Failed to load settings")
      const data = await res.json()
      setItems(data.settings || [])
      const fav = (data.settings || []).find((it: Setting) => it.key === 'site_favicon')?.value || null
      setFaviconUrl(fav)
      setFaviconPreview(null)
      const ft = (data.settings || []).find((it: Setting) => it.key === 'footer_text')?.value || ''
      setFooterText(ft || '')
      // About Author prefill
      const aboutRaw = (data.settings || []).find((it: Setting) => it.key === 'about_author')?.value || null
      if (aboutRaw) {
        try {
          const parsed = JSON.parse(aboutRaw)
          setAuthorName(parsed.name || '')
          setAuthorBio(parsed.bio || '')
          setAuthorAvatar(parsed.avatarUrl || null)
          setAuthorWebsite(parsed.website || '')
          setAuthorTwitter(parsed.twitter || '')
          setAuthorGithub(parsed.github || '')
          setAuthorLinkedin(parsed.linkedin || '')
        } catch {}
      } else {
        setAuthorName('')
        setAuthorBio('')
        setAuthorAvatar(null)
        setAuthorWebsite('')
        setAuthorTwitter('')
        setAuthorGithub('')
        setAuthorLinkedin('')
      }
    } catch (e: any) {
      alert(e.message || "Failed to load settings")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  // Dynamically update <link rel="icon"> when faviconUrl changes
  useEffect(() => {
    if (!faviconUrl) return
    try {
      const ensureLink = (rel: string) => {
        let link = document.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`)
        if (!link) {
          link = document.createElement('link')
          link.rel = rel
          document.head.appendChild(link)
        }
        link.href = faviconUrl!
      }
      ensureLink('icon')
      ensureLink('shortcut icon')
    } catch {}
  }, [faviconUrl])

  const saveFooter = async () => {
    setFooterSaving(true)
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: 'footer_text', value: footerText })
      })
      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        throw new Error(j.error || 'Failed to save footer text')
      }
      await load()
      window.dispatchEvent(new Event('settings-updated'))
    } catch (e: any) {
      alert(e.message || 'Failed to save footer text')
    } finally {
      setFooterSaving(false)
    }
  }

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    const key = formKey.trim()
    if (!key) {
      alert("Key is required")
      return
    }
    setSaving(true)
    try {
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key, value: formValue })
      })
      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        throw new Error(j.error || "Failed to save setting")
      }
      setFormKey("")
      setFormValue("")
      await load()
      window.dispatchEvent(new Event('settings-updated'))
    } catch (e: any) {
      alert(e.message || "Failed to save setting")
    } finally {
      setSaving(false)
    }
  }

  const startEdit = (it: Setting) => {
    setEditingKey(it.key)
    setEditValue(it.value ?? "")
  }

  const cancelEdit = () => {
    setEditingKey(null)
    setEditValue("")
  }

  const saveEdit = async () => {
    if (!editingKey) return
    setSaving(true)
    try {
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: editingKey, value: editValue })
      })
      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        throw new Error(j.error || "Failed to update setting")
      }
      setEditingKey(null)
      setEditValue("")
      await load()
      window.dispatchEvent(new Event('settings-updated'))
    } catch (e: any) {
      alert(e.message || "Failed to update setting")
    } finally {
      setSaving(false)
    }
  }

  const remove = async (key: string) => {
    if (!confirm(`Delete setting "${key}"?`)) return
    try {
      const res = await fetch("/api/admin/settings", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key })
      })
      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        throw new Error(j.error || "Failed to delete setting")
      }
      await load()
    } catch (e: any) {
      alert(e.message || "Failed to delete setting")
    }
  }

  // Favicon handlers
  const validateFaviconFile = (file: File) => {
    const allowed = [
      'image/png',
      'image/svg+xml',
      'image/x-icon',
      'image/vnd.microsoft.icon',
      'image/jpeg', // allow too, will work but not ideal
    ]
    if (!allowed.includes(file.type)) {
      return 'Unsupported file type. Use .ico, .png, or .svg'
    }
    const MAX_MB = 5
    const size = (file as any).size || 0
    if (size > MAX_MB * 1024 * 1024) {
      return `File too large. Max ${MAX_MB} MB`
    }
    return null
  }

  const onPickFavicon = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (!f) return
    const err = validateFaviconFile(f)
    if (err) {
      setFaviconError(err)
      setFaviconPreview(null)
      return
    }
    setFaviconError(null)
    // Local preview
    const url = URL.createObjectURL(f)
    setFaviconPreview(url)
  }

  const uploadAndSaveFavicon = async (fileInput: HTMLInputElement | null) => {
    if (!fileInput || !fileInput.files || fileInput.files.length === 0) {
      setFaviconError('Please choose a file first')
      return
    }
    const f = fileInput.files[0]
    const err = validateFaviconFile(f)
    if (err) { setFaviconError(err); return }
    setUploadingFavicon(true)
    try {
      const fd = new FormData()
      fd.append('file', f)
      const up = await fetch('/api/admin/upload', { method: 'POST', body: fd })
      if (!up.ok) {
        const j = await up.json().catch(() => ({} as any))
        throw new Error(j.error || 'Upload failed')
      }
      const { url } = await up.json()
      // Save to settings
      const sv = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: 'site_favicon', value: url })
      })
      if (!sv.ok) {
        const j = await sv.json().catch(() => ({}))
        throw new Error(j.error || 'Failed to save favicon setting')
      }
      setFaviconUrl(url)
      setFaviconPreview(null)
      await load()
      window.dispatchEvent(new Event('settings-updated'))
    } catch (e: any) {
      setFaviconError(e.message || 'Failed to upload/save favicon')
    } finally {
      setUploadingFavicon(false)
      if (fileInput) fileInput.value = ''
    }
  }

  const removeFavicon = async () => {
    if (!confirm('Remove current favicon?')) return
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: 'site_favicon', value: null })
      })
      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        throw new Error(j.error || 'Failed to remove favicon')
      }
      setFaviconUrl(null)
      setFaviconPreview(null)
      await load()
      window.dispatchEvent(new Event('settings-updated'))
    } catch (e: any) {
      alert(e.message || 'Failed to remove favicon')
    }
  }

  // About Author: avatar upload
  const onPickAuthorAvatar = async (e: any) => {
    const file = e.target?.files?.[0]
    if (!file) return
    setAuthorUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const up = await fetch('/api/admin/upload', { method: 'POST', body: fd })
      if (!up.ok) {
        const j = await up.json().catch(() => ({} as any))
        throw new Error(j.error || 'Upload failed')
      }
      const { url } = await up.json()
      setAuthorAvatar(url)
    } catch (e: any) {
      alert(e.message || 'Failed to upload avatar')
    } finally {
      setAuthorUploading(false)
      if (e?.target) e.target.value = ''
    }
  }

  const saveAuthor = async () => {
    setAuthorSaving(true)
    try {
      const payload = {
        name: authorName || undefined,
        bio: authorBio || undefined,
        avatarUrl: authorAvatar || undefined,
        website: authorWebsite || undefined,
        twitter: authorTwitter || undefined,
        github: authorGithub || undefined,
        linkedin: authorLinkedin || undefined,
      }
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: 'about_author', value: JSON.stringify(payload) })
      })
      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        throw new Error(j.error || 'Failed to save author profile')
      }
      await load()
      window.dispatchEvent(new Event('settings-updated'))
    } catch (e: any) {
      alert(e.message || 'Failed to save author profile')
    } finally {
      setAuthorSaving(false)
    }
  }

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <Link href="/admin" className="text-blue-600">Back to Dashboard</Link>
      </div>

      {/* About Author */}
      <div className="bg-white shadow px-4 py-5 sm:rounded-lg sm:p-6 mb-6">
        <div className="md:grid md:grid-cols-3 md:gap-6">
          <div className="md:col-span-1">
            <h3 className="text-lg font-medium leading-6 text-gray-900">About Author</h3>
            <p className="mt-1 text-sm text-gray-500">Add author bio and social profiles. LinkedIn is supported.</p>
          </div>
          <div className="mt-5 md:mt-0 md:col-span-2">
            <div className="grid grid-cols-6 gap-6">
              <div className="col-span-6 sm:col-span-3">
                <label className="block text-sm font-medium text-gray-700">Name</label>
                <input value={authorName} onChange={(e) => setAuthorName(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm px-4 py-2.5 focus:border-indigo-500 focus:ring-indigo-500" />
              </div>
              <div className="col-span-6">
                <label className="block text-sm font-medium text-gray-700">Bio</label>
                <textarea rows={4} value={authorBio} onChange={(e) => setAuthorBio(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm px-4 py-2.5 focus:border-indigo-500 focus:ring-indigo-500" />
              </div>
              <div className="col-span-6 sm:col-span-3">
                <label className="block text-sm font-medium text-gray-700">Avatar</label>
                <div className="mt-2 flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-100 border">
                    {authorAvatar ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={authorAvatar} alt="avatar" className="w-16 h-16 object-cover" />
                    ) : (
                      <div className="w-16 h-16" />
                    )}
                  </div>
                  <div>
                    <input id="authorAvatarFile" type="file" accept="image/*" onChange={onPickAuthorAvatar} className="block text-sm" />
                    {authorUploading && <p className="text-xs text-gray-500 mt-1">Uploading...</p>}
                  </div>
                </div>
              </div>
              <div className="col-span-6 sm:col-span-3">
                <label className="block text-sm font-medium text-gray-700">Website</label>
                <input value={authorWebsite} onChange={(e) => setAuthorWebsite(e.target.value)} placeholder="https://example.com" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm px-4 py-2.5 focus:border-indigo-500 focus:ring-indigo-500" />
              </div>
              <div className="col-span-6 sm:col-span-3">
                <label className="block text-sm font-medium text-gray-700">Twitter</label>
                <input value={authorTwitter} onChange={(e) => setAuthorTwitter(e.target.value)} placeholder="https://twitter.com/username" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm px-4 py-2.5 focus:border-indigo-500 focus:ring-indigo-500" />
              </div>
              <div className="col-span-6 sm:col-span-3">
                <label className="block text-sm font-medium text-gray-700">GitHub</label>
                <input value={authorGithub} onChange={(e) => setAuthorGithub(e.target.value)} placeholder="https://github.com/username" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm px-4 py-2.5 focus:border-indigo-500 focus:ring-indigo-500" />
              </div>
              <div className="col-span-6 sm:col-span-3">
                <label className="block text-sm font-medium text-gray-700">LinkedIn</label>
                <input value={authorLinkedin} onChange={(e) => setAuthorLinkedin(e.target.value)} placeholder="https://www.linkedin.com/in/username/" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm px-4 py-2.5 focus:border-indigo-500 focus:ring-indigo-500" />
              </div>
              <div className="col-span-6 flex justify-end">
                <button onClick={saveAuthor} disabled={authorSaving} className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50">
                  {authorSaving ? 'Saving...' : 'Save Author Profile'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Change Password */}
      <div className="bg-white shadow px-4 py-5 sm:rounded-lg sm:p-6 mb-6">
        <div className="md:grid md:grid-cols-3 md:gap-6">
          <div className="md:col-span-1">
            <h3 className="text-lg font-medium leading-6 text-gray-900">Change Password</h3>
            <p className="mt-1 text-sm text-gray-500">Update the admin account password. Minimum 8 characters.</p>
          </div>
          <div className="mt-5 md:mt-0 md:col-span-2">
            <form
              onSubmit={async (e) => {
                e.preventDefault()
                setCpError(null)
                setCpSuccess(null)
                if (!cpCurrent || !cpNew || !cpConfirm) {
                  setCpError('All fields are required.')
                  return
                }
                if (cpNew.length < 8) {
                  setCpError('New password must be at least 8 characters long.')
                  return
                }
                if (cpNew !== cpConfirm) {
                  setCpError('New password and confirmation do not match.')
                  return
                }
                setCpLoading(true)
                try {
                  const res = await fetch('/api/admin/change-password', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ currentPassword: cpCurrent, newPassword: cpNew })
                  })
                  const data = await res.json().catch(() => ({}))
                  if (!res.ok) throw new Error(data.error || 'Failed to change password')
                  setCpSuccess('Password updated successfully.')
                  setCpCurrent('')
                  setCpNew('')
                  setCpConfirm('')
                } catch (e: any) {
                  setCpError(e.message || 'Failed to change password')
                } finally {
                  setCpLoading(false)
                }
              }}
              className="space-y-4"
            >
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Current Password</label>
                  <input type="password" value={cpCurrent} onChange={(e) => setCpCurrent(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">New Password</label>
                  <input type="password" value={cpNew} onChange={(e) => setCpNew(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Confirm New Password</label>
                  <input type="password" value={cpConfirm} onChange={(e) => setCpConfirm(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" />
                </div>
              </div>
              {cpError && <p className="text-sm text-red-600">{cpError}</p>}
              {cpSuccess && <p className="text-sm text-green-600">{cpSuccess}</p>}
              <div>
                <button
                  type="submit"
                  disabled={cpLoading}
                  className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
                >
                  {cpLoading ? 'Updating...' : 'Update Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Favicon Management */}
      <div className="bg-white shadow px-4 py-5 sm:rounded-lg sm:p-6 mb-6">
        <div className="md:grid md:grid-cols-3 md:gap-6">
          <div className="md:col-span-1">
            <h3 className="text-lg font-medium leading-6 text-gray-900">Site Favicon</h3>
            <p className="mt-1 text-sm text-gray-500">Upload a .ico, .png, or .svg. Max 5 MB.</p>
          </div>
          <div className="mt-5 md:mt-0 md:col-span-2">
            <div className="space-y-4">
              <div className="flex items-center gap-6">
                <div>
                  <div className="text-sm text-gray-600 mb-2">Current</div>
                  <div className="flex items-center gap-4">
                    <div className="w-8 h-8">
                      {faviconUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={faviconUrl} alt="favicon" className="w-8 h-8 object-contain" />
                      ) : (
                        <div className="w-8 h-8 bg-gray-200 rounded" />
                      )}
                    </div>
                    <div className="w-16 h-16">
                      {faviconUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={faviconUrl} alt="favicon" className="w-16 h-16 object-contain" />
                      ) : (
                        <div className="w-16 h-16 bg-gray-200 rounded" />
                      )}
                    </div>
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-600 mb-2">New</div>
                  <div className="flex items-center gap-4">
                    <div className="w-8 h-8">
                      {faviconPreview ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={faviconPreview} alt="preview" className="w-8 h-8 object-contain" />
                      ) : (
                        <div className="w-8 h-8 bg-gray-100 rounded border border-dashed border-gray-300" />
                      )}
                    </div>
                    <div className="w-16 h-16">
                      {faviconPreview ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={faviconPreview} alt="preview" className="w-16 h-16 object-contain" />
                      ) : (
                        <div className="w-16 h-16 bg-gray-100 rounded border border-dashed border-gray-300" />
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <input id="faviconFile" type="file" accept=".ico,.png,.svg,image/x-icon,image/vnd.microsoft.icon,image/png,image/svg+xml" onChange={onPickFavicon} className="block text-sm" />
                <button
                  onClick={() => uploadAndSaveFavicon(document.getElementById('faviconFile') as HTMLInputElement)}
                  disabled={uploadingFavicon}
                  className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
                >
                  {uploadingFavicon ? 'Uploading...' : 'Upload & Save'}
                </button>
                {faviconUrl && (
                  <button onClick={removeFavicon} className="text-red-600 hover:text-red-700 text-sm">Remove</button>
                )}
              </div>
              {faviconError && <p className="text-sm text-red-600">{faviconError}</p>}
            </div>
          </div>
        </div>
      </div>

      {/* Footer Text */}
      <div className="bg-white shadow px-4 py-5 sm:rounded-lg sm:p-6 mb-6">
        <div className="md:grid md:grid-cols-3 md:gap-6">
          <div className="md:col-span-1">
            <h3 className="text-lg font-medium leading-6 text-gray-900">Footer Text</h3>
            <p className="mt-1 text-sm text-gray-500">Customize the footer text displayed on every page. You can include the current year and site name manually or leave blank to use the default.</p>
          </div>
          <div className="mt-5 md:mt-0 md:col-span-2">
            <div className="space-y-4">
              <textarea
                rows={3}
                value={footerText}
                onChange={(e) => setFooterText(e.target.value)}
                placeholder="© 2025 Techbird. Built with Next.js and Tailwind CSS."
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm px-4 py-2.5 focus:border-indigo-500 focus:ring-indigo-500"
              />
              <div className="flex justify-end">
                <button onClick={saveFooter} disabled={footerSaving} className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50">
                  {footerSaving ? 'Saving...' : 'Save Footer Text'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white shadow px-4 py-5 sm:rounded-lg sm:p-6 mb-6">
        <div className="md:grid md:grid-cols-3 md:gap-6">
          <div className="md:col-span-1">
            <h3 className="text-lg font-medium leading-6 text-gray-900">Add Setting</h3>
            <p className="mt-1 text-sm text-gray-500">Create a key/value entry. Keys are unique.</p>
          </div>
          <div className="mt-5 md:mt-0 md:col-span-2">
            <form onSubmit={handleAdd} className="grid grid-cols-6 gap-6">
              <div className="col-span-6 sm:col-span-3">
                <label htmlFor="key" className="block text-sm font-medium text-gray-700">Key</label>
                <input id="key" value={formKey} onChange={(e) => setFormKey(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm px-4 py-2.5 focus:border-indigo-500 focus:ring-indigo-500" placeholder="site_name" />
              </div>
              <div className="col-span-6">
                <label htmlFor="value" className="block text-sm font-medium text-gray-700">Value</label>
                <textarea id="value" rows={3} value={formValue} onChange={(e) => setFormValue(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm px-4 py-2.5 focus:border-indigo-500 focus:ring-indigo-500" placeholder="Your site name or any text" />
              </div>
              <div className="col-span-6 flex justify-end">
                <button type="submit" disabled={saving} className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50">
                  {saving ? "Saving..." : "Add"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      <div className="bg-white shadow px-4 py-5 sm:rounded-lg sm:p-6">
        <div className="mb-4 flex items-center justify-between gap-4">
          <h3 className="text-lg font-medium leading-6 text-gray-900">All Settings</h3>
          <input value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="Filter by key" className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
        </div>
        {loading ? (
          <p className="text-sm text-gray-500">Loading...</p>
        ) : filtered.length === 0 ? (
          <p className="text-sm text-gray-500">No settings found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Key</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Value</th>
                  <th className="px-6 py-3"></th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filtered.map((it) => (
                  <tr key={it.key}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{it.key}</td>
                    <td className="px-6 py-4 whitespace-pre-wrap text-sm text-gray-700">
                      {editingKey === it.key ? (
                        <textarea value={editValue} onChange={(e) => setEditValue(e.target.value)} rows={3} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                      ) : (
                        it.value || <span className="text-gray-400">(empty)</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                      {editingKey === it.key ? (
                        <>
                          <button onClick={saveEdit} disabled={saving} className="text-indigo-600 hover:text-indigo-900 disabled:opacity-50">Save</button>
                          <button onClick={cancelEdit} className="text-gray-600 hover:text-gray-900">Cancel</button>
                        </>
                      ) : (
                        <>
                          <button onClick={() => startEdit(it)} className="text-indigo-600 hover:text-indigo-900">Edit</button>
                          <button onClick={() => remove(it.key)} className="text-red-600 hover:text-red-900">Delete</button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
