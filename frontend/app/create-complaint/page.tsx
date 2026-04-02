'use client'
import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import api, { getUser } from '../lib/api'

export default function CreateComplaintPage() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const user = getUser()
  const isStudent = user?.role === 'student'

  const [form, setForm] = useState({
    title: '',
    description: '',
    category_id: '',
    department_id: '',
    priority: 'medium',
  })
  const [categories, setCategories] = useState<any[]>([])
  const [departments, setDepartments] = useState<any[]>([])
  const [images, setImages] = useState<File[]>([])
  const [previews, setPreviews] = useState<string[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!user) { router.push('/login'); return }
    // samo/officer/admin ไม่มีสิทธิ์แจ้งเรื่อง → ไป dashboard
    if (['samo', 'officer', 'admin'].includes(user.role)) { router.push('/dashboard'); return }
    api.get('/categories').then(res => setCategories(res.data))
    api.get('/departments').then(res => setDepartments(res.data))
  }, [])

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (images.length + files.length > 5) {
      alert('แนบรูปภาพได้สูงสุด 5 รูป')
      return
    }
    const newImages = [...images, ...files]
    setImages(newImages)

    // สร้าง preview URLs
    const newPreviews = files.map(f => URL.createObjectURL(f))
    setPreviews(prev => [...prev, ...newPreviews])
  }

  const removeImage = (index: number) => {
    URL.revokeObjectURL(previews[index])
    setImages(prev => prev.filter((_, i) => i !== index))
    setPreviews(prev => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      // ใช้ FormData เพื่อส่งรูปภาพพร้อมกับข้อมูล
      const formData = new FormData()
      formData.append('title', form.title)
      formData.append('description', form.description)
      formData.append('category_id', form.category_id)
      formData.append('department_id', form.department_id)
      // student: priority ถูกล็อคที่ backend แล้ว แต่ส่งค่า medium ไปด้วย
      formData.append('priority', isStudent ? 'medium' : form.priority)
      images.forEach(img => formData.append('images', img))

      await api.post('/complaints', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      router.push('/my-complaints')
    } catch {
      alert('เกิดข้อผิดพลาด กรุณาลองใหม่')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-xl mx-auto bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">แจ้งเรื่องใหม่</h1>

        <form onSubmit={handleSubmit} className="space-y-5">

          {/* หัวข้อ */}
          <div>
            <label className="text-sm text-gray-600 mb-1 block font-medium">หัวข้อเรื่อง *</label>
            <input
              required
              placeholder="กรอกหัวข้อเรื่อง"
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400"
              value={form.title}
              onChange={e => setForm({ ...form, title: e.target.value })}
            />
          </div>

          {/* รายละเอียด */}
          <div>
            <label className="text-sm text-gray-600 mb-1 block font-medium">รายละเอียด</label>
            <textarea
              rows={4}
              placeholder="อธิบายรายละเอียดเพิ่มเติม"
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 resize-none"
              value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })}
            />
          </div>

          {/* หมวดหมู่ */}
          <div>
            <label className="text-sm text-gray-600 mb-1 block font-medium">หมวดหมู่ *</label>
            <select
              required
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 bg-white"
              value={form.category_id}
              onChange={e => setForm({ ...form, category_id: e.target.value })}
            >
              <option value="">เลือกหมวดหมู่</option>
              {categories.map(c => (
                <option key={c.category_id} value={c.category_id}>{c.category_name}</option>
              ))}
            </select>
          </div>

          {/* คณะ */}
          <div>
            <label className="text-sm text-gray-600 mb-1 block font-medium">คณะ/หน่วยงาน *</label>
            <select
              required
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 bg-white"
              value={form.department_id}
              onChange={e => setForm({ ...form, department_id: e.target.value })}
            >
              <option value="">เลือกคณะ/หน่วยงานที่เกิดปัญหา</option>
              {departments.map(d => (
                <option key={d.department_id} value={d.department_id}>
                  {d.department_name}
                </option>
              ))}
            </select>
          </div>

          {/* ความเร่งด่วน — เฉพาะ personnel/samo/officer/admin */}
          {!isStudent && (
            <div>
              <label className="text-sm text-gray-600 mb-1 block font-medium">ความเร่งด่วน</label>
              <select
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 bg-white"
                value={form.priority}
                onChange={e => setForm({ ...form, priority: e.target.value })}
              >
                <option value="low">🟢 ต่ำ — ปัญหาทั่วไป ไม่เร่งด่วน</option>
                <option value="medium">🟡 ปานกลาง — ควรแก้ไขภายใน 3-5 วัน</option>
                <option value="high">🔴 สูง — เร่งด่วน ส่งผลกระทบวงกว้าง</option>
              </select>
            </div>
          )}


          {/* US8/D9 — แนบรูปภาพ */}
          <div>
            <label className="text-sm text-gray-600 mb-1 block font-medium">
              แนบรูปภาพประกอบ
              <span className="text-gray-400 font-normal ml-1">(สูงสุด 5 รูป, ไม่เกิน 5MB/รูป)</span>
            </label>

            {/* Preview grid */}
            {previews.length > 0 && (
              <div className="grid grid-cols-3 gap-2 mb-3">
                {previews.map((src, i) => (
                  <div key={i} className="relative group aspect-square">
                    <img
                      src={src}
                      alt={`preview-${i}`}
                      className="w-full h-full object-cover rounded-xl border border-gray-200"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(i)}
                      className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Upload button */}
            {images.length < 5 && (
              <>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={handleImageChange}
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full border-2 border-dashed border-gray-200 rounded-xl py-4 text-sm text-gray-400 hover:border-blue-300 hover:text-blue-400 transition-colors flex flex-col items-center gap-1"
                >
                  <span className="text-2xl">📷</span>
                  <span>คลิกเพื่อเลือกรูปภาพ</span>
                  <span className="text-xs">({images.length}/5 รูป)</span>
                </button>
              </>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => router.back()}
              className="flex-1 border border-gray-200 rounded-xl py-2.5 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
            >
              ยกเลิก
            </button>
            <button
              disabled={loading}
              className="flex-1 bg-blue-600 text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {loading ? 'กำลังส่ง...' : 'ส่งเรื่อง'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}