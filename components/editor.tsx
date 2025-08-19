'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Image from '@tiptap/extension-image'
import { Table } from '@tiptap/extension-table'
import TableRow from '@tiptap/extension-table-row'
import TableCell from '@tiptap/extension-table-cell'
import TableHeader from '@tiptap/extension-table-header'
import { Node } from '@tiptap/core'
import { useEffect, useState } from 'react'

interface EditorProps {
  content: string
  onChange: (content: string) => void
  placeholder?: string
}

export default function Editor({ content, onChange, placeholder = "Start writing..." }: EditorProps) {
  const [showHtml, setShowHtml] = useState(false)
  const [htmlDraft, setHtmlDraft] = useState('')
  // Custom Iframe node
  const Iframe = Node.create({
    name: 'iframe',
    group: 'block',
    atom: true,
    selectable: true,
    draggable: true,
    addAttributes() {
      return {
        src: { default: '' },
        width: { default: '100%' },
        height: { default: '400' },
        frameborder: { default: '0' },
        allow: { default: 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share' },
        allowfullscreen: { default: true },
        style: { default: '' },
      }
    },
    parseHTML() {
      return [
        {
          tag: 'iframe',
          getAttrs: (node) => {
            if (!(node instanceof HTMLElement)) return {}
            return {
              src: node.getAttribute('src') || '',
              width: node.getAttribute('width') || '100%',
              height: node.getAttribute('height') || '400',
              frameborder: node.getAttribute('frameborder') || '0',
              allow: node.getAttribute('allow') || undefined,
              allowfullscreen: node.hasAttribute('allowfullscreen'),
              style: node.getAttribute('style') || '',
            }
          },
        },
      ]
    },
    renderHTML({ HTMLAttributes }) {
      return ['iframe', HTMLAttributes]
    },
  })

  // Custom Audio node (simple <audio src> variant)
  const Audio = Node.create({
    name: 'audio',
    group: 'block',
    atom: true,
    selectable: true,
    draggable: true,
    addAttributes() {
      return {
        src: { default: '' },
        controls: { default: true },
        style: { default: '' },
      }
    },
    parseHTML() {
      return [
        {
          tag: 'audio',
          getAttrs: (node) => {
            if (!(node instanceof HTMLElement)) return {}
            return {
              src: node.getAttribute('src') || '',
              controls: node.hasAttribute('controls'),
              style: node.getAttribute('style') || '',
            }
          },
        },
      ]
    },
    renderHTML({ HTMLAttributes }) {
      return ['audio', HTMLAttributes]
    },
  })

  // Custom Gallery node: renders a responsive grid of images
  const Gallery = Node.create({
    name: 'gallery',
    group: 'block',
    atom: true,
    selectable: true,
    draggable: true,
    addAttributes() {
      return {
        urls: { default: '' }, // comma-separated
        columns: { default: 3 },
      }
    },
    parseHTML() {
      return [
        {
          tag: 'div[data-gallery]'
        },
      ]
    },
    renderHTML({ HTMLAttributes }) {
      const urlsAttr = (HTMLAttributes as any).urls || ''
      const cols = Number((HTMLAttributes as any).columns || 3)
      const urls = typeof urlsAttr === 'string' ? urlsAttr.split(',').map((s) => s.trim()).filter(Boolean) : []
      const style = `display:grid;gap:1rem;grid-template-columns:repeat(${Math.max(2, Math.min(4, cols))},minmax(0,1fr));`
      const children: any[] = []
      for (const u of urls) {
        children.push(['div', { style: 'position:relative;padding-bottom:100%;background:#f9fafb;border-radius:0.5rem;overflow:hidden' }, ['img', { src: u, alt: '', style: 'position:absolute;inset:0;width:100%;height:100%;object-fit:cover' }]])
      }
      return ['div', { 'data-gallery': '1', style }, ...children]
    },
  })

  // Custom Video node (simple <video src> variant)
  const Video = Node.create({
    name: 'video',
    group: 'block',
    atom: true,
    selectable: true,
    draggable: true,
    addAttributes() {
      return {
        src: { default: '' },
        width: { default: '100%' },
        height: { default: '' },
        controls: { default: true },
        poster: { default: '' },
        loop: { default: false },
        muted: { default: false },
        autoplay: { default: false },
        style: { default: '' },
      }
    },
    parseHTML() {
      return [
        {
          tag: 'video',
          getAttrs: (node) => {
            if (!(node instanceof HTMLElement)) return {}
            return {
              src: node.getAttribute('src') || '',
              width: node.getAttribute('width') || '100%',
              height: node.getAttribute('height') || '',
              controls: node.hasAttribute('controls'),
              poster: node.getAttribute('poster') || '',
              loop: node.hasAttribute('loop'),
              muted: node.hasAttribute('muted'),
              autoplay: node.hasAttribute('autoplay'),
              style: node.getAttribute('style') || '',
            }
          },
        },
      ]
    },
    renderHTML({ HTMLAttributes }) {
      return ['video', HTMLAttributes]
    },
  })

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        bulletList: {
          keepMarks: true,
          keepAttributes: false,
        },
        orderedList: {
          keepMarks: true,
          keepAttributes: false,
        },
      }),
      Image.configure({ inline: false, allowBase64: true }),
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
      Iframe,
      Gallery,
      Video,
      Audio,
    ],
    content,
    immediatelyRender: false, // Fix SSR hydration issue
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
    editorProps: {
      attributes: {
        class: 'prose-content mx-auto focus:outline-none min-h-[300px] p-4',
      },
    },
  })

  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content)
    }
  }, [content, editor])

  // Listen for media selection from Media Library picker window (postMessage + storage fallback)
  useEffect(() => {
    if (!editor) return
    const handler = (e: MessageEvent) => {
      const data = (e as any).data
      if (!data || data.type !== 'media-select') return
      const urls: string[] = Array.isArray(data.urls) ? data.urls : (data.url ? [String(data.url)] : [])
      if (!urls.length) return
      // If multiple images -> insert gallery
      const cleanUrls = urls.map(u => String(u)).filter(Boolean)
      const imageUrls = cleanUrls.filter(u => /\.(png|jpe?g|gif|webp|svg|ico)$/i.test(u.split('?')[0].split('#')[0]))
      if (imageUrls.length > 1) {
        editor.chain().focus().insertContent({ type: 'gallery', attrs: { urls: imageUrls.join(','), columns: Math.min(4, Math.max(2, imageUrls.length >= 4 ? 4 : imageUrls.length)) } }).run()
        onChange(editor.getHTML())
        return
      }
      // Otherwise insert each accordingly
      for (const url of cleanUrls) {
        const clean = url.split('?')[0].split('#')[0]
        const isImage = /\.(png|jpe?g|gif|webp|svg|ico)$/i.test(clean)
        const isVideo = /\.(mp4|webm)$/i.test(clean)
        const isAudio = /\.(mp3|ogg|wav)$/i.test(clean)
        const isPdf = /\.pdf$/i.test(clean)
        if (isImage) {
          editor.chain().focus().setImage({ src: url }).run()
        } else if (isVideo) {
          editor.chain().focus().insertContent({ type: 'video', attrs: { src: url, controls: true, width: '100%' } }).run()
        } else if (isAudio) {
          editor.chain().focus().insertContent({ type: 'audio', attrs: { src: url, controls: true, style: 'width:100%' } }).run()
        } else if (isPdf) {
          editor.commands.insertContent(`<iframe src="${url}" style="width:100%;height:600px;border:0" loading="lazy"></iframe>`)
        } else {
          editor.chain().focus().insertContent(url).run()
        }
      }
      onChange(editor.getHTML())
    }
    window.addEventListener('message', handler)
    const onStorage = (e: StorageEvent) => {
      if (e.key !== 'media-select' || !e.newValue) return
      try {
        const payload = JSON.parse(e.newValue)
        if (payload) {
          if (Array.isArray(payload.urls)) {
            handler({ data: { type: 'media-select', urls: payload.urls } } as any)
          } else if (payload.url) {
            handler({ data: { type: 'media-select', url: payload.url } } as any)
          }
        }
      } catch {}
      try { localStorage.removeItem('media-select') } catch {}
    }
    window.addEventListener('storage', onStorage)
    return () => {
      window.removeEventListener('message', handler)
      window.removeEventListener('storage', onStorage)
    }
  }, [editor, onChange])

  if (!editor) {
    return null
  }

  return (
    <div className="border border-gray-300 rounded-lg relative">
      <div className="border-b border-gray-300 p-2 flex flex-wrap gap-1">
        <button
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`px-3 py-1 rounded text-sm ${
            editor.isActive('bold') ? 'bg-gray-200' : 'hover:bg-gray-100'
          }`}
          type="button"
        >
          Bold
        </button>
        <button
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`px-3 py-1 rounded text-sm ${
            editor.isActive('italic') ? 'bg-gray-200' : 'hover:bg-gray-100'
          }`}
          type="button"
        >
          Italic
        </button>
        <button
          onClick={() => editor.chain().focus().toggleStrike().run()}
          className={`px-3 py-1 rounded text-sm ${
            editor.isActive('strike') ? 'bg-gray-200' : 'hover:bg-gray-100'
          }`}
          type="button"
        >
          Strike
        </button>
        <button
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          className={`px-3 py-1 rounded text-sm ${
            editor.isActive('heading', { level: 1 }) ? 'bg-gray-200' : 'hover:bg-gray-100'
          }`}
          type="button"
        >
          H1
        </button>
        <button
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={`px-3 py-1 rounded text-sm ${
            editor.isActive('heading', { level: 2 }) ? 'bg-gray-200' : 'hover:bg-gray-100'
          }`}
          type="button"
        >
          H2
        </button>
        <button
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          className={`px-3 py-1 rounded text-sm ${
            editor.isActive('heading', { level: 3 }) ? 'bg-gray-200' : 'hover:bg-gray-100'
          }`}
          type="button"
        >
          H3
        </button>
        <button
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`px-3 py-1 rounded text-sm ${
            editor.isActive('bulletList') ? 'bg-gray-200' : 'hover:bg-gray-100'
          }`}
          type="button"
        >
          Bullet List
        </button>
        <button
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={`px-3 py-1 rounded text-sm ${
            editor.isActive('orderedList') ? 'bg-gray-200' : 'hover:bg-gray-100'
          }`}
          type="button"
        >
          Ordered List
        </button>
        <button
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={`px-3 py-1 rounded text-sm ${
            editor.isActive('blockquote') ? 'bg-gray-200' : 'hover:bg-gray-100'
          }`}
          type="button"
        >
          Quote
        </button>
        <button
          onClick={() => {
            const w = 1100
            const h = 800
            const y = window.top?.outerHeight ? Math.max(0, ((window.top.outerHeight - h) / 2) + (window.top.screenY || 0)) : 100
            const x = window.top?.outerWidth ? Math.max(0, ((window.top.outerWidth - w) / 2) + (window.top.screenX || 0)) : 100
            window.open('/admin/media?picker=1', 'media_picker', `width=${w},height=${h},left=${x},top=${y}`)
          }}
          className="px-3 py-1 rounded text-sm hover:bg-gray-100"
          type="button"
          title="Open Media Library"
        >
          Media
        </button>
        <button
          onClick={() => {
            const w = 1100
            const h = 800
            const y = window.top?.outerHeight ? Math.max(0, ((window.top.outerHeight - h) / 2) + (window.top.screenY || 0)) : 100
            const x = window.top?.outerWidth ? Math.max(0, ((window.top.outerWidth - w) / 2) + (window.top.screenX || 0)) : 100
            window.open('/admin/media?picker=1&multi=1', 'media_picker', `width=${w},height=${h},left=${x},top=${y}`)
          }}
          className="px-3 py-1 rounded text-sm hover:bg-gray-100"
          type="button"
          title="Insert Gallery from selection"
        >
          Gallery
        </button>
        {editor.isActive('gallery') && (
          <button
            onClick={() => {
              const current = (editor.getAttributes('gallery')?.columns as number) || 3
              const input = prompt('Gallery columns (2-4)', String(current))
              if (!input) return
              const n = Math.max(2, Math.min(4, parseInt(input, 10) || current))
              editor.chain().focus().updateAttributes('gallery', { columns: n }).run()
            }}
            className="px-3 py-1 rounded text-sm hover:bg-gray-100"
            type="button"
            title="Set gallery columns"
          >
            Gallery Cols
          </button>
        )}
        <button
          onClick={() => {
            const url = prompt('Image URL')?.trim()
            if (!url) return
            editor.chain().focus().setImage({ src: url }).run()
          }}
          className="px-3 py-1 rounded text-sm hover:bg-gray-100"
          type="button"
          title="Insert image by URL"
        >
          Image
        </button>
        <button
          onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
          className="px-3 py-1 rounded text-sm hover:bg-gray-100"
          type="button"
          title="Insert table"
        >
          Table
        </button>
        {editor.isActive('table') && (
          <>
            <button onClick={() => editor.chain().focus().addColumnAfter().run()} className="px-2 py-1 rounded text-sm hover:bg-gray-100" type="button">+Col</button>
            <button onClick={() => editor.chain().focus().addRowAfter().run()} className="px-2 py-1 rounded text-sm hover:bg-gray-100" type="button">+Row</button>
            <button onClick={() => editor.chain().focus().deleteColumn().run()} className="px-2 py-1 rounded text-sm hover:bg-gray-100" type="button">Del Col</button>
            <button onClick={() => editor.chain().focus().deleteRow().run()} className="px-2 py-1 rounded text-sm hover:bg-gray-100" type="button">Del Row</button>
            <button onClick={() => editor.chain().focus().deleteTable().run()} className="px-2 py-1 rounded text-sm hover:bg-gray-100" type="button">Del Table</button>
          </>
        )}
        <button
          onClick={() => {
            const src = prompt('Iframe src (URL)')?.trim()
            if (!src) return
            const width = prompt('Width (e.g., 100% or 560)', '100%') || '100%'
            const height = prompt('Height (e.g., 315 or 400)', '400') || '400'
            editor.chain().focus().insertContent({ type: 'iframe', attrs: { src, width, height, frameborder: '0', allow: 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share', allowfullscreen: true } }).run()
          }}
          className="px-3 py-1 rounded text-sm hover:bg-gray-100"
          type="button"
          title="Insert iframe"
        >
          Iframe
        </button>
        <button
          onClick={() => {
            const src = prompt('Video src (URL)')?.trim()
            if (!src) return
            const width = prompt('Width (e.g., 100% or 640)', '100%') || '100%'
            const height = prompt('Height (optional, e.g., 360)', '') || ''
            editor.chain().focus().insertContent({ type: 'video', attrs: { src, width, height, controls: true } }).run()
          }}
          className="px-3 py-1 rounded text-sm hover:bg-gray-100"
          type="button"
          title="Insert video"
        >
          Video
        </button>
        <span className="mx-2 h-6 w-px bg-gray-300 inline-block align-middle" />
        <button
          onClick={() => {
            if (!editor) return
            setHtmlDraft(editor.getHTML())
            setShowHtml(true)
          }}
          className="px-3 py-1 rounded text-sm hover:bg-gray-100"
          type="button"
          title="Edit raw HTML"
        >
          HTML
        </button>
      </div>
      <EditorContent editor={editor} />

      {showHtml && (
        <div className="absolute inset-0 z-20 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/40" onClick={() => setShowHtml(false)} />
          <div className="relative bg-white w-[min(900px,95vw)] max-h-[85vh] rounded-lg shadow-xl z-30 p-4 flex flex-col">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-gray-900">Edit HTML</h3>
              <button onClick={() => setShowHtml(false)} className="text-gray-500 hover:text-gray-800 text-sm">Close</button>
            </div>
            <textarea
              className="flex-1 min-h-[300px] w-full rounded-md border border-gray-300 p-3 text-sm font-mono leading-5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={htmlDraft}
              onChange={(e) => setHtmlDraft(e.target.value)}
              placeholder="<p>Your HTML here</p>"
            />
            <div className="mt-3 flex justify-end gap-2">
              <button
                onClick={() => setShowHtml(false)}
                className="px-4 py-2 text-sm rounded-md border border-gray-300 hover:bg-gray-50"
                type="button"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (!editor) return
                  try {
                    editor.commands.setContent(htmlDraft)
                    // Also push raw HTML up to parent state to persist full HTML
                    onChange(htmlDraft)
                    setShowHtml(false)
                  } catch (e) {
                    // If parsing fails, keep modal open so user can fix
                    alert('Invalid HTML. Please review and try again.')
                  }
                }}
                className="px-4 py-2 text-sm rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                type="button"
              >
                Apply HTML
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
