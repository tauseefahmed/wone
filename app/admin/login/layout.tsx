export default function LoginLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Login page should not be wrapped by the admin layout that checks authentication
  return <>{children}</>
}
