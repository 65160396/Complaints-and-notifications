'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import api, { getUser } from '../../../lib/api'

interface Complaint {
  issue_id: number
  title: string
  status: string
  priority: string
  category_name: string
  department_name: string
  firstname: string
  lastname: string
  created_at: string
}

const statusConfig: Record<string, { label: string; color: string }> = {
  pending: { label: 'รอดำเนินการ', color: 'bg-yellow-100 text-yellow-800' },
  in_progress: { label: 'กำลังดำเนินการ', color: 'bg-blue-100 text-blue-800' },
  resolved: { label: 'แก้ไขแล้ว', color: 'bg-green-100 text-green-800' },
  forwarded: { label: 'ส่งต่อแล้ว', color: 'bg-purple-100 text-purple-800' },
  cancelled: { label: 'ยกเลิกแล้ว', color: 'bg-gray-100 text-gray-500' },
}

export default function AdminComplaintsPage() {
  const router = useRouter()
  const [complaints, setComplaints] = useState<Complaint[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const user = getUser()
    if (!user || user.role !== 'admin') {
      router.push('/login')
      return
    }
    fetchComplaints()
  }, [])

  const fetchComplaints = async () => {
    setLoading(true)
    try {
      const res = await api.get('/complaints')
      setComplaints(res.data)
    } catch {
      router.push('/login')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800">📋 คำร้องทั้งหมด</h1>
          <p className="text-gray-400 text-sm mt-1">ตรวจสอบรายการคำร้องทั้งหมดในระบบ</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-4 py-3 text-xs text-gray-500 font-medium">#</th>
                <th className="text-left px-4 py-3 text-xs text-gray-500 font-medium">หัวข้อ</th>
                <th className="text-left px-4 py-3 text-xs text-gray-500 font-medium">คณะ</th>
                <th className="text-left px-4 py-3 text-xs text-gray-500 font-medium">ผู้แจ้ง</th>
                <th className="text-left px-4 py-3 text-xs text-gray-500 font-medium">สถานะ</th>
                <th className="text-left px-4 py-3 text-xs text-gray-500 font-medium">วันที่</th>
              </tr>
            </thead>
            <tbody>
              {complaints.map(c => {
                const sCfg = statusConfig[c.status] || statusConfig.pending
                return (
                  <tr key={c.issue_id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-400 text-xs">#{c.issue_id}</td>
                    <td className="px-4 py-3 font-medium text-gray-800">{c.title}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{c.department_name || '-'}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{c.firstname} {c.lastname}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${sCfg.color}`}>{sCfg.label}</span>
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-xs">
                      {new Date(c.created_at).toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric' })}
                    </td>
                  </tr>
                )
              })}
              {complaints.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-gray-400">ยังไม่มีคำร้องในระบบ</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}