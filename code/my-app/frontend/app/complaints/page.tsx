'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import api from '../lib/api'

interface Complaint {
  issue_id: number
  title: string
  description: string
  status: string
  priority: string
  category_name: string
  building: string
  floor: string
  room: string
  firstname: string
  lastname: string
  created_at: string
}

const statusLabel: Record<string, string> = {
  pending: 'รอดำเนินการ',
  in_progress: 'กำลังดำเนินการ',
  resolved: 'แก้ไขแล้ว',
}

const statusColor: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  in_progress: 'bg-blue-100 text-blue-800',
  resolved: 'bg-green-100 text-green-800',
}

const priorityColor: Record<string, string> = {
  low: 'bg-gray-100 text-gray-700',
  medium: 'bg-orange-100 text-orange-700',
  high: 'bg-red-100 text-red-700',
}

const priorityLabel: Record<string, string> = {
  low: 'ต่ำ',
  medium: 'ปานกลาง',
  high: 'สูง',
}

export default function ComplaintsPage() {
  const router = useRouter()
  const [complaints, setComplaints] = useState<Complaint[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/complaints')
      .then(res => setComplaints(res.data))
      .catch(() => router.push('/login'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-gray-500">กำลังโหลด...</p>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">รายการแจ้งเรื่อง</h1>
          <button
            onClick={() => router.push('/create-complaint')}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            + แจ้งเรื่องใหม่
          </button>
        </div>

        {complaints.length === 0 ? (
          <div className="bg-white rounded-xl shadow p-8 text-center text-gray-400">
            ยังไม่มีรายการแจ้งเรื่อง
          </div>
        ) : (
          <div className="space-y-4">
            {complaints.map(c => (
              <div key={c.issue_id} className="bg-white rounded-xl shadow p-5">
                <div className="flex justify-between items-start gap-4">
                  <div className="flex-1">
                    <h2 className="font-semibold text-lg">{c.title}</h2>
                    <p className="text-gray-500 text-sm mt-1">{c.description}</p>
                    <div className="flex gap-2 mt-2 text-xs text-gray-400 flex-wrap">
                      <span>📁 {c.category_name}</span>
                      <span>📍 {c.building} ชั้น {c.floor} ห้อง {c.room}</span>
                      <span>👤 {c.firstname} {c.lastname}</span>
                      <span>🕐 {new Date(c.created_at).toLocaleDateString('th-TH')}</span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 items-end">
                    <span className={`text-xs px-3 py-1 rounded-full font-medium ${statusColor[c.status] || 'bg-gray-100 text-gray-700'}`}>
                      {statusLabel[c.status] || c.status}
                    </span>
                    <span className={`text-xs px-3 py-1 rounded-full font-medium ${priorityColor[c.priority] || 'bg-gray-100 text-gray-700'}`}>
                      ความเร่งด่วน: {priorityLabel[c.priority] || c.priority}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}