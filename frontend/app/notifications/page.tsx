'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import api, { getUser } from '../lib/api'

interface Notification {
  notification_id: number
  message: string
  is_read: number
  issue_id: number | null
  issue_title: string | null
  created_at: string
}

export default function NotificationsPage() {
  const router = useRouter()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const user = getUser()
    if (!user) { router.push('/login'); return }

    api.get('/notifications')
      .then(res => setNotifications(res.data))
      .catch(() => router.push('/login'))
      .finally(() => setLoading(false))
  }, [])

  const handleMarkRead = async (notifId: number) => {
    try {
      await api.patch(`/notifications/${notifId}/read`)
      setNotifications(prev =>
        prev.map(n => n.notification_id === notifId ? { ...n, is_read: 1 } : n)
      )
    } catch {}
  }

  const handleMarkAllRead = async () => {
    try {
      await api.patch('/notifications/read-all')
      setNotifications(prev => prev.map(n => ({ ...n, is_read: 1 })))
    } catch {}
  }

  const unreadCount = notifications.filter(n => !n.is_read).length

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-gray-400 text-sm">กำลังโหลด...</p>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-8">

        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">การแจ้งเตือน</h1>
            {unreadCount > 0 && (
              <p className="text-sm text-gray-400 mt-1">ยังไม่ได้อ่าน {unreadCount} รายการ</p>
            )}
          </div>
          {unreadCount > 0 && (
            <button onClick={handleMarkAllRead}
              className="text-sm text-blue-600 hover:underline font-medium">
              อ่านทั้งหมด
            </button>
          )}
        </div>

        {/* List */}
        {notifications.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-16 text-center">
            <p className="text-5xl mb-3">🔕</p>
            <p className="text-gray-400">ยังไม่มีการแจ้งเตือน</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
            {notifications.map((n, i) => (
              <div
                key={n.notification_id}
                onClick={() => {
                        if (!n.is_read) handleMarkRead(n.notification_id)
                        
                        const user = getUser()
                        console.log('user role:', user?.role)
                        if (n.issue_id) {
                          if (user?.role === 'student' || user?.role === 'personnel') {
                            router.push('/my-complaints')
                          } else {
                            // samo, officer, admin
                            router.push('/dashboard')
                          }
                        } else {
                          router.push('/dashboard')
                        }
                      }}
                className={`flex gap-4 px-5 py-4 cursor-pointer hover:bg-gray-50 transition-colors
                  ${i !== 0 ? 'border-t border-gray-50' : ''}
                  ${!n.is_read ? 'bg-blue-50/40' : ''}`}
              >
                {/* Dot */}
                <div className="mt-1 shrink-0">
                  {!n.is_read
                    ? <div className="w-2.5 h-2.5 rounded-full bg-blue-500 mt-1" />
                    : <div className="w-2.5 h-2.5 rounded-full bg-gray-200 mt-1" />
                  }
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <p className={`text-sm leading-snug ${!n.is_read ? 'font-medium text-gray-800' : 'text-gray-500'}`}>
                    {n.message}
                  </p>
                  <p className="text-xs text-gray-400 mt-1.5">
                    {new Date(n.created_at).toLocaleDateString('th-TH', {
                      year: 'numeric', month: 'long', day: 'numeric',
                      hour: '2-digit', minute: '2-digit'
                    })}
                  </p>
                </div>

                {/* Mark read button */}
                {!n.is_read && (
                  <button
                    onClick={e => { e.stopPropagation(); handleMarkRead(n.notification_id) }}
                    className="shrink-0 text-xs text-blue-500 hover:underline self-center"
                  >
                    อ่านแล้ว
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}