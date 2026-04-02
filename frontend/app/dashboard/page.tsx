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
  category_id: number
  category_name: string
  department_name: string
  firstname: string
  lastname: string
  created_at: string
  accepted_by: number | null
  accepted_firstname: string | null
  accepted_lastname: string | null
  forwarded_note: string | null
}

interface Category { category_id: number; category_name: string }
interface DeptUser  { user_id: number; firstname: string; lastname: string; role: string }

const ALLOWED_ROLES = ['samo', 'officer', 'admin']

const statusConfig: Record<string, { label: string; color: string; icon: string }> = {
  pending:     { label: 'รอดำเนินการ',         color: 'bg-yellow-100 text-yellow-800 border-yellow-200', icon: '⏳' },
  in_progress: { label: 'กำลังดำเนินการ',      color: 'bg-blue-100 text-blue-800 border-blue-200',       icon: '🔧' },
  resolved:    { label: 'แก้ไขแล้ว',           color: 'bg-green-100 text-green-800 border-green-200',    icon: '✅' },
  forwarded:   { label: 'ส่งต่อส่วนกลางแล้ว', color: 'bg-purple-100 text-purple-800 border-purple-200', icon: '📤' },
  cancelled:   { label: 'ยกเลิกแล้ว',          color: 'bg-gray-100 text-gray-500 border-gray-200',      icon: '❌' },
}

const priorityConfig: Record<string, { label: string; color: string; icon: string }> = {
  low:    { label: 'ต่ำ',      color: 'bg-gray-100 text-gray-600',    icon: '🟢' },
  medium: { label: 'ปานกลาง', color: 'bg-orange-100 text-orange-700', icon: '🟡' },
  high:   { label: 'สูง',      color: 'bg-red-100 text-red-700',      icon: '🔴' },
}

