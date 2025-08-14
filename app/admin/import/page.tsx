"use client"

import { useState } from 'react'

export default function ImportPage() {
  const [file, setFile] = useState<File | null>(null)
  const [target, setTarget] = useState<'auto' | 'posts' | 'pages'>('auto')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<null | { importedPosts: number; importedPages: number; skipped: number; errors?: string[] }>(null)
  const [error, setError] = useState<string | null>(null)

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setResult(null)
    if (!file) {
      setError('Please choose an .xml file')
      return
    }
    if (!file.name.toLowerCase().endsWith('.xml')) {
      setError('Only .xml files are allowed')
      return
    }

    try {
      setLoading(true)
      const form = new FormData()
      form.append('file', file)
      form.append('target', target)
      const res = await fetch('/api/admin/import', { method: 'POST', body: form })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data?.error || 'Import failed')
      }
      const data = await res.json()
      setResult(data)
    } catch (err: any) {
      setError(err?.message || 'Import failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Import</h1>
      <div className="bg-white shadow rounded-md p-6">
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Target</label>
            <select
              value={target}
              onChange={(e) => setTarget(e.target.value as any)}
              className="w-full max-w-xs rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="auto">Auto-detect (recommended)</option>
              <option value="posts">Posts</option>
              <option value="pages">Pages</option>
            </select>
            <p className="text-xs text-gray-500 mt-1">Auto-detect will try to map WordPress WXR or generic XML feeds to Posts/Pages.</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">XML file</label>
            <input
              type="file"
              accept=".xml"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="block w-full max-w-xl text-sm text-gray-700 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
            <p className="text-xs text-gray-500 mt-1">Only .xml files are allowed. Fields will be mapped heuristically; unknown fields are ignored.</p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={loading || !file}
              className={`px-4 py-2 rounded-md text-white ${loading || !file ? 'bg-gray-300 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}
            >
              {loading ? 'Importing...' : 'Import'}
            </button>
          </div>
        </form>

        {error && (
          <div className="mt-4 p-3 rounded bg-red-50 text-red-700 text-sm">{error}</div>
        )}
        {result && (
          <div className="mt-4 p-3 rounded bg-green-50 text-green-800 text-sm">
            <div className="font-medium mb-1">Import summary</div>
            <div>Imported posts: {result.importedPosts}</div>
            <div>Imported pages: {result.importedPages}</div>
            <div>Skipped: {result.skipped}</div>
            {result.errors && result.errors.length > 0 && (
              <details className="mt-2">
                <summary className="cursor-pointer">Show errors</summary>
                <ul className="list-disc pl-5 mt-1">
                  {result.errors.map((e, idx) => (
                    <li key={idx}>{e}</li>
                  ))}
                </ul>
              </details>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
