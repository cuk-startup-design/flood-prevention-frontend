import NavBar from '@/components/NavBar'
import Header from '@/components/Header'

export default function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-row min-h-full">
      <NavBar />
      <div className="flex flex-col flex-1">
        <Header />
        <main className="flex-1 pb-16 md:pb-0">{children}</main>
      </div>
    </div>
  )
}
