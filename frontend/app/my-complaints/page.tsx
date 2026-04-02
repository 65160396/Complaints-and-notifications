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
  department_name: string
  created_at: string
  updated_at: string
  survey?: { rating: number; comment: string } | null
}

const statusConfig: Record<string, { label: string; color: string; icon: string }> = {
  pending:     { label: 'รอดำเนินการ',    color: 'bg-yellow-100 text-yellow-800 border-yellow-200', icon: '⏳' },
  in_progress: { label: 'กำลังดำเนินการ', color: 'bg-blue-100 text-blue-800 border-blue-200',       icon: '🔧' },
  resolved:    { label: 'แก้ไขแล้ว',      color: 'bg-green-100 text-green-800 border-green-200',    icon: '✅' },
  cancelled:   { label: 'ยกเลิกแล้ว',     color: 'bg-gray-100 text-gray-500 border-gray-200',      icon: '❌' },
}

const priorityConfig: Record<string, { label: string; color: string }> = {
  low:    { label: 'ต่ำ',      color: 'bg-gray-100 text-gray-600' },
  medium: { label: 'ปานกลาง', color: 'bg-orange-100 text-orange-700' },
  high:   { label: 'สูง',      color: 'bg-red-100 text-red-700' },
}

const timelineSteps = [
  { key: 'pending',     label: 'รอดำเนินการ' },
  { key: 'in_progress', label: 'กำลังดำเนินการ' },
  { key: 'resolved',    label: 'แก้ไขแล้ว' },
]

function StatusTimeline({ status }: { status: string }) {
  if (status === 'cancelled') {
    return <p className="text-xs text-gray-400 mt-3">❌ คำร้องนี้ถูกยกเลิกแล้ว</p>
  }
  const currentIdx = timelineSteps.findIndex(s => s.key === status)
  return (
    <div className="flex items-start mt-4">
      {timelineSteps.map((step, i) => {
        const isDone = i <= currentIdx
        const isCurrent = i === currentIdx
        return (
          <div key={step.key} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center">
              <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs font-bold
                ${isDone ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-gray-300 text-gray-300'}
                ${isCurrent ? 'ring-4 ring-blue-100' : ''}`}>
                {isDone && i === timelineSteps.length - 1 ? '✓' : i + 1}
              </div>
              <span className={`text-xs mt-1 whitespace-nowrap ${isDone ? 'text-blue-600 font-medium' : 'text-gray-400'}`}>
                {step.label}
              </span>
            </div>
            {i < timelineSteps.length - 1 && (
              <div className={`flex-1 h-0.5 mx-1 mb-4 ${i < currentIdx ? 'bg-blue-600' : 'bg-gray-200'}`} />
            )}
          </div>
        )
      })}
    </div>
  )
}

// US9 — ฟอร์มประเมินความพึงพอใจ
const RATING_OPTIONS = [
  { value: 1, label: 'ไม่พอใจ',  color: 'border-red-300 text-red-600 bg-red-50',         activeColor: 'border-red-500 bg-red-500 text-white' },
  { value: 2, label: 'พอใช้',    color: 'border-orange-300 text-orange-600 bg-orange-50', activeColor: 'border-orange-500 bg-orange-500 text-white' },
  { value: 3, label: 'ดี',       color: 'border-blue-300 text-blue-600 bg-blue-50',       activeColor: 'border-blue-500 bg-blue-500 text-white' },
  { value: 4, label: 'ดีมาก',   color: 'border-green-300 text-green-600 bg-green-50',    activeColor: 'border-green-500 bg-green-500 text-white' },
]

function SurveyForm({ issueId, onSubmitted }: { issueId: number; onSubmitted: (rating: number, comment: string) => void }) {
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async () => {
    if (rating === 0) { setError('กรุณาเลือกระดับความพึงพอใจ'); return }
    setLoading(true)
    setError('')
    try {
      await api.post('/survey', { issue_id: issueId, rating, comment })
      onSubmitted(rating, comment)
    } catch (err: any) {
      setError(err?.response?.data?.message || 'เกิดข้อผิดพลาด')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mt-4 pt-4 border-t border-gray-100">
      <p className="text-sm font-medium text-gray-700 mb-3">📝 ประเมินความพึงพอใจ</p>

      {/* 4 ปุ่มระดับ */}
      <div className="grid grid-cols-4 gap-2 mb-3">
        {RATING_OPTIONS.map(opt => (
          <button
            key={opt.value}
            type="button"
            onClick={() => setRating(opt.value)}
            className={`py-2 rounded-xl text-sm font-medium border-2 transition-all
              ${rating === opt.value ? opt.activeColor : opt.color + ' hover:opacity-80'}`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Comment */}
      <textarea
        rows={2}
        placeholder="ข้อเสนอแนะเพิ่มเติม (ไม่บังคับ)"
        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 resize-none"
        value={comment}
        onChange={e => setComment(e.target.value)}
      />

      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}

      <button
        onClick={handleSubmit}
        disabled={loading}
        className="mt-2 px-4 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
      >
        {loading ? 'กำลังส่ง...' : 'ส่งผลประเมิน'}
      </button>
    </div>
  )
}

// แสดงผลประเมินที่ส่งไปแล้ว
function SurveyResult({ rating, comment }: { rating: number; comment: string | null }) {
  const opt = RATING_OPTIONS.find(o => o.value === rating)
  return (
    <div className="mt-4 pt-4 border-t border-gray-100">
      <p className="text-sm font-medium text-gray-500 mb-2">ผลประเมินของคุณ</p>
      <span className={`text-sm px-3 py-1.5 rounded-xl border-2 font-medium ${opt?.activeColor || 'bg-gray-100 text-gray-600'}`}>
        {opt?.label || rating}
      </span>
      {comment && <p className="text-xs text-gray-400 mt-2 italic">"{comment}"</p>}
    </div>
  )
}

const filterTabs = [
  { key: 'all',         label: 'ทั้งหมด' },
  { key: 'pending',     label: '⏳ รอดำเนินการ' },
  { key: 'in_progress', label: '🔧 กำลังดำเนินการ' },
  { key: 'resolved',    label: '✅ แก้ไขแล้ว' },
  { key: 'cancelled',   label: '❌ ยกเลิกแล้ว' },
]

export default function MyComplaintsPage() {
  const router = useRouter()
  const [complaints, setComplaints] = useState<Complaint[]>([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState('all')
  const [cancellingId, setCancellingId] = useState<number | null>(null)
  const [confirmId, setConfirmId] = useState<number | null>(null)

  useEffect(() => {
    const user = getUser()
    if (!user) { router.push('/login'); return }
    // samo/officer/admin ไม่ใช้หน้านี้ → ไป dashboard
    if (['samo', 'officer', 'admin'].includes(user.role)) { router.push('/dashboard'); return }

    // ดึง complaints + survey ของแต่ละ resolved issue
    api.get('/complaints/my').then(async res => {
      const complaints: Complaint[] = res.data
      // ดึง survey สำหรับ resolved issues
      const resolved = complaints.filter(c => c.status === 'resolved')
      const surveyResults = await Promise.all(
        resolved.map(c =>
          api.get(`/survey/${c.issue_id}`).then(r => ({ issue_id: c.issue_id, survey: r.data })).catch(() => ({ issue_id: c.issue_id, survey: null }))
        )
      )
      const surveyMap: Record<number, any> = {}
      surveyResults.forEach(s => { surveyMap[s.issue_id] = s.survey })
      setComplaints(complaints.map(c => ({ ...c, survey: c.status === 'resolved' ? (surveyMap[c.issue_id] ?? null) : undefined })))
    })
      .catch(() => router.push('/login'))
      .finally(() => setLoading(false))
  }, [])

  const handleCancel = async (issueId: number) => {
    setCancellingId(issueId)
    try {
      await api.patch(`/complaints/${issueId}/cancel`)
      setComplaints(prev => prev.map(c => c.issue_id === issueId ? { ...c, status: 'cancelled' } : c))
    } catch (err: any) {
      alert(err?.response?.data?.message || 'เกิดข้อผิดพลาด')
    } finally {
      setCancellingId(null)
      setConfirmId(null)
    }
  }

  const handleSurveySubmitted = (issueId: number, rating: number, comment: string) => {
    setComplaints(prev =>
      prev.map(c => c.issue_id === issueId ? { ...c, survey: { rating, comment } } : c)
    )
  }

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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 py-8">

        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800">การร้องเรียนของฉัน</h1>
          <p className="text-gray-400 text-sm mt-1">ติดตามสถานะคำร้องที่คุณแจ้งไว้</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-3 mb-6">
          {[
            { label: 'ทั้งหมด',        value: stats.total,       color: 'text-gray-800',   bg: 'bg-white' },
            { label: 'รอดำเนินการ',    value: stats.pending,     color: 'text-yellow-700', bg: 'bg-yellow-50' },
            { label: 'กำลังดำเนินการ', value: stats.in_progress, color: 'text-blue-700',   bg: 'bg-blue-50' },
            { label: 'แก้ไขแล้ว',     value: stats.resolved,    color: 'text-green-700',  bg: 'bg-green-50' },
          ].map(s => (
            <div key={s.label} className={`${s.bg} rounded-xl p-4 border border-gray-100 text-center`}>
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-gray-400 mt-0.5">{s.label}</p>
            </div>
          ))}
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
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
            <p className="text-4xl mb-3">📋</p>
            <p className="text-gray-400 mb-4">ไม่มีรายการในหมวดนี้</p>
            <button onClick={() => router.push('/create-complaint')}
              className="px-5 py-2 bg-blue-600 text-white text-sm rounded-xl hover:bg-blue-700">
              + แจ้งเรื่องใหม่
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map(c => {
              const sCfg = statusConfig[c.status] || statusConfig['pending']
              const pCfg = priorityConfig[c.priority] || priorityConfig['medium']
              const isConfirming = confirmId === c.issue_id
              const isCancelling = cancellingId === c.issue_id

              return (
                <div key={c.issue_id} className={`bg-white rounded-2xl border p-5 shadow-sm
                  ${c.status === 'cancelled' ? 'opacity-60 border-gray-100' : 'border-gray-100'}`}>

                  <div className="flex justify-between items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="text-xs text-gray-400">#{c.issue_id}</span>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">{c.category_name}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${pCfg.color}`}>
                          ความเร่งด่วน: {pCfg.label}
                        </span>
                      </div>
                      <h2 className="font-semibold text-gray-800">{c.title}</h2>
                      {c.description && <p className="text-sm text-gray-400 mt-1 line-clamp-2">{c.description}</p>}
                      <p className="text-xs text-gray-400 mt-2">🏫 {c.department_name || 'ไม่ระบุคณะ'}</p>
                    </div>

                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <span className={`text-xs px-3 py-1.5 rounded-full font-medium border whitespace-nowrap ${sCfg.color}`}>
                        {sCfg.icon} {sCfg.label}
                      </span>

                      {/* ปุ่มยกเลิก */}
                      {c.status === 'pending' && (
                        isConfirming ? (
                          <div className="flex gap-1.5">
                            <button onClick={() => setConfirmId(null)}
                              className="text-xs px-2.5 py-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50">
                              ไม่ใช่
                            </button>
                            <button onClick={() => handleCancel(c.issue_id)} disabled={isCancelling}
                              className="text-xs px-2.5 py-1.5 rounded-lg bg-red-500 text-white hover:bg-red-600 disabled:opacity-50">
                              {isCancelling ? 'กำลังยกเลิก...' : 'ยืนยัน'}
                            </button>
                          </div>
                        ) : (
                          <button onClick={() => setConfirmId(c.issue_id)}
                            className="text-xs px-3 py-1.5 rounded-lg border border-red-200 text-red-500 hover:bg-red-50">
                            ยกเลิกคำร้อง
                          </button>
                        )
                      )}
                    </div>
                  </div>

                  <StatusTimeline status={c.status} />

                  {/* US9 — แสดง survey form เฉพาะ resolved และยังไม่เคยประเมิน */}
                  {c.status === 'resolved' && c.survey === null && (
                    <SurveyForm
                      issueId={c.issue_id}
                      onSubmitted={(rating, comment) => handleSurveySubmitted(c.issue_id, rating, comment)}
                    />
                  )}

                  {/* แสดงผลประเมินที่ส่งไปแล้ว */}
                  {c.status === 'resolved' && c.survey && (
                    <SurveyResult rating={c.survey.rating} comment={c.survey.comment} />
                  )}

                  <div className="flex justify-between items-center mt-4 pt-3 border-t border-gray-50">
                    <span className="text-xs text-gray-400">
                      แจ้งเมื่อ {new Date(c.created_at).toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric' })}
                    </span>
                    {c.updated_at !== c.created_at && (
                      <span className="text-xs text-gray-400">
                        อัปเดต {new Date(c.updated_at).toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric' })}
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <button onClick={() => router.push('/create-complaint')}
        className="fixed bottom-6 right-6 bg-blue-600 text-white w-14 h-14 rounded-full shadow-lg hover:bg-blue-700 transition-all hover:scale-105 flex items-center justify-center text-2xl">
        +
      </button>
    </div>
  )
}