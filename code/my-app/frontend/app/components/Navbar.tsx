'use client'
import { useEffect, useState, useCallback } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { getUser, logout } from '../lib/api'
import api from '../lib/api'

interface NavUser {
  id: number
  firstname: string
  lastname: string
  email: string
  role: string
}

interface Notification {
  notification_id: number
  message: string
  is_read: number
  issue_id: number | null
  created_at: string
  type: string
}

const roleLabel: Record<string, string> = {
  student:   'นักศึกษา',
  personnel: 'บุคลากร',
  samo:      'สโมสรคณะ',
  officer:   'เจ้าหน้าที่มหาวิทยาลัย',
  admin:     'ผู้ดูแลระบบ',
}

const roleBadgeColor: Record<string, string> = {
  student:   'bg-blue-100 text-blue-700',
  personnel: 'bg-green-100 text-green-700',
  samo:      'bg-yellow-100 text-yellow-700',
  officer:   'bg-orange-100 text-orange-700',
  admin:     'bg-purple-100 text-purple-700',
}

const navLinksByRole: Record<string, { href: string; label: string }[]> = {
 student: [
    // { href: '/my-complaints',    label: 'คำร้องของฉัน' },
    // { href: '/create-complaint', label: '+ แจ้งเรื่อง' },
  ],
  personnel: [
    // { href: '/complaints',       label: 'รายการในคณะ' },
    // { href: '/my-complaints',    label: 'คำร้องของฉัน' },
    // { href: '/create-complaint', label: '+ แจ้งเรื่อง' },
  ],
  samo: [
    // { href: '/dashboard', label: 'Dashboard' },
  ],
  officer: [
    //{ href: '/dashboard', label: 'Dashboard' },
  ],
  admin: [
    //{ href: '/admin', label: 'Admin' },
  ],
}

const HIDDEN_PATHS = ['/login', '/register']

