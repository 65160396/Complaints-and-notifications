'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import api, { getUser } from '../../lib/api'

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
  accepted_by: number | null
  accepted_firstname: string | null
  accepted_lastname: string | null
  assigned_to: number | null
}

const statusConfig: Record<string, { label: string; color: string; icon: string }> = {
  pending:     { label: 'รอดำเนินการ',         color: 'bg-yellow-100 text-yellow-800', icon: '⏳' },
  in_progress: { label: 'กำลังดำเนินการ',      color: 'bg-blue-100 text-blue-800',     icon: '🔧' },
  resolved:    { label: 'แก้ไขแล้ว',           color: 'bg-green-100 text-green-800',   icon: '✅' },
  forwarded:   { label: 'ส่งต่อส่วนกลางแล้ว', color: 'bg-purple-100 text-purple-800', icon: '📤' },
  cancelled:   { label: 'ยกเลิกแล้ว',          color: 'bg-gray-100 text-gray-500',    icon: '❌' },
}

const priorityConfig: Record<string, { label: string; color: string }> = {
  low:    { label: 'ต่ำ',      color: 'bg-gray-100 text-gray-600' },
  medium: { label: 'ปานกลาง', color: 'bg-orange-100 text-orange-700' },
  high:   { label: 'สูง',      color: 'bg-red-100 text-red-700' },
}

const filterTabs = [
  { key: 'all',         label: 'ทั้งหมด' },
  { key: 'pending',     label: '⏳ รอดำเนินการ' },
  { key: 'in_progress', label: '🔧 กำลังดำเนินการ' },
  { key: 'resolved',    label: '✅ แก้ไขแล้ว' },
]

export default function ComplaintsPage() {
  const router = useRouter()
  const [complaints, setComplaints] = useState<Complaint[]>([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState('all')
  const user = getUser()
  const [updatingId, setUpdatingId] = useState<number | null>(null)

  const handleUpdateStatus = async (issueId: number, newStatus: string) => {
    setUpdatingId(issueId)
    try {
      await api.patch(`/complaints/${issueId}/status`, { status: newStatus })
      setComplaints(prev => prev.map(c => c.issue_id === issueId ? { ...c, status: newStatus } : c))
    } catch { alert('เกิดข้อผิดพลาด') }
    finally { setUpdatingId(null) }
  }

  // samo/officer/admin ไม่ควรอยู่หน้านี้ → redirect ไป dashboard
  useEffect(() => {
    if (!user) { router.push('/login'); return }
    if (['samo', 'officer', 'admin'].includes(user.role)) {
      router.replace('/dashboard')
      return
    }
    api.get('/complaints')
      .then(res => setComplaints(res.data))
      .catch(() => router.push('/login'))
      .finally(() => setLoading(false))
  }, [])

  const filtered = filterStatus === 'all'
    ? complaints
    : complaints.filter(c => c.status === filterStatus)

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
      <div className="max-w-4xl mx-auto px-4 py-8">

        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">รายการแจ้งเรื่อง</h1>
            <p className="text-gray-400 text-sm mt-1">รายการคำร้องทั้งหมดในระบบ</p>
          </div>
          {/* ปุ่มแจ้งเรื่อง เฉพาะ student และ personnel */}
          {['student', 'personnel'].includes(user?.role) && (
            <button
              onClick={() => router.push('/create-complaint')}
              className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              + แจ้งเรื่องใหม่
            </button>
          )}
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
          {filterTabs.map(f => (
            <button key={f.key} onClick={() => setFilterStatus(f.key)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all border
                ${filterStatus === f.key
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'}`}>
              {f.label}
              {f.key !== 'all' && (
                <span className="ml-1.5 text-xs opacity-70">
                  ({complaints.filter(c => c.status === f.key).length})
                </span>
              )}
            </button>
          ))}
        </div>

        {/* List */}
        {filtered.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
            <p className="text-4xl mb-3">📋</p>
            <p className="text-gray-400">ยังไม่มีรายการแจ้งเรื่อง</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(c => {
              console.log('accepted_by:', c.accepted_by, 'user.id:', user?.id)
              const sCfg = statusConfig[c.status] || statusConfig['pending']
              const pCfg = priorityConfig[c.priority] || priorityConfig['medium']
              return (
                <div key={c.issue_id} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="text-xs text-gray-400">#{c.issue_id}</span>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">
                          {c.category_name}
                        </span>
                      </div>
                      <h2 className="font-semibold text-gray-800">{c.title}</h2>
                      {c.description && (
                        <p className="text-sm text-gray-400 mt-1 line-clamp-1">{c.description}</p>
                      )}
                      <div className="flex gap-3 mt-2 text-xs text-gray-400 flex-wrap">
                        <span>👤 {c.firstname} {c.lastname}</span>
                        <span>📍 {c.building} ชั้น {c.floor} ห้อง {c.room}</span>
                        <span>🕐 {new Date(c.created_at).toLocaleDateString('th-TH', {
                          year: 'numeric', month: 'short', day: 'numeric'
                        })}</span>
                      </div>
                      {c.accepted_by && (
                        <p className="text-xs text-blue-500 mt-1.5">
                          ✋ รับเรื่องโดย {c.accepted_firstname} {c.accepted_lastname}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-col gap-2 items-end shrink-0">
                      <span className={`text-xs px-3 py-1.5 rounded-full font-medium whitespace-nowrap ${sCfg.color}`}>
                        {sCfg.icon} {sCfg.label}
                      </span>
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${pCfg.color}`}>
                        {pCfg.label}
                      </span>

                      {/* ✅ เพิ่ม — บุคลากรที่ได้รับมอบหมาย */}
                      {user?.role === 'personnel' && c.assigned_to === user?.id && c.status === 'in_progress' && (
                        <button
                          onClick={() => handleUpdateStatus(c.issue_id, 'resolved')}
                          disabled={updatingId === c.issue_id}
                          className="text-xs px-3 py-1.5 rounded-xl font-medium bg-green-600 hover:bg-green-700 text-white disabled:opacity-50">
                          {updatingId === c.issue_id ? 'กำลังบันทึก...' : '✅ แก้ไขเสร็จสิ้น'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}