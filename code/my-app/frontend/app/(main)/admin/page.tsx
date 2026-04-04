'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import api, { getUser } from '../../lib/api'

interface User {
  user_id: number
  firstname: string
  lastname: string
  email: string
  role: string
  phone: string | null
  is_active: number
}
interface Category {
  category_id: number
  category_name: string
  for_role: string
}
interface Department {
  department_id: number
  department_name: string
}
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

export default function AdminOverviewPage() {
  const router = useRouter()
  const [users, setUsers] = useState<User[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [complaints, setComplaints] = useState<Complaint[]>([])
  const [onlineCount, setOnlineCount] = useState(0)
  const [loading, setLoading] = useState(true)

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
      const [uRes, catRes, deptRes, cRes, onlineRes] = await Promise.all([
        api.get('/users'),
        api.get('/categories/all'),
        api.get('/departments'),
        api.get('/complaints'),
        api.get('/users/online-count'),
      ])
      setUsers(uRes.data)
      setCategories(catRes.data)
      setDepartments(deptRes.data)
      setComplaints(cRes.data)
      setOnlineCount(onlineRes.data.count)
    } catch {
      router.push('/login')
    } finally {
      setLoading(false)
    }
  }

  const stats = {
    total: complaints.length,
    pending: complaints.filter(c => c.status === 'pending').length,
    in_progress: complaints.filter(c => c.status === 'in_progress').length,
    resolved: complaints.filter(c => c.status === 'resolved').length,
    forwarded: complaints.filter(c => c.status === 'forwarded').length,
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
          <h1 className="text-2xl font-bold text-gray-800">⚙️ Admin Panel</h1>
          <p className="text-gray-400 text-sm mt-1">จัดการระบบและข้อมูลพื้นฐาน</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mb-8">
          {[
            { label: 'ทั้งหมด', value: stats.total, color: 'text-gray-800', bg: 'bg-white' },
            { label: 'รอดำเนินการ', value: stats.pending, color: 'text-yellow-700', bg: 'bg-yellow-50' },
            { label: 'กำลังดำเนินการ', value: stats.in_progress, color: 'text-blue-700', bg: 'bg-blue-50' },
            { label: 'แก้ไขแล้ว', value: stats.resolved, color: 'text-green-700', bg: 'bg-green-50' },
            { label: 'ส่งต่อแล้ว', value: stats.forwarded, color: 'text-purple-700', bg: 'bg-purple-50' },
          ].map(s => (
            <div key={s.label} className={`${s.bg} border border-gray-100 rounded-2xl p-5`}>
              <p className={`text-3xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-sm text-gray-500 mt-1">{s.label}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white border border-gray-100 rounded-2xl p-5">
            <p className="text-3xl font-bold text-gray-800">{users.length}</p>
            <p className="text-sm text-gray-500 mt-1">ผู้ใช้ทั้งหมด</p>
          </div>
          <div className="bg-white border border-gray-100 rounded-2xl p-5">
            <p className="text-3xl font-bold text-gray-800">{categories.length}</p>
            <p className="text-sm text-gray-500 mt-1">หมวดหมู่</p>
          </div>
          <div className="bg-white border border-gray-100 rounded-2xl p-5">
            <p className="text-3xl font-bold text-gray-800">{departments.length}</p>
            <p className="text-sm text-gray-500 mt-1">คณะ/หน่วยงาน</p>
          </div>
          <div className="bg-white border border-gray-100 rounded-2xl p-5">
            <p className="text-3xl font-bold text-green-700">{onlineCount}</p>
            <p className="text-sm text-gray-500 mt-1">Online ขณะนี้</p>
          </div>
        </div>
      </div>
    </div>
  )
}