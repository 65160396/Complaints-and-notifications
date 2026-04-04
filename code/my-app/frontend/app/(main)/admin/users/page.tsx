'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import api, { getUser } from '../../../lib/api'

interface User {
  user_id: number
  firstname: string
  lastname: string
  email: string
  role: string
  phone: string | null
  is_active: number
}

const roleLabel: Record<string, string> = {
  student: 'นักศึกษา',
  personnel: 'บุคลากร',
  samo: 'สโมสรคณะ',
  officer: 'เจ้าหน้าที่',
  admin: 'ผู้ดูแลระบบ',
}

const roleBadgeColor: Record<string, string> = {
  student: 'bg-blue-100 text-blue-700',
  personnel: 'bg-green-100 text-green-700',
  samo: 'bg-yellow-100 text-yellow-700',
  officer: 'bg-orange-100 text-orange-700',
  admin: 'bg-purple-100 text-purple-700',
}

export default function AdminUsersPage() {
  const router = useRouter()
  const [users, setUsers] = useState<User[]>([])
  const [searchUser, setSearchUser] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const user = getUser()
    if (!user || user.role !== 'admin') {
      router.push('/login')
      return
    }
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    setLoading(true)
    try {
      const res = await api.get('/users')
      setUsers(res.data)
    } catch {
      router.push('/login')
    } finally {
      setLoading(false)
    }
  }

  const handleToggleUser = async (userId: number) => {
    try {
      const res = await api.put(`/users/${userId}/toggle`)
      setUsers(prev => prev.map(u => u.user_id === userId ? { ...u, is_active: res.data.is_active } : u))
    } catch {
      alert('เกิดข้อผิดพลาด')
    }
  }

  const handleChangeRole = async (userId: number, role: string) => {
    try {
      if (role === 'admin') {
        const password = prompt('กรุณายืนยันรหัสผ่านของคุณเพื่อเปลี่ยน Role เป็น Admin')
        if (!password) return
        await api.put(`/users/${userId}/role`, { role, confirm_password: password })
      } else {
        await api.put(`/users/${userId}/role`, { role })
      }
      setUsers(prev => prev.map(u => u.user_id === userId ? { ...u, role } : u))
    } catch (err: any) {
      alert(err?.response?.data?.message || 'เกิดข้อผิดพลาด')
    }
  }

  const filteredUsers = users.filter(u =>
    u.firstname.toLowerCase().includes(searchUser.toLowerCase()) ||
    u.lastname.toLowerCase().includes(searchUser.toLowerCase()) ||
    u.email.toLowerCase().includes(searchUser.toLowerCase())
  )

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
          <h1 className="text-2xl font-bold text-gray-800">👥 จัดการผู้ใช้</h1>
          <p className="text-gray-400 text-sm mt-1">ค้นหา แก้ไข role และเปิด/ปิดการใช้งาน</p>
        </div>

        <input
          placeholder="ค้นหาชื่อ หรืออีเมล..."
          value={searchUser}
          onChange={e => setSearchUser(e.target.value)}
          className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-blue-100"
        />

        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-4 py-3 text-xs text-gray-500 font-medium">ชื่อ</th>
                <th className="text-left px-4 py-3 text-xs text-gray-500 font-medium">อีเมล</th>
                <th className="text-left px-4 py-3 text-xs text-gray-500 font-medium">Role</th>
                <th className="text-left px-4 py-3 text-xs text-gray-500 font-medium">สถานะ</th>
                <th className="text-left px-4 py-3 text-xs text-gray-500 font-medium">จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map(u => (
                <tr key={u.user_id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="px-4 py-3">{u.firstname} {u.lastname}</td>
                  <td className="px-4 py-3 text-gray-400 text-xs">{u.email}</td>
                  <td className="px-4 py-3">
                    <select
                      value={u.role}
                      onChange={e => handleChangeRole(u.user_id, e.target.value)}
                      className={`text-xs px-2 py-1 rounded-full font-medium border-0 cursor-pointer ${roleBadgeColor[u.role]}`}
                    >
                      {Object.entries(roleLabel).map(([key, label]) => (
                        <option key={key} value={key}>{label}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${u.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                      {u.is_active ? 'ใช้งาน' : 'ปิดใช้งาน'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => handleToggleUser(u.user_id)}
                      className={`text-xs px-3 py-1.5 rounded-lg font-medium ${u.is_active ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-green-50 text-green-600 hover:bg-green-100'}`}
                    >
                      {u.is_active ? 'ปิดใช้งาน' : 'เปิดใช้งาน'}
                    </button>
                  </td>
                </tr>
              ))}
              {filteredUsers.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-gray-400">ไม่พบข้อมูลผู้ใช้</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}