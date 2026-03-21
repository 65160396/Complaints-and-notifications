'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import api, { getUser } from '../lib/api'

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

const ALLOWED_ROLES = ['personnel', 'samo', 'officer', 'admin']

const statusConfig: Record<string, { label: string; color: string; icon: string }> = {
  pending:     { label: 'รอดำเนินการ',    color: 'bg-yellow-100 text-yellow-800 border-yellow-200', icon: '⏳' },
  in_progress: { label: 'กำลังดำเนินการ', color: 'bg-blue-100 text-blue-800 border-blue-200',       icon: '🔧' },
  resolved:    { label: 'แก้ไขแล้ว',      color: 'bg-green-100 text-green-800 border-green-200',    icon: '✅' },
  cancelled:   { label: 'ยกเลิกแล้ว',     color: 'bg-gray-100 text-gray-500 border-gray-200',      icon: '❌' },
}

const priorityConfig: Record<string, { label: string; color: string; icon: string }> = {
  low:    { label: 'ต่ำ',      color: 'bg-gray-100 text-gray-600',    icon: '🟢' },
  medium: { label: 'ปานกลาง', color: 'bg-orange-100 text-orange-700', icon: '🟡' },
  high:   { label: 'สูง',      color: 'bg-red-100 text-red-700',      icon: '🔴' },
}

const nextStatus: Record<string, { value: string; label: string }> = {
  pending:     { value: 'in_progress', label: 'เริ่มดำเนินการ' },
  in_progress: { value: 'resolved',    label: 'แก้ไขเสร็จแล้ว' },
}

const filterTabs = [
  { key: 'all',         label: 'ทั้งหมด' },
  { key: 'pending',     label: '⏳ รอดำเนินการ' },
  { key: 'in_progress', label: '🔧 กำลังดำเนินการ' },
  { key: 'resolved',    label: '✅ แก้ไขแล้ว' },
]

