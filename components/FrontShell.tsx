import Link from 'next/link'
import { getSiteName, getFooterText } from '@/lib/settings'

export default async function FrontShell({ children }: { children: React.ReactNode }) {
  const siteName = await getSiteName('My CMS Blog')
  const year = new Date().getFullYear()
  const footerFromSettings = await getFooterText()
  const footerText = footerFromSettings ?? `© ${year} ${siteName}. Built with Next.js and Tailwind CSS.`
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 items-center gap-4 py-6">
            <Link href="/" className="text-2xl font-extrabold md:justify-self-start justify-self-center text-green-700">
              {siteName}
            </Link>
            <form action="/search" method="get" className="w-full md:justify-self-center">
              <label htmlFor="q" className="sr-only">Search</label>
              <div className="relative">
                <input
                  id="q"
                  name="q"
                  type="search"
                  placeholder="Search posts..."
                  className="w-full rounded-md border border-gray-300 pl-10 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white"
                />
                <svg className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8"></circle>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                </svg>
              </div>
            </form>
            <nav className="hidden md:flex gap-2 md:justify-self-end justify-self-center">
              <Link href="/" className="px-3 py-2 rounded-md text-gray-800 hover:text-white bg-transparent hover:bg-green-600 transition-colors">Home</Link>
              <div className="relative group">
                <span className="px-3 py-2 rounded-md text-gray-800 hover:text-white bg-transparent hover:bg-green-600 transition-colors inline-flex items-center cursor-default select-none">
                  Tools
                  <svg className="ml-1 w-4 h-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.127l3.71-3.896a.75.75 0 111.08 1.04l-4.24 4.46a.75.75 0 01-1.08 0l-4.24-4.46a.75.75 0 01.02-1.06z" clipRule="evenodd" />
                  </svg>
                </span>
                <div className="absolute right-0 top-full w-48 bg-white border border-gray-200 rounded-md shadow-lg py-1 hidden group-hover:block group-focus-within:block z-20">
                  <Link href="/blog" className="block px-4 py-2 text-sm text-gray-700 hover:bg-green-50 hover:text-green-700">Blog</Link>
                  <Link href="/search" className="block px-4 py-2 text-sm text-gray-700 hover:bg-green-50 hover:text-green-700">Search</Link>
                  <Link href="/about" className="block px-4 py-2 text-sm text-gray-700 hover:bg-green-50 hover:text-green-700">About</Link>
                  <Link href="/contact" className="block px-4 py-2 text-sm text-gray-700 hover:bg-green-50 hover:text-green-700">Contact</Link>
                </div>
              </div>
              <Link href="/admin" className="px-3 py-2 rounded-md text-gray-800 hover:text-white bg-transparent hover:bg-green-600 transition-colors">Admin</Link>
            </nav>
          </div>
        </div>
      </header>

      <div className="flex-1">
        {children}
      </div>

      <footer className="bg-white border-t border-gray-200 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="text-gray-600 text-sm">{footerText}</div>
            <nav className="flex items-center gap-6 text-sm">
              <Link href="/about" className="text-gray-700 hover:text-green-600">About</Link>
              <Link href="/contact" className="text-gray-700 hover:text-green-600">Contact</Link>
              <Link href="/privacy-policy" className="text-gray-700 hover:text-green-600">Privacy Policy</Link>
            </nav>
          </div>
        </div>
      </footer>
    </div>
  )
}