// Modal มอบหมายงาน — US7
function AssignModal({ issue, deptUsers, onClose, onAssigned }: {
  issue: Complaint
  deptUsers: DeptUser[]
  onClose: () => void
  onAssigned: (issueId: number, name: string) => void
}) {
  const [selectedUserId, setSelectedUserId] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async () => {
    if (!selectedUserId) { setError('กรุณาเลือกผู้รับผิดชอบ'); return }
    setLoading(true)
    try {
      const res = await api.patch(`/complaints/${issue.issue_id}/assign`, { assigned_to: selectedUserId })
      onAssigned(issue.issue_id, res.data.assigned_to)
      onClose()
    } catch (err: any) {
      setError(err?.response?.data?.message || 'เกิดข้อผิดพลาด')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl">
        <h2 className="font-bold text-gray-800 text-lg mb-1">มอบหมายงาน</h2>
        <p className="text-sm text-gray-400 mb-5">คำร้อง: {issue.title}</p>

        <label className="text-xs text-gray-500 mb-1 block">เลือกผู้รับผิดชอบ *</label>
        <select
          className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-blue-100 bg-white"
          value={selectedUserId}
          onChange={e => setSelectedUserId(e.target.value)}
        >
          <option value="">เลือกบุคคล</option>
          {deptUsers.map(u => (
            <option key={u.user_id} value={u.user_id}>
              {u.firstname} {u.lastname} ({u.role})
            </option>
          ))}
        </select>

        {error && <p className="text-xs text-red-500 mb-3">{error}</p>}

        <div className="flex gap-3">
          <button onClick={onClose}
            className="flex-1 border border-gray-200 rounded-xl py-2.5 text-sm text-gray-600 hover:bg-gray-50">
            ยกเลิก
          </button>
          <button onClick={handleSubmit} disabled={loading}
            className="flex-1 bg-blue-600 text-white rounded-xl py-2.5 text-sm font-semibold hover:bg-blue-700 disabled:opacity-50">
            {loading ? 'กำลังบันทึก...' : 'มอบหมาย'}
          </button>
        </div>
      </div>
    </div>
  )
}

// Modal ส่งต่อ Officer — US8
function ForwardModal({ issue, onClose, onForwarded }: {
  issue: Complaint
  onClose: () => void
  onForwarded: (issueId: number) => void
}) {
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async () => {
    if (!note.trim()) { setError('กรุณาระบุเหตุผลในการส่งต่อ'); return }
    setLoading(true)
    try {
      await api.patch(`/complaints/${issue.issue_id}/forward`, { note })
      onForwarded(issue.issue_id)
      onClose()
    } catch (err: any) {
      setError(err?.response?.data?.message || 'เกิดข้อผิดพลาด')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl">
        <h2 className="font-bold text-gray-800 text-lg mb-1">📤 ส่งต่อเจ้าหน้าที่มหาวิทยาลัย</h2>
        <p className="text-sm text-gray-400 mb-5">คำร้อง: {issue.title}</p>

        <label className="text-xs text-gray-500 mb-1 block">เหตุผลในการส่งต่อ *</label>
        <textarea
          rows={4}
          placeholder="อธิบายเหตุผลที่ต้องส่งต่อให้เจ้าหน้าที่ส่วนกลางทราบ เช่น ปัญหาเกินขอบเขตของคณะ ต้องใช้งบประมาณพิเศษ"
          className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-blue-100 resize-none"
          value={note}
          onChange={e => setNote(e.target.value)}
        />

        {error && <p className="text-xs text-red-500 mb-3">{error}</p>}

        <div className="bg-yellow-50 border border-yellow-200 rounded-xl px-4 py-3 mb-4">
          <p className="text-xs text-yellow-700">⚠️ เมื่อส่งต่อแล้ว สิทธิ์จัดการจะถูกโอนไปยังเจ้าหน้าที่มหาวิทยาลัย คุณจะดูได้อย่างเดียว</p>
        </div>

        <div className="flex gap-3">
          <button onClick={onClose}
            className="flex-1 border border-gray-200 rounded-xl py-2.5 text-sm text-gray-600 hover:bg-gray-50">
            ยกเลิก
          </button>
          <button onClick={handleSubmit} disabled={loading}
            className="flex-1 bg-purple-600 text-white rounded-xl py-2.5 text-sm font-semibold hover:bg-purple-700 disabled:opacity-50">
            {loading ? 'กำลังส่งต่อ...' : 'ยืนยันส่งต่อ'}
          </button>
        </div>
      </div>
    </div>
  )
}

function CategorySelector({ issueId, currentId, currentName, categories, onUpdate }: {
  issueId: number; currentId: number; currentName: string
  categories: Category[]; onUpdate: (id: number, catId: number, catName: string) => void
}) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSelect = async (cat: Category) => {
    if (cat.category_id === currentId) { setOpen(false); return }
    setLoading(true)
    try {
      await api.patch(`/complaints/${issueId}/category`, { category_id: cat.category_id })
      onUpdate(issueId, cat.category_id, cat.category_name)
    } catch { alert('เกิดข้อผิดพลาด') }
    finally { setLoading(false); setOpen(false) }
  }

  return (
    <div className="relative inline-block">
      <button onClick={() => setOpen(!open)} disabled={loading}
        className="text-xs px-2.5 py-1 rounded-lg border border-gray-200 bg-gray-50 text-gray-600 hover:border-blue-300 hover:text-blue-600 transition-colors flex items-center gap-1">
        {loading ? '...' : <>{currentName} ✏️</>}
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute left-0 mt-1 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-20">
            <p className="text-xs text-gray-400 px-3 py-1.5 border-b border-gray-50">เลือกหมวดหมู่ที่ถูกต้อง</p>
            {categories.map(cat => (
              <button key={cat.category_id} onClick={() => handleSelect(cat)}
                className={`w-full text-left px-3 py-2 text-xs hover:bg-gray-50 ${cat.category_id === currentId ? 'font-semibold text-blue-600' : 'text-gray-700'}`}>
                {cat.category_name} {cat.category_id === currentId && '✓'}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

function PrioritySelector({ issueId, current, onUpdate, canEdit }: {
  issueId: number; current: string; onUpdate: (id: number, p: string) => void; canEdit: boolean
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
    } catch { alert('เกิดข้อผิดพลาด') }
    finally { setLoading(false); setOpen(false) }
  }

  // read-only badge เมื่อไม่มีสิทธิ์แก้
  if (!canEdit) {
    return (
      <span className={`text-xs px-2.5 py-1.5 rounded-lg font-medium border ${cfg.color}`}>
        {cfg.icon} {cfg.label}
      </span>
    )
  }

  return (
    <div className="relative">
      <button onClick={() => setOpen(!open)} disabled={loading}
        className={`text-xs px-2.5 py-1.5 rounded-lg font-medium border flex items-center gap-1 hover:opacity-80 ${cfg.color}`}>
        {loading ? '...' : <>{cfg.icon} {cfg.label} ▾</>}
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 mt-1 w-32 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-20">
            {Object.entries(priorityConfig).map(([key, p]) => (
              <button key={key} onClick={() => handleSelect(key)}
                className={`w-full text-left px-3 py-2 text-xs flex items-center gap-2 hover:bg-gray-50 ${key === current ? 'font-semibold' : ''}`}>
                {p.icon} {p.label} {key === current && <span className="ml-auto text-blue-500">✓</span>}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

const filterTabs = [
  { key: 'all',         label: 'ทั้งหมด' },
  { key: 'pending',     label: '⏳ รอดำเนินการ' },
  { key: 'in_progress', label: '🔧 กำลังดำเนินการ' },
  { key: 'resolved',    label: '✅ แก้ไขแล้ว' },
  { key: 'forwarded',   label: '📤 ส่งต่อแล้ว' },
]

export default function DashboardPage() {
  const router = useRouter()
  const [complaints, setComplaints] = useState<Complaint[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [deptUsers, setDeptUsers] = useState<DeptUser[]>([])
  const [loading, setLoading] = useState(true)
  const user = getUser()
  const [filterStatus, setFilterStatus] = useState(user?.role === 'officer' ? 'forwarded' : 'all')
  const [updatingId, setUpdatingId] = useState<number | null>(null)
  const [acceptingId, setAcceptingId] = useState<number | null>(null)
  const [assignModal, setAssignModal] = useState<Complaint | null>(null)
  const [forwardModal, setForwardModal] = useState<Complaint | null>(null)

  useEffect(() => {
    if (!user) { router.push('/login'); return }
    if (user.role === 'student') { router.push('/my-complaints'); return }
    if (user.role === 'personnel') { router.push('/complaints'); return }
    if (!ALLOWED_ROLES.includes(user.role)) { router.push('/login'); return }

    const isSamo = user.role === 'samo'
    const endpoint = isSamo ? '/complaints/dept' : '/complaints'

    const requests = [
      api.get(endpoint),
      api.get('/categories/all'),
      isSamo
        ? api.get(`/departments/${user.department_id}/users`)
        : api.get('/users/staff'),  // ✅ Officer ดึง staff ทั้งหมด
    ]

    Promise.all(requests)
      .then(([cRes, catRes, usersRes]) => {
        setComplaints(cRes.data)
        setCategories(catRes.data)
        setDeptUsers(usersRes.data)
      })
      .catch(() => router.push('/login'))
      .finally(() => setLoading(false))
  }, [])

  const handleAccept = async (issueId: number) => {
    setAcceptingId(issueId)
    try {
      await api.patch(`/complaints/${issueId}/accept`)
      setComplaints(prev => prev.map(c =>
        c.issue_id === issueId
          ? { ...c, status: 'in_progress', accepted_by: user.id, accepted_firstname: user.firstname, accepted_lastname: user.lastname }
          : c
      ))
    } catch (err: any) { alert(err?.response?.data?.message || 'เกิดข้อผิดพลาด') }
    finally { setAcceptingId(null) }
  }

  const handleUpdateStatus = async (issueId: number, newStatus: string) => {
    setUpdatingId(issueId)
    try {
      await api.patch(`/complaints/${issueId}/status`, { status: newStatus })
      setComplaints(prev => prev.map(c => c.issue_id === issueId ? { ...c, status: newStatus } : c))
    } catch { alert('เกิดข้อผิดพลาด') }
    finally { setUpdatingId(null) }
  }

  const handleUpdatePriority = (issueId: number, priority: string) =>
    setComplaints(prev => prev.map(c => c.issue_id === issueId ? { ...c, priority } : c))

  const handleUpdateCategory = (issueId: number, catId: number, catName: string) =>
    setComplaints(prev => prev.map(c => c.issue_id === issueId ? { ...c, category_id: catId, category_name: catName } : c))

  const handleAssigned = (issueId: number, name: string) =>
    setComplaints(prev => prev.map(c => c.issue_id === issueId ? { ...c, accepted_firstname: name, accepted_lastname: '' } : c))

  const handleForwarded = (issueId: number) =>
    setComplaints(prev => prev.map(c => c.issue_id === issueId ? { ...c, status: 'forwarded' } : c))

  const filtered = filterStatus === 'all' ? complaints : complaints.filter(c => c.status === filterStatus)
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

  const isSamo = user?.role === 'samo'

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Modals */}
      {assignModal && (
        <AssignModal
          issue={assignModal}
          deptUsers={deptUsers}
          onClose={() => setAssignModal(null)}
          onAssigned={handleAssigned}
        />
      )}
      {forwardModal && (
        <ForwardModal
          issue={forwardModal}
          onClose={() => setForwardModal(null)}
          onForwarded={handleForwarded}
        />
      )}

      <div className="max-w-5xl mx-auto px-4 py-8">

        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Dashboard ภาพรวม</h1>
          <p className="text-gray-400 text-sm mt-1">
            สวัสดี {user?.firstname}{isSamo && ' — แสดงคำร้องภายในคณะของคุณ'}
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'ทั้งหมด',        value: stats.total,       color: 'text-gray-800',   bg: 'bg-white',     border: 'border-gray-100',   icon: '📋' },
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
                <div className={`h-full rounded-full ${
                  s.label === 'รอดำเนินการ' ? 'bg-yellow-400' :
                  s.label === 'กำลังดำเนินการ' ? 'bg-blue-400' :
                  s.label === 'แก้ไขแล้ว' ? 'bg-green-400' : 'bg-gray-300'
                }`} style={{ width: stats.total > 0 ? `${(s.value / stats.total) * 100}%` : '0%' }} />
              </div>
            </div>
          ))}
        </div>

        {/* Filter */}
        <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
          {filterTabs.map(f => (
            <button key={f.key} onClick={() => setFilterStatus(f.key)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all border
                ${filterStatus === f.key ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'}`}>
              {f.label}
              {f.key !== 'all' && <span className="ml-1.5 text-xs opacity-70">({complaints.filter(c => c.status === f.key).length})</span>}
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
              const isUpdating = updatingId === c.issue_id
              const isAccepting = acceptingId === c.issue_id

              return (
                <div key={c.issue_id} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
                  <div className="flex justify-between items-start gap-4">

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                        <span className="text-xs text-gray-400">#{c.issue_id}</span>
                        {isSamo && categories.length > 0 ? (
                          <CategorySelector issueId={c.issue_id} currentId={c.category_id}
                            currentName={c.category_name} categories={categories} onUpdate={handleUpdateCategory} />
                        ) : (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">{c.category_name}</span>
                        )}
                      </div>
                      <h2 className="font-semibold text-gray-800">{c.title}</h2>
                      {c.description && <p className="text-sm text-gray-400 mt-1 line-clamp-1">{c.description}</p>}
                      <div className="flex gap-3 mt-2 text-xs text-gray-400 flex-wrap">
                        <span>👤 {c.firstname} {c.lastname}</span>
                        <span>🏫 {c.department_name || 'ไม่ระบุคณะ'}</span>
                        <span>🕐 {new Date(c.created_at).toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                      </div>
                      {c.accepted_by && (
                        <p className="text-xs text-blue-500 mt-1.5">✋ รับเรื่องโดย {c.accepted_firstname} {c.accepted_lastname}</p>
                      )}
                      {c.status === 'forwarded' && c.forwarded_note && (
                        <p className="text-xs text-purple-500 mt-1">📤 ส่งต่อ: {c.forwarded_note}</p>
                      )}
                    </div>

                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <span className={`text-xs px-3 py-1.5 rounded-full font-medium border whitespace-nowrap ${sCfg.color}`}>
                        {sCfg.icon} {sCfg.label}
                      </span>

                      <PrioritySelector issueId={c.issue_id} current={c.priority} onUpdate={handleUpdatePriority}
                        canEdit={['samo', 'officer', 'admin'].includes(user?.role || '')} />

                      {/* ปุ่มรับเรื่อง */}
                      {c.status === 'pending' && !c.accepted_by && (
                        <button onClick={() => handleAccept(c.issue_id)} disabled={isAccepting}
                          className="text-xs px-3 py-1.5 rounded-xl font-medium bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50">
                          {isAccepting ? 'กำลังรับ...' : '✋ รับเรื่อง'}
                        </button>
                      )}

                      {/* Officer รับเรื่องจาก forwarded */}
                      {c.status === 'forwarded' && user?.role === 'officer' && (
                      <button onClick={() => handleUpdateStatus(c.issue_id, 'resolved')} disabled={isUpdating}
                        className="text-xs px-3 py-1.5 rounded-xl font-medium bg-green-600 hover:bg-green-700 text-white disabled:opacity-50">
                        {isUpdating ? 'กำลังบันทึก...' : '✅ แก้ไขเสร็จ'}
                      </button>
                    )}

                      {/* US7 — มอบหมายงาน */}
                      {/* Samo — มอบหมายเฉพาะ in_progress */}
                      {isSamo && c.status === 'in_progress' && (
                        <button onClick={() => setAssignModal(c)}
                          className="text-xs px-3 py-1.5 rounded-xl font-medium bg-orange-500 hover:bg-orange-600 text-white">
                          👤 มอบหมาย
                        </button>
                      )}

                      {/* Officer — มอบหมายเฉพาะ forwarded */}
                      {user?.role === 'officer' && c.status === 'forwarded' && (
                        <button onClick={() => setAssignModal(c)}
                          className="text-xs px-3 py-1.5 rounded-xl font-medium bg-orange-500 hover:bg-orange-600 text-white">
                          👤 มอบหมาย
                        </button>
                      )}


                      {/* US8 — ส่งต่อ Officer */}
                      {isSamo && ['pending', 'in_progress'].includes(c.status) && (
                      <button onClick={() => setForwardModal(c)}
                        className="text-xs px-3 py-1.5 rounded-xl font-medium bg-purple-600 hover:bg-purple-700 text-white">
                        📤 ส่งต่อ
                      </button>
                    )}

                      {isSamo && c.status === 'in_progress' && c.accepted_by === user?.id && !c.accepted_firstname && (
                        <button onClick={() => handleUpdateStatus(c.issue_id, 'resolved')} disabled={isUpdating}
                          className="text-xs px-3 py-1.5 rounded-xl font-medium bg-green-600 hover:bg-green-700 text-white disabled:opacity-50">
                          {isUpdating ? 'กำลังบันทึก...' : '✅ แก้ไขเสร็จ'}
                        </button>
                      )}

                      {/* ปุ่มแก้ไขเสร็จ */}
                      {isSamo && c.status === 'in_progress' && (
                        <button onClick={() => handleUpdateStatus(c.issue_id, 'resolved')} disabled={isUpdating}
                          className="text-xs px-3 py-1.5 rounded-xl font-medium bg-green-600 hover:bg-green-700 text-white disabled:opacity-50">
                          {isUpdating ? 'กำลังบันทึก...' : '✅ แก้ไขเสร็จ'}
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