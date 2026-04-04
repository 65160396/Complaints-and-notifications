'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import api, { getUser } from '../../../lib/api'

interface SystemLog {
  log_id: number
  type: string
  message: string
  detail: string | null
  ip_address: string | null
  created_at: string
  firstname: string | null
  lastname: string | null
}

export default function AdminSystemLogsPage() {
  const router = useRouter()
  const [systemLogs, setSystemLogs] = useState<SystemLog[]>([])
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
      const res = await api.get('/users/system-logs')
      setSystemLogs(res.data)
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
          <h1 className="text-2xl font-bold text-gray-800">🖥️ System Log</h1>
          <p className="text-gray-400 text-sm mt-1">ติดตามเหตุการณ์และปัญหาทางเทคนิคในระบบ</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-4 py-3 text-xs text-gray-500 font-medium">เวลา</th>
                <th className="text-left px-4 py-3 text-xs text-gray-500 font-medium">ประเภท</th>
                <th className="text-left px-4 py-3 text-xs text-gray-500 font-medium">ข้อความ</th>
                <th className="text-left px-4 py-3 text-xs text-gray-500 font-medium">IP</th>
              </tr>
            </thead>
            <tbody>
              {systemLogs.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-10 text-center text-gray-400">ยังไม่มี System Log</td>
                </tr>
              ) : systemLogs.map(log => (
                <tr key={log.log_id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="px-4 py-3 text-xs text-gray-400">
                    {new Date(log.created_at).toLocaleDateString('th-TH', {
                      year: 'numeric', month: 'short', day: 'numeric',
                      hour: '2-digit', minute: '2-digit'
                    })}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                      log.type === 'LOGIN_FAILED' ? 'bg-red-100 text-red-600' :
                      log.type === 'ERROR' ? 'bg-orange-100 text-orange-600' :
                      log.type === 'WARNING' ? 'bg-yellow-100 text-yellow-600' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      {log.type}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-600">{log.message}</td>
                  <td className="px-4 py-3 text-xs text-gray-400">{log.ip_address || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}