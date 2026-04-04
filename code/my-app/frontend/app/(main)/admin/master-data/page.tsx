'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import api, { getUser } from '../../../lib/api'

interface Category {
  category_id: number
  category_name: string
  for_role: string
}
interface Department {
  department_id: number
  department_name: string
}
interface Location {
  location_id: number
  building: string
  floor: string | null
  room: string | null
  department_id: number | null
}

export default function AdminMasterDataPage() {
  const router = useRouter()
  const [categories, setCategories] = useState<Category[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [locations, setLocations] = useState<Location[]>([])
  const [loading, setLoading] = useState(true)

  const [showCatModal, setShowCatModal] = useState(false)
  const [showDeptModal, setShowDeptModal] = useState(false)
  const [showLocModal, setShowLocModal] = useState(false)
  const [editTarget, setEditTarget] = useState<any>(null)

  const [catForm, setCatForm] = useState({ category_name: '', for_role: 'all' })
  const [deptForm, setDeptForm] = useState({ department_name: '' })
  const [locForm, setLocForm] = useState({ building: '', floor: '', room: '', department_id: '' })

  useEffect(() => {
    const user = getUser()
    if (!user || user.role !== 'admin') {
      router.push('/login')
      return
    }
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [catRes, deptRes, locRes] = await Promise.all([
        api.get('/categories/all'),
        api.get('/departments'),
        api.get('/locations'),
      ])
      setCategories(catRes.data)
      setDepartments(deptRes.data)
      setLocations(locRes.data)
    } catch {
      router.push('/login')
    } finally {
      setLoading(false)
    }
  }

  const handleSaveCat = async () => {
    try {
      if (editTarget?.category_id) {
        await api.put(`/categories/${editTarget.category_id}`, catForm)
        setCategories(prev => prev.map(c => c.category_id === editTarget.category_id ? { ...c, ...catForm } : c))
      } else {
        const res = await api.post('/categories', catForm)
        setCategories(prev => [...prev, { category_id: res.data.category_id, ...catForm }])
      }
      setShowCatModal(false)
      setEditTarget(null)
      setCatForm({ category_name: '', for_role: 'all' })
    } catch {
      alert('เกิดข้อผิดพลาด')
    }
  }

  const handleDeleteCat = async (id: number) => {
    if (!confirm('ลบหมวดหมู่นี้?')) return
    try {
      await api.delete(`/categories/${id}`)
      setCategories(prev => prev.filter(c => c.category_id !== id))
    } catch {
      alert('เกิดข้อผิดพลาด')
    }
  }

  const handleSaveDept = async () => {
    try {
      if (editTarget?.department_id) {
        await api.put(`/departments/${editTarget.department_id}`, deptForm)
        setDepartments(prev => prev.map(d => d.department_id === editTarget.department_id ? { ...d, ...deptForm } : d))
      } else {
        const res = await api.post('/departments', deptForm)
        setDepartments(prev => [...prev, { department_id: res.data.department_id, ...deptForm }])
      }
      setShowDeptModal(false)
      setEditTarget(null)
      setDeptForm({ department_name: '' })
    } catch {
      alert('เกิดข้อผิดพลาด')
    }
  }

  const handleDeleteDept = async (id: number) => {
    if (!confirm('ลบคณะนี้?')) return
    try {
      await api.delete(`/departments/${id}`)
      setDepartments(prev => prev.filter(d => d.department_id !== id))
    } catch {
      alert('เกิดข้อผิดพลาด')
    }
  }

  const handleSaveLoc = async () => {
    try {
      if (editTarget?.location_id) {
        await api.put(`/locations/${editTarget.location_id}`, locForm)
        setLocations(prev =>
          prev.map(l =>
            l.location_id === editTarget.location_id
              ? { ...l, ...locForm, department_id: Number(locForm.department_id) || null }
              : l
          )
        )
      } else {
        const res = await api.post('/locations', locForm)
        setLocations(prev => [
          ...prev,
          { location_id: res.data.location_id, ...locForm, department_id: Number(locForm.department_id) || null }
        ] as any)
      }
      setShowLocModal(false)
      setEditTarget(null)
      setLocForm({ building: '', floor: '', room: '', department_id: '' })
    } catch {
      alert('เกิดข้อผิดพลาด')
    }
  }

  const handleDeleteLoc = async (id: number) => {
    if (!confirm('ลบสถานที่นี้?')) return
    try {
      await api.delete(`/locations/${id}`)
      setLocations(prev => prev.filter(l => l.location_id !== id))
    } catch {
      alert('เกิดข้อผิดพลาด')
    }
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" /></div>

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
        <div className="mb-2">
          <h1 className="text-2xl font-bold text-gray-800">🗂️ Master Data</h1>
          <p className="text-gray-400 text-sm mt-1">จัดการหมวดหมู่ คณะ/หน่วยงาน และสถานที่</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-semibold text-gray-800">🏷️ หมวดหมู่</h2>
            <button
              onClick={() => {
                setEditTarget(null)
                setCatForm({ category_name: '', for_role: 'all' })
                setShowCatModal(true)
              }}
              className="text-xs px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              + เพิ่ม
            </button>
          </div>
          <div className="space-y-2">
            {categories.map(c => (
              <div key={c.category_id} className="flex justify-between items-center px-3 py-2 bg-gray-50 rounded-xl">
                <span className="text-sm text-gray-700">{c.category_name}</span>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setEditTarget(c)
                      setCatForm({ category_name: c.category_name, for_role: c.for_role })
                      setShowCatModal(true)
                    }}
                    className="text-xs px-2 py-1 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100"
                  >
                    แก้ไข
                  </button>
                  <button
                    onClick={() => handleDeleteCat(c.category_id)}
                    className="text-xs px-2 py-1 bg-red-50 text-red-600 rounded-lg hover:bg-red-100"
                  >
                    ลบ
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-semibold text-gray-800">🏫 คณะ/หน่วยงาน</h2>
            <button
              onClick={() => {
                setEditTarget(null)
                setDeptForm({ department_name: '' })
                setShowDeptModal(true)
              }}
              className="text-xs px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              + เพิ่ม
            </button>
          </div>
          <div className="space-y-2">
            {departments.map(d => (
              <div key={d.department_id} className="flex justify-between items-center px-3 py-2 bg-gray-50 rounded-xl">
                <span className="text-sm text-gray-700">{d.department_name}</span>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setEditTarget(d)
                      setDeptForm({ department_name: d.department_name })
                      setShowDeptModal(true)
                    }}
                    className="text-xs px-2 py-1 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100"
                  >
                    แก้ไข
                  </button>
                  <button
                    onClick={() => handleDeleteDept(d.department_id)}
                    className="text-xs px-2 py-1 bg-red-50 text-red-600 rounded-lg hover:bg-red-100"
                  >
                    ลบ
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-semibold text-gray-800">📍 สถานที่</h2>
            <button
              onClick={() => {
                setEditTarget(null)
                setLocForm({ building: '', floor: '', room: '', department_id: '' })
                setShowLocModal(true)
              }}
              className="text-xs px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              + เพิ่ม
            </button>
          </div>
          <div className="space-y-2">
            {locations.map(l => (
              <div key={l.location_id} className="flex justify-between items-center px-3 py-2 bg-gray-50 rounded-xl">
                <span className="text-sm text-gray-700">
                  {l.building} {l.floor ? `ชั้น ${l.floor}` : ''} {l.room ? `ห้อง ${l.room}` : ''}
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setEditTarget(l)
                      setLocForm({
                        building: l.building,
                        floor: l.floor || '',
                        room: l.room || '',
                        department_id: String(l.department_id || '')
                      })
                      setShowLocModal(true)
                    }}
                    className="text-xs px-2 py-1 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100"
                  >
                    แก้ไข
                  </button>
                  <button
                    onClick={() => handleDeleteLoc(l.location_id)}
                    className="text-xs px-2 py-1 bg-red-50 text-red-600 rounded-lg hover:bg-red-100"
                  >
                    ลบ
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {showCatModal && (
          <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center px-4">
            <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-xl">
              <h2 className="font-bold text-gray-800 mb-4">{editTarget ? 'แก้ไขหมวดหมู่' : 'เพิ่มหมวดหมู่'}</h2>
              <label className="text-xs text-gray-500 mb-1 block">ชื่อหมวดหมู่ *</label>
              <input
                value={catForm.category_name}
                onChange={e => setCatForm({ ...catForm, category_name: e.target.value })}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
              <label className="text-xs text-gray-500 mb-1 block">สำหรับ Role</label>
              <select
                value={catForm.for_role}
                onChange={e => setCatForm({ ...catForm, for_role: e.target.value })}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-blue-100 bg-white"
              >
                <option value="all">ทุก Role</option>
                <option value="student">นักศึกษา</option>
                <option value="personnel">บุคลากร</option>
              </select>
              <div className="flex gap-3">
                <button onClick={() => { setShowCatModal(false); setEditTarget(null) }} className="flex-1 border border-gray-200 rounded-xl py-2.5 text-sm text-gray-600 hover:bg-gray-50">ยกเลิก</button>
                <button onClick={handleSaveCat} className="flex-1 bg-blue-600 text-white rounded-xl py-2.5 text-sm font-semibold hover:bg-blue-700">บันทึก</button>
              </div>
            </div>
          </div>
        )}

        {showDeptModal && (
          <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center px-4">
            <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-xl">
              <h2 className="font-bold text-gray-800 mb-4">{editTarget ? 'แก้ไขคณะ/หน่วยงาน' : 'เพิ่มคณะ/หน่วยงาน'}</h2>
              <label className="text-xs text-gray-500 mb-1 block">ชื่อคณะ/หน่วยงาน *</label>
              <input
                value={deptForm.department_name}
                onChange={e => setDeptForm({ department_name: e.target.value })}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
              <div className="flex gap-3">
                <button onClick={() => { setShowDeptModal(false); setEditTarget(null) }} className="flex-1 border border-gray-200 rounded-xl py-2.5 text-sm text-gray-600 hover:bg-gray-50">ยกเลิก</button>
                <button onClick={handleSaveDept} className="flex-1 bg-blue-600 text-white rounded-xl py-2.5 text-sm font-semibold hover:bg-blue-700">บันทึก</button>
              </div>
            </div>
          </div>
        )}

        {showLocModal && (
          <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center px-4">
            <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl">
              <h2 className="font-bold text-gray-800 mb-4">{editTarget ? 'แก้ไขสถานที่' : 'เพิ่มสถานที่'}</h2>

              <label className="text-xs text-gray-500 mb-1 block">อาคาร *</label>
              <input
                value={locForm.building}
                onChange={e => setLocForm({ ...locForm, building: e.target.value })}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-blue-100"
              />

              <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">ชั้น</label>
                  <input
                    value={locForm.floor}
                    onChange={e => setLocForm({ ...locForm, floor: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">ห้อง</label>
                  <input
                    value={locForm.room}
                    onChange={e => setLocForm({ ...locForm, room: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100"
                  />
                </div>
              </div>

              <label className="text-xs text-gray-500 mb-1 block">คณะ/หน่วยงาน</label>
              <select
                value={locForm.department_id}
                onChange={e => setLocForm({ ...locForm, department_id: e.target.value })}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-blue-100 bg-white"
              >
                <option value="">ไม่ระบุ</option>
                {departments.map(d => (
                  <option key={d.department_id} value={d.department_id}>{d.department_name}</option>
                ))}
              </select>

              <div className="flex gap-3">
                <button onClick={() => { setShowLocModal(false); setEditTarget(null) }} className="flex-1 border border-gray-200 rounded-xl py-2.5 text-sm text-gray-600 hover:bg-gray-50">ยกเลิก</button>
                <button onClick={handleSaveLoc} className="flex-1 bg-blue-600 text-white rounded-xl py-2.5 text-sm font-semibold hover:bg-blue-700">บันทึก</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}