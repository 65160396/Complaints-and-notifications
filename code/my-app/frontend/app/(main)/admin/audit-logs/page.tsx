'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import api, { getUser } from '../../../lib/api'

interface AuditLog {
  log_id: number
  admin_id: number
  action: string
  target_user_id: number | null
  detail: string
  created_at: string
  admin_firstname: string
  admin_lastname: string
}

export default function AdminAuditLogsPage() {
  const router = useRouter()
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const user = getUser()
    if (!user || user.role !== 'admin') {
      router.push('/login')
      return
    }
    fetchLogs()
  }, [])

  const fetchLogs = async () => {
    setLoading(true)
    try {
      const res = await api.get('/users/audit-logs')
      setAuditLogs(res.data)
    } catch {
      router.push('/login')
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" /></div>

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800">📝 Audit Log</h1>
          <p className="text-gray-400 text-sm mt-1">ประวัติการดำเนินการของผู้ดูแลระบบ</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-4 py-3 text-xs text-gray-500 font-medium">เวลา</th>
                <th className="text-left px-4 py-3 text-xs text-gray-500 font-medium">Admin</th>
                <th className="text-left px-4 py-3 text-xs text-gray-500 font-medium">การกระทำ</th>
                <th className="text-left px-4 py-3 text-xs text-gray-500 font-medium">รายละเอียด</th>
              </tr>
            </thead>
            <tbody>
              {auditLogs.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-10 text-center text-gray-400">ยังไม่มีประวัติการดำเนินการ</td>
                </tr>
              ) : auditLogs.map(log => (
                <tr key={log.log_id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="px-4 py-3 text-xs text-gray-400">
                    {new Date(log.created_at).toLocaleDateString('th-TH', {
                      year: 'numeric', month: 'short', day: 'numeric',
                      hour: '2-digit', minute: '2-digit'
                    })}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-600">{log.admin_firstname} {log.admin_lastname}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                      log.action === 'DISABLE_USER' ? 'bg-red-100 text-red-600' :
                      log.action === 'ENABLE_USER' ? 'bg-green-100 text-green-600' :
                      'bg-blue-100 text-blue-600'
                    }`}>
                      {log.action}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500">{log.detail}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}