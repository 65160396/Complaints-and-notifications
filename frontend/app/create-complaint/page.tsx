'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import api from '../lib/api'

export default function CreateComplaintPage() {
  const router = useRouter()
  const [form, setForm] = useState({
    title: '',
    description: '',
    category_id: '',
    location_id: '',
    priority: 'medium',
  })
  const [categories, setCategories] = useState<any[]>([])
  const [locations, setLocations] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    api.get('/categories').then(res => setCategories(res.data))
    api.get('/locations').then(res => setLocations(res.data))
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await api.post('/complaints', form)
      router.push('/complaints')
    } catch {
      alert('เกิดข้อผิดพลาด กรุณาลองใหม่')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-xl mx-auto bg-white rounded-xl shadow p-8">
        <h1 className="text-2xl font-bold mb-6">แจ้งเรื่องใหม่</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm text-gray-600 mb-1 block">หัวข้อเรื่อง *</label>
            <input
              placeholder="กรอกหัวข้อเรื่อง"
              required
              className="w-full border rounded-lg px-4 py-2"
              value={form.title}
              onChange={e => setForm({ ...form, title: e.target.value })}
            />
          </div>

          <div>
            <label className="text-sm text-gray-600 mb-1 block">รายละเอียด</label>
            <textarea
              placeholder="อธิบายรายละเอียดเพิ่มเติม"
              rows={4}
              className="w-full border rounded-lg px-4 py-2"
              value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })}
            />
          </div>

          <div>
            <label className="text-sm text-gray-600 mb-1 block">หมวดหมู่ *</label>
            <select
              required
              className="w-full border rounded-lg px-4 py-2"
              value={form.category_id}
              onChange={e => setForm({ ...form, category_id: e.target.value })}
            >
              <option value="">เลือกหมวดหมู่</option>
              {categories.map(c => (
                <option key={c.category_id} value={c.category_id}>
                  {c.category_name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm text-gray-600 mb-1 block">สถานที่ *</label>
            <select
              required
              className="w-full border rounded-lg px-4 py-2"
              value={form.location_id}
              onChange={e => setForm({ ...form, location_id: e.target.value })}
            >
              <option value="">เลือกสถานที่</option>
              {locations.map(l => (
                <option key={l.location_id} value={l.location_id}>
                  {l.building} ชั้น {l.floor} ห้อง {l.room}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm text-gray-600 mb-1 block">ความเร่งด่วน</label>
            <select
              className="w-full border rounded-lg px-4 py-2"
              value={form.priority}
              onChange={e => setForm({ ...form, priority: e.target.value })}
            >
              <option value="low">ต่ำ</option>
              <option value="medium">ปานกลาง</option>
              <option value="high">สูง</option>
            </select>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => router.back()}
              className="flex-1 border rounded-lg py-2 hover:bg-gray-50"
            >
              ยกเลิก
            </button>
            <button
              disabled={loading}
              className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'กำลังส่ง...' : 'ส่งเรื่อง'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}