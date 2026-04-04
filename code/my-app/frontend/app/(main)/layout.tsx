import Navbar from '../components/Navbar'
import Sidebar from '../components/Sidebar'

export default function MainLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="flex min-h-[calc(100vh-64px)] bg-gray-50">
        <Sidebar />
        <main className="flex-1 bg-gray-50 p-6 overflow-x-auto">
          {children}
        </main>
      </div>
    </div>
  )
}