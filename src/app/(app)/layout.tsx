import NavBar from '@/components/NavBar'

export default function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-row min-h-full">
      <NavBar />
      <main className="flex-1 pb-16 md:pb-0">{children}</main>
    </div>
  )
}