// Priority dropdown component
function PrioritySelector({ issueId, current, onUpdate }: {
  issueId: number
  current: string
  onUpdate: (id: number, priority: string) => void
}) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const cfg = priorityConfig[current] || priorityConfig['medium']

  const handleSelect = async (priority: string) => {
    if (priority === current) { setOpen(false); return }
    setLoading(true)
    try {
      await api.patch(`/complaints/${issueId}/priority`, { priority })
      onUpdate(issueId, priority)
    } catch {
      alert('เกิดข้อผิดพลาด กรุณาลองใหม่')
    } finally {
      setLoading(false)
      setOpen(false)
    }
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        disabled={loading}
        className={`text-xs px-2.5 py-1.5 rounded-lg font-medium border flex items-center gap-1 transition-colors hover:opacity-80 ${cfg.color}`}
      >
        {loading ? '...' : <>{cfg.icon} {cfg.label} ▾</>}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 mt-1 w-32 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-20">
            {Object.entries(priorityConfig).map(([key, p]) => (
              <button
                key={key}
                onClick={() => handleSelect(key)}
                className={`w-full text-left px-3 py-2 text-xs flex items-center gap-2 hover:bg-gray-50 transition-colors
                  ${key === current ? 'font-semibold' : ''}`}
              >
                {p.icon} {p.label}
                {key === current && <span className="ml-auto text-blue-500">✓</span>}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

export default function DashboardPage() {
  const router = useRouter()
  const [complaints, setComplaints] = useState<Complaint[]>([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState('all')
  const [updatingId, setUpdatingId] = useState<number | null>(null)
  const user = getUser()

  useEffect(() => {
    if (!user) { router.push('/login'); return }
    if (!ALLOWED_ROLES.includes(user.role)) { router.push('/complaints'); return }

    api.get('/complaints')
      .then(res => setComplaints(res.data))
      .catch(() => router.push('/login'))
      .finally(() => setLoading(false))
  }, [])

  const handleUpdateStatus = async (issueId: number, newStatus: string) => {
    setUpdatingId(issueId)
    try {
      await api.patch(`/complaints/${issueId}/status`, { status: newStatus })
      setComplaints(prev =>
        prev.map(c => c.issue_id === issueId ? { ...c, status: newStatus } : c)
      )
    } catch {
      alert('เกิดข้อผิดพลาด กรุณาลองใหม่')
    } finally {
      setUpdatingId(null)
    }
  }

  // D8 — อัปเดต priority ใน state
  const handleUpdatePriority = (issueId: number, priority: string) => {
    setComplaints(prev =>
      prev.map(c => c.issue_id === issueId ? { ...c, priority } : c)
    )
  }

  const filtered = filterStatus === 'all'
    ? complaints
    : complaints.filter(c => c.status === filterStatus)

  const stats = {
    total:       complaints.length,
    pending:     complaints.filter(c => c.status === 'pending').length,
    in_progress: complaints.filter(c => c.status === 'in_progress').length,
    resolved:    complaints.filter(c => c.status === 'resolved').length,
  }

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
      <div className="max-w-5xl mx-auto px-4 py-8">

        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Dashboard ภาพรวม</h1>
          <p className="text-gray-400 text-sm mt-1">สวัสดี {user?.firstname} — ดูและจัดการคำร้องทั้งหมดในระบบ</p>
        </div>

        {/* Stats cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'คำร้องทั้งหมด',  value: stats.total,       color: 'text-gray-800',   bg: 'bg-white',     border: 'border-gray-100',   icon: '📋' },
            { label: 'รอดำเนินการ',    value: stats.pending,     color: 'text-yellow-700', bg: 'bg-yellow-50', border: 'border-yellow-100', icon: '⏳' },
            { label: 'กำลังดำเนินการ', value: stats.in_progress, color: 'text-blue-700',   bg: 'bg-blue-50',   border: 'border-blue-100',   icon: '🔧' },
            { label: 'แก้ไขแล้ว',     value: stats.resolved,    color: 'text-green-700',  bg: 'bg-green-50',  border: 'border-green-100',  icon: '✅' },
          ].map(s => (
            <div key={s.label} className={`${s.bg} border ${s.border} rounded-2xl p-5`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-2xl">{s.icon}</span>
                <span className={`text-3xl font-bold ${s.color}`}>{s.value}</span>
              </div>
              <p className="text-sm text-gray-500">{s.label}</p>
              <div className="mt-3 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${
                    s.label === 'รอดำเนินการ' ? 'bg-yellow-400' :
                    s.label === 'กำลังดำเนินการ' ? 'bg-blue-400' :
                    s.label === 'แก้ไขแล้ว' ? 'bg-green-400' : 'bg-gray-300'
                  }`}
                  style={{ width: stats.total > 0 ? `${(s.value / stats.total) * 100}%` : '0%' }}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Filter */}
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
            <p className="text-4xl mb-3">📭</p>
            <p className="text-gray-400">ไม่มีรายการในหมวดนี้</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(c => {
              const sCfg = statusConfig[c.status] || statusConfig['pending']
              const next = nextStatus[c.status]
              const isUpdating = updatingId === c.issue_id

              return (
                <div key={c.issue_id} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
                  <div className="flex justify-between items-start gap-4">

                    {/* Left */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                        <span className="text-xs text-gray-400">#{c.issue_id}</span>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                          {c.category_name}
                        </span>
                      </div>
                      <h2 className="font-semibold text-gray-800 leading-snug">{c.title}</h2>
                      {c.description && (
                        <p className="text-sm text-gray-400 mt-1 line-clamp-1">{c.description}</p>
                      )}
                      <div className="flex gap-3 mt-2 text-xs text-gray-400 flex-wrap">
                        <span>👤 {c.firstname} {c.lastname}</span>
                        <span>📍 {c.building} ชั้น {c.floor} ห้อง {c.room}</span>
                        <span>🕐 {new Date(c.created_at).toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                      </div>
                    </div>

                    {/* Right — status + priority + action */}
                    <div className="flex flex-col items-end gap-2 shrink-0">
                      {/* Status badge */}
                      <span className={`text-xs px-3 py-1.5 rounded-full font-medium border whitespace-nowrap ${sCfg.color}`}>
                        {sCfg.icon} {sCfg.label}
                      </span>

                      {/* D8 — Priority selector */}
                      <PrioritySelector
                        issueId={c.issue_id}
                        current={c.priority}
                        onUpdate={handleUpdatePriority}
                      />

                      {/* D4 — เปลี่ยนสถานะ */}
                      {next && (
                        <button
                          onClick={() => handleUpdateStatus(c.issue_id, next.value)}
                          disabled={isUpdating}
                          className="text-xs px-3 py-1.5 rounded-xl font-medium bg-blue-600 hover:bg-blue-700 text-white transition-colors whitespace-nowrap disabled:opacity-50"
                        >
                          {isUpdating ? 'กำลังบันทึก...' : next.label}
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