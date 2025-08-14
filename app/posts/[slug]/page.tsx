import { notFound } from 'next/navigation'

 

 

 

export default async function PostPage({ params }: { params: { slug: string } }) {
  // Legacy route intentionally returns 404 to avoid redirecting
  notFound()
}
