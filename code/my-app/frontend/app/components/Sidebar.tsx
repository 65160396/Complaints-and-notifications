'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { getUser } from '../lib/api'

type User = {
  firstname?: string
  lastname?: string
  role?: 'student' | 'personnel' | 'samo' | 'officer' | 'admin'
}

const menuByRole = {
  student: [
    // { name: 'หน้าหลัก', href: '/dashboard', icon: '🏠' },
    { name: 'สร้างคำร้อง', href: '/create-complaint', icon: '📝' },
    { name: 'คำร้องของฉัน', href: '/my-complaints', icon: '📋' },
    // { name: 'การแจ้งเตือน', href: '/notifications', icon: '🔔' },
    // { name: 'ตั้งค่าการแจ้งเตือน', href: '/notification-settings', icon: '⚙️' },
    // { name: 'โปรไฟล์', href: '/profile', icon: '👤' },
  ],
  personnel: [
    // { name: 'หน้าหลัก', href: '/dashboard', icon: '🏠' },
    { name: 'สร้างคำร้อง', href: '/create-complaint', icon: '📝' },
    { name: 'ติดตามคำร้อง', href: '/my-complaints', icon: '📌' },
    // { name: 'การแจ้งเตือน', href: '/notifications', icon: '🔔' },
    // { name: 'ตั้งค่าการแจ้งเตือน', href: '/notification-settings', icon: '⚙️' },
    // { name: 'โปรไฟล์', href: '/profile', icon: '👤' },
  ],
  samo: [
    { name: 'ภาพรวมคณะ', href: '/dashboard', icon: '🏫' },
    //{ name: 'รับเรื่องร้องเรียน', href: '/complaints', icon: '📥' },
    //{ name: 'ติดตามสถานะ', href: '/my-complaints', icon: '📊' },
    // { name: 'การแจ้งเตือน', href: '/notifications', icon: '🔔' },
    // { name: 'ตั้งค่าการแจ้งเตือน', href: '/notification-settings', icon: '⚙️' },
    // { name: 'โปรไฟล์', href: '/profile', icon: '👤' },
  ],
  officer: [
    { name: 'ภาพรวมมหาวิทยาลัย', href: '/dashboard', icon: '🏛️' },
    //{ name: 'คำร้องที่รับผิดชอบ', href: '/complaints', icon: '📋' },
    // { name: 'การแจ้งเตือน', href: '/notifications', icon: '🔔' },
    // { name: 'ตั้งค่าการแจ้งเตือน', href: '/notification-settings', icon: '⚙️' },
    // { name: 'โปรไฟล์', href: '/profile', icon: '👤' },
  ],
  admin: [
    { name: 'ภาพรวม', href: '/admin', icon: '📊' },
    { name: 'ผู้ใช้', href: '/admin/users', icon: '👥' },
    { name: 'Master Data', href: '/admin/master-data', icon: '🗂️' },
    { name: 'คำร้องทั้งหมด', href: '/admin/complaints', icon: '📋' },
    { name: 'Audit Log', href: '/admin/audit-logs', icon: '🧾' },
    { name: 'System Log', href: '/admin/system-logs', icon: '💻' },
    { name: 'แจ้งเตือนฉุกเฉิน', href: '/admin/broadcast', icon: '🚨' },
  ],
} as const

const roleTitle: Record<string, string> = {
  student: 'Student',
  personnel: 'Personnel',
  samo: 'Samo',
  officer: 'University Officer',
  admin: 'Admin Panel',
}

export default function Sidebar() {
  const pathname = usePathname()
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    setUser(getUser())
  }, [])

  const role = user?.role || 'student'
  const menus = menuByRole[role] || []
  const title = roleTitle[role] || 'Menu'

  return (
    <aside className="w-72 min-h-[calc(100vh-64px)] bg-white border-r border-gray-200 shadow-sm">
      <nav className="p-4 space-y-2">
        {menus.map((item) => {
          const active = pathname === item.href

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all ${
                active
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }`}
            >
              <span className="text-base">{item.icon}</span>
              <span>{item.name}</span>
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}