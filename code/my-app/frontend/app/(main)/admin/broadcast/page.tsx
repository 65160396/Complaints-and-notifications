'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import api, { getUser } from '../../../lib/api'

export default function AdminBroadcastPage() {
  const router = useRouter()
  const [broadcastMsg, setBroadcastMsg] = useState('')
  const [broadcastRoles, setBroadcastRoles] = useState<string[]>(['all'])
  const [broadcastLoading, setBroadcastLoading] = useState(false)
  const [broadcastResult, setBroadcastResult] = useState('')

  useEffect(() => {
    const user = getUser()
    if (!user || user.role !== 'admin') {
      router.push('/login')
    }
  }, [])

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800">📢 แจ้งเตือนฉุกเฉิน</h1>
          <p className="text-gray-400 text-sm mt-1">ส่งข้อความถึงกลุ่มเป้าหมายในระบบ</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm max-w-xl">
          <h2 className="font-semibold text-gray-800 mb-1">ส่งแจ้งเตือนฉุกเฉิน</h2>
          <p className="text-xs text-gray-400 mb-5">ข้อความจะถูกส่งทันทีไปยังกลุ่มที่เลือก</p>

          <label className="text-xs text-gray-500 mb-1 block font-medium">กลุ่มผู้รับ</label>
          <div className="flex flex-wrap gap-2 mb-4">
            {[
              { val: 'all', label: 'ทุกคน' },
              { val: 'student', label: 'นักศึกษา' },
              { val: 'personnel', label: 'บุคลากร' },
              { val: 'samo', label: 'สโมสร' },
              { val: 'officer', label: 'เจ้าหน้าที่' },
            ].map(r => (
              <button
                key={r.val}
                onClick={() => {
                  if (r.val === 'all') {
                    setBroadcastRoles(['all'])
                    return
                  }
                  const filtered = broadcastRoles.filter(x => x !== 'all')
                  setBroadcastRoles(
                    filtered.includes(r.val)
                      ? filtered.filter(x => x !== r.val)
                      : [...filtered, r.val]
                  )
                }}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                  broadcastRoles.includes(r.val) || (r.val !== 'all' && broadcastRoles.includes('all') && r.val === 'all')
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>

          <label className="text-xs text-gray-500 mb-1 block font-medium">ข้อความแจ้งเตือน *</label>
          <textarea
            rows={4}
            placeholder="เช่น ระบบจะปิดปรับปรุงในวันที่ 20 มกราคม เวลา 22:00-24:00 น."
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm mb-1 focus:outline-none focus:ring-2 focus:ring-blue-100 resize-none"
            value={broadcastMsg}
            onChange={e => {
              setBroadcastMsg(e.target.value)
              setBroadcastResult('')
            }}
          />
          <p className="text-xs text-gray-400 mb-4">{broadcastMsg.length}/500 ตัวอักษร</p>

          {broadcastResult && (
            <div className="mb-4 px-4 py-3 rounded-xl bg-green-50 border border-green-200 text-sm text-green-700">
              ✅ {broadcastResult}
            </div>
          )}

          <button
            disabled={broadcastLoading || !broadcastMsg.trim()}
            onClick={async () => {
              setBroadcastLoading(true)
              setBroadcastResult('')
              try {
                const res = await api.post('/notifications/broadcast', {
                  message: broadcastMsg.trim(),
                  target_roles: broadcastRoles,
                })
                setBroadcastResult(res.data.message)
                setBroadcastMsg('')
              } catch (err: any) {
                setBroadcastResult(err?.response?.data?.message || 'เกิดข้อผิดพลาด')
              } finally {
                setBroadcastLoading(false)
              }
            }}
            className="w-full bg-blue-600 text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {broadcastLoading ? 'กำลังส่ง...' : '📢 ส่งแจ้งเตือน'}
          </button>
        </div>
      </div>
    </div>
  )
}