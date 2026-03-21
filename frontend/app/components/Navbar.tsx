'use client'
import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { getUser, logout } from '../lib/api'

interface NavUser {
  id: number
  firstname: string
  lastname: string
  email: string
  role: string
}

const roleLabel: Record<string, string> = {
  student:    'นักศึกษา',
  personnel:  'บุคลากร',
  samo:       'สโมสรคณะ',
  officer:    'เจ้าหน้าที่มหาวิทยาลัย',
  admin:      'ผู้ดูแลระบบ',
}

const roleBadgeColor: Record<string, string> = {
  student:   'bg-blue-100 text-blue-700',
  personnel: 'bg-green-100 text-green-700',
  samo:      'bg-yellow-100 text-yellow-700',
  officer:   'bg-orange-100 text-orange-700',
  admin:     'bg-purple-100 text-purple-700',
}

// กำหนดเมนูตาม role
const navLinksByRole: Record<string, { href: string; label: string }[]> = {
  student: [
    { href: '/complaints',       label: 'รายการทั้งหมด' },
    { href: '/my-complaints',    label: 'ของฉัน' },
    { href: '/create-complaint', label: '+ แจ้งเรื่อง' },
  ],
  personnel: [
    { href: '/dashboard',        label: 'Dashboard' },
    { href: '/complaints',       label: 'รายการทั้งหมด' },
    { href: '/my-complaints',    label: 'ของฉัน' },
    { href: '/create-complaint', label: '+ แจ้งเรื่อง' },
  ],
  samo: [
    { href: '/dashboard',        label: 'Dashboard' },
    { href: '/complaints',       label: 'รายการทั้งหมด' },
  ],
  officer: [
    { href: '/dashboard',        label: 'Dashboard' },
    { href: '/complaints',       label: 'รายการทั้งหมด' },
  ],
  admin: [
    { href: '/dashboard',        label: 'Dashboard' },
    { href: '/complaints',       label: 'รายการทั้งหมด' },
  ],
}

// ซ่อน navbar บนหน้าเหล่านี้
const HIDDEN_PATHS = ['/login', '/register']

export default function Navbar() {
  const router = useRouter()
  const pathname = usePathname()
  const [user, setUser] = useState<NavUser | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    setUser(getUser())
  }, [pathname])

  if (!user || HIDDEN_PATHS.includes(pathname)) return null

  const links = navLinksByRole[user.role] || []

  const handleLogout = () => {
    logout()
    router.push('/login')
  }

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">

        {/* Logo */}
        <button
          onClick={() => router.push('/complaints')}
          className="font-bold text-blue-600 text-lg tracking-tight"
        >
          IMS
        </button>

        {/* Nav links */}
        <div className="hidden sm:flex items-center gap-1">
          {links.map(link => (
            <button
              key={link.href}
              onClick={() => router.push(link.href)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors
                ${pathname === link.href
                  ? 'bg-blue-50 text-blue-600'
                  : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50'
                }`}
            >
              {link.label}
            </button>
          ))}
        </div>

        {/* User dropdown */}
        <div className="relative">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold">
              {user.firstname[0]}
            </div>
            <span className="text-sm font-medium text-gray-700 hidden sm:block">
              {user.firstname}
            </span>
            <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {menuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-20">
                <div className="px-4 py-2 border-b border-gray-100 mb-1">
                  <p className="text-sm font-semibold text-gray-800">{user.firstname} {user.lastname}</p>
                  <p className="text-xs text-gray-400 truncate">{user.email}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium mt-1.5 inline-block ${roleBadgeColor[user.role] || 'bg-gray-100 text-gray-600'}`}>
                    {roleLabel[user.role] || user.role}
                  </span>
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-red-50 transition-colors"
                >
                  ออกจากระบบ
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}