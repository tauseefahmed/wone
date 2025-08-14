import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from './providers'
import { getSiteName, getSiteFavicon } from '@/lib/settings'

const inter = Inter({
  subsets: ["latin"],
});

export async function generateMetadata(): Promise<Metadata> {
  const siteName = await getSiteName('CMS - Content Management System')
  const favicon = await getSiteFavicon()
  return {
    title: siteName,
    description: "A modern WordPress-like CMS built with Next.js",
    icons: {
      icon: [{ url: favicon || '/favicon.ico' }],
      shortcut: [{ url: favicon || '/favicon.ico' }],
      apple: favicon ? [{ url: favicon }] : undefined,
    },
  }
}

// Ensure dynamic so favicon updates reflect immediately across public pages
export const dynamic = 'force-dynamic'

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} antialiased`} suppressHydrationWarning>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