export default function Navbar() {
  const router = useRouter()
  const pathname = usePathname()
  const [user, setUser] = useState<NavUser | null>(null)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    setUser(getUser())
  }, [pathname])

  // ดึง unread count ทุก 30 วินาที
  const fetchUnreadCount = useCallback(async () => {
    try {
      const res = await api.get('/notifications/unread-count')
      setUnreadCount(res.data.count)
    } catch {}
  }, [])

  useEffect(() => {
    if (!user || HIDDEN_PATHS.includes(pathname)) return
    fetchUnreadCount()
    const interval = setInterval(fetchUnreadCount, 30000)
    return () => clearInterval(interval)
  }, [user, pathname, fetchUnreadCount])

  // เปิด notification dropdown → ดึงรายการ
  const handleOpenNotif = async () => {
    setNotifOpen(!notifOpen)
    setUserMenuOpen(false)
    if (!notifOpen) {
      try {
        const res = await api.get('/notifications')
        setNotifications(res.data)
      } catch {}
    }
  }

  const handleMarkAllRead = async () => {
    try {
      await api.patch('/notifications/read-all')
      setNotifications(prev => prev.map(n => ({ ...n, is_read: 1 })))
      setUnreadCount(0)
    } catch {}
  }

  const handleMarkRead = async (notifId: number) => {
    try {
      await api.patch(`/notifications/${notifId}/read`)
      setNotifications(prev =>
        prev.map(n => n.notification_id === notifId ? { ...n, is_read: 1 } : n)
      )
      setUnreadCount(prev => Math.max(0, prev - 1))
    } catch {}
  }

  if (!user || HIDDEN_PATHS.includes(pathname)) return null

  const links = navLinksByRole[user.role] || []

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="w-full px-6 h-14 flex items-center justify-between">

        {/* Logo */}
        <button onClick={() => {
            const role = user?.role
            if (role === 'student' || role === 'personnel') router.push('/my-complaints')
            else if (role === 'admin') router.push('/admin')
            else if (role === 'samo' || role === 'officer') router.push('/dashboard')
            else router.push('/login')
          }}
          className="font-bold text-blue-600 text-lg tracking-tight">
          IMS ระบบร้องเรียนแจ้งเตือน
        </button>

        {/* Nav links */}
        <div className="hidden sm:flex items-center gap-1">
          {links.map(link => (
            <button key={link.href} onClick={() => router.push(link.href)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors
                ${pathname === link.href
                  ? 'bg-blue-50 text-blue-600'
                  : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50'}`}>
              {link.label}
            </button>
          ))}
        </div>

        {/* Right: bell + user */}
        <div className="flex items-center gap-2">

          {/* 🔔 Notification bell */}
          <div className="relative">
            <button onClick={handleOpenNotif}
              className="relative w-9 h-9 flex items-center justify-center rounded-lg hover:bg-gray-50 transition-colors">
              <span className="text-xl">🔔</span>
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold leading-none">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {notifOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setNotifOpen(false)} />
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-gray-100 z-20 overflow-hidden">
                  {/* Header */}
                  <div className="flex justify-between items-center px-4 py-3 border-b border-gray-100">
                    <span className="font-semibold text-gray-800 text-sm">การแจ้งเตือน</span>
                    {unreadCount > 0 && (
                      <button onClick={handleMarkAllRead}
                        className="text-xs text-blue-600 hover:underline">
                        อ่านทั้งหมด
                      </button>
                    )}
                  </div>

                  {/* List */}
                  <div className="max-h-80 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="py-10 text-center text-gray-400 text-sm">
                        <p className="text-3xl mb-2">🔕</p>
                        ยังไม่มีการแจ้งเตือน
                      </div>
                    ) : (
                      notifications.map(n => (
                        <button
                          key={n.notification_id}
                         onClick={() => {
                          if (!n.is_read) handleMarkRead(n.notification_id)
                          if (n.issue_id) {
                            if (user?.role === 'student') {
                              router.push('/my-complaints')
                            } else if (user?.role === 'personnel') {
                              if (n.type === 'status_change') {
                                router.push('/my-complaints')  // แจ้งสถานะเปลี่ยน → ไปดูคำร้องตัวเอง
                              } else {
                                router.push('/dashboard')      // ถูกมอบหมาย → ไป dashboard
                              }
                            } else {
                              router.push('/dashboard')        // samo, officer, admin
                            }
                          } else {
                            router.push('/dashboard')
                          }
                          setNotifOpen(false)
                        }}
                          className={`w-full text-left px-4 py-3 border-b border-gray-50 hover:bg-gray-50 transition-colors flex gap-3 items-start
                            ${!n.is_read ? 'bg-blue-50/50' : ''}`}
                        >
                          <span className="mt-0.5 shrink-0">
                            {!n.is_read ? '🔵' : '⚪'}
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm leading-snug ${!n.is_read ? 'font-medium text-gray-800' : 'text-gray-500'}`}>
                              {n.message}
                            </p>
                            <p className="text-xs text-gray-400 mt-1">
                              {new Date(n.created_at).toLocaleDateString('th-TH', {
                                month: 'short', day: 'numeric',
                                hour: '2-digit', minute: '2-digit'
                              })}
                            </p>
                          </div>
                        </button>
                      ))
                    )}
                  </div>

                  {/* Footer */}
                  {notifications.length > 0 && (
                      <div className="px-4 py-2.5 border-t border-gray-100">
                        <button
                          onClick={() => { router.push('/notifications'); setNotifOpen(false) }}
                          className="w-full text-center text-xs text-blue-600 hover:underline">
                          ดูทั้งหมด
                        </button>
                      </div>
                    )}
                </div>
              </>
            )}
          </div>

          {/* User dropdown */}
          <div className="relative">
            <button onClick={() => { setUserMenuOpen(!userMenuOpen); setNotifOpen(false) }}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors">
              <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold">
                {user.firstname[0]}
              </div>
              <span className="text-sm font-medium text-gray-700 hidden sm:block">{user.firstname}</span>
              <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {userMenuOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setUserMenuOpen(false)} />
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-20">
                  <div className="px-4 py-2 border-b border-gray-100 mb-1">
                    <p className="text-sm font-semibold text-gray-800">{user.firstname} {user.lastname}</p>
                    <p className="text-xs text-gray-400 truncate">{user.email}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium mt-1.5 inline-block ${roleBadgeColor[user.role] || 'bg-gray-100 text-gray-600'}`}>
                      {roleLabel[user.role] || user.role}
                    </span>
                  </div>
                  <button
                    onClick={() => { setUserMenuOpen(false); router.push('/profile') }}
                    className="w-full text-left px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 transition-colors">
                    จัดการโปรไฟล์
                  </button>
                  <button
                    onClick={() => { setUserMenuOpen(false); router.push("/notification-settings") }}
                    className="w-full text-left px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 transition-colors">
                    ตั้งค่าแจ้งเตือน
                  </button>
                  <button
                    onClick={() => { logout(); router.push('/login') }}
                    className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-red-50 transition-colors">
                    ออกจากระบบ
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}