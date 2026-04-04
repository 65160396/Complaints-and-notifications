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

interface Location {
  location_id: number
  building: string
  floor: string | null
  room: string | null
  department_id: number | null
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

interface AuditLog {
  log_id: number
  admin_id: number
  action: string
  target_user_id: number | null
  detail: string
  created_at: string
  admin_firstname: string
  admin_lastname: string
}
interface SystemLog {
  log_id: number
  type: string
  message: string
  detail: string | null
  ip_address: string | null
  created_at: string
  firstname: string | null
  lastname: string | null
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

const statusConfig: Record<string, { label: string; color: string }> = {
  pending: { label: 'รอดำเนินการ', color: 'bg-yellow-100 text-yellow-800' },
  in_progress: { label: 'กำลังดำเนินการ', color: 'bg-blue-100 text-blue-800' },
  resolved: { label: 'แก้ไขแล้ว', color: 'bg-green-100 text-green-800' },
  forwarded: { label: 'ส่งต่อแล้ว', color: 'bg-purple-100 text-purple-800' },
  cancelled: { label: 'ยกเลิกแล้ว', color: 'bg-gray-100 text-gray-500' },
}

export default function AdminPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('overview')
  const [broadcastMsg, setBroadcastMsg] = useState('')
  const [broadcastRoles, setBroadcastRoles] = useState<string[]>(['all'])
  const [broadcastLoading, setBroadcastLoading] = useState(false)
  const [broadcastResult, setBroadcastResult] = useState('')
  const [users, setUsers] = useState<User[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [locations, setLocations] = useState<Location[]>([])
  const [complaints, setComplaints] = useState<Complaint[]>([])
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [searchUser, setSearchUser] = useState('')
  const user = getUser()

  const [showCatModal, setShowCatModal] = useState(false)
  const [showDeptModal, setShowDeptModal] = useState(false)
  const [showLocModal, setShowLocModal] = useState(false)
  const [editTarget, setEditTarget] = useState<any>(null)
  const [systemLogs, setSystemLogs] = useState<SystemLog[]>([])
  const [onlineCount, setOnlineCount] = useState(0)

  const [catForm, setCatForm] = useState({ category_name: '', for_role: 'all' })
  const [deptForm, setDeptForm] = useState({ department_name: '' })
  const [locForm, setLocForm] = useState({ building: '', floor: '', room: '', department_id: '' })

  useEffect(() => {
    if (!user || user.role !== 'admin') { router.push('/login'); return }
    fetchAll()
  }, [])

  const fetchAll = async () => {
  setLoading(true)
  try {
    const [uRes, catRes, deptRes, locRes, cRes, logRes, sysRes, onlineRes] = await Promise.all([
      api.get('/users'),
      api.get('/categories/all'),
      api.get('/departments'),
      api.get('/locations'),
      api.get('/complaints'),
      api.get('/users/audit-logs'),   // ✅ audit-logs ก่อน
      api.get('/users/system-logs'),  // ✅ system-logs ทีหลัง
      api.get('/users/online-count'),
    ])
    setUsers(uRes.data)
    setCategories(catRes.data)
    setDepartments(deptRes.data)
    setLocations(locRes.data)
    setComplaints(cRes.data)
    setAuditLogs(logRes.data)   // ✅ audit-logs
    setSystemLogs(sysRes.data)  // ✅ system-logs
    setOnlineCount(onlineRes.data.count)
  } catch(err) {
    console.error('fetchAll error:', err)
    router.push('/login')
  }
  finally { setLoading(false) }
}

  const handleToggleUser = async (userId: number) => {
    try {
      const res = await api.put(`/users/${userId}/toggle`)
      setUsers(prev => prev.map(u => u.user_id === userId ? { ...u, is_active: res.data.is_active } : u))
    } catch { alert('เกิดข้อผิดพลาด') }
  }

  const handleChangeRole = async (userId: number, role: string) => {
  try {
    // เปลี่ยนเป็น admin ต้องยืนยันรหัสผ่านก่อน
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

  const handleSaveCat = async () => {
    try {
      if (editTarget) {
        await api.put(`/categories/${editTarget.category_id}`, catForm)
        setCategories(prev => prev.map(c => c.category_id === editTarget.category_id ? { ...c, ...catForm } : c))
      } else {
        const res = await api.post('/categories', catForm)
        setCategories(prev => [...prev, { category_id: res.data.category_id, ...catForm }])
      }
      setShowCatModal(false); setEditTarget(null); setCatForm({ category_name: '', for_role: 'all' })
    } catch { alert('เกิดข้อผิดพลาด') }
  }

  const handleDeleteCat = async (id: number) => {
    if (!confirm('ลบหมวดหมู่นี้?')) return
    try { await api.delete(`/categories/${id}`); setCategories(prev => prev.filter(c => c.category_id !== id)) }
    catch { alert('เกิดข้อผิดพลาด') }
  }

  const handleSaveDept = async () => {
    try {
      if (editTarget) {
        await api.put(`/departments/${editTarget.department_id}`, deptForm)
        setDepartments(prev => prev.map(d => d.department_id === editTarget.department_id ? { ...d, ...deptForm } : d))
      } else {
        const res = await api.post('/departments', deptForm)
        setDepartments(prev => [...prev, { department_id: res.data.department_id, ...deptForm }])
      }
      setShowDeptModal(false); setEditTarget(null); setDeptForm({ department_name: '' })
    } catch { alert('เกิดข้อผิดพลาด') }
  }

  const handleDeleteDept = async (id: number) => {
    if (!confirm('ลบคณะนี้?')) return
    try { await api.delete(`/departments/${id}`); setDepartments(prev => prev.filter(d => d.department_id !== id)) }
    catch { alert('เกิดข้อผิดพลาด') }
  }

  const handleSaveLoc = async () => {
    try {
      if (editTarget) {
        await api.put(`/locations/${editTarget.location_id}`, locForm)
        setLocations(prev => prev.map(l => l.location_id === editTarget.location_id
          ? { ...l, ...locForm, department_id: Number(locForm.department_id) || null } : l))
      } else {
        const res = await api.post('/locations', locForm)
        setLocations(prev => [...prev, { location_id: res.data.location_id, ...locForm, department_id: Number(locForm.department_id) || null }])
      }
      setShowLocModal(false); setEditTarget(null); setLocForm({ building: '', floor: '', room: '', department_id: '' })
    } catch { alert('เกิดข้อผิดพลาด') }
  }

  const handleDeleteLoc = async (id: number) => {
    if (!confirm('ลบสถานที่นี้?')) return
    try { await api.delete(`/locations/${id}`); setLocations(prev => prev.filter(l => l.location_id !== id)) }
    catch { alert('เกิดข้อผิดพลาด') }
  }

  const stats = {
    total: complaints.length,
    pending: complaints.filter(c => c.status === 'pending').length,
    in_progress: complaints.filter(c => c.status === 'in_progress').length,
    resolved: complaints.filter(c => c.status === 'resolved').length,
    forwarded: complaints.filter(c => c.status === 'forwarded').length,
  }

  const filteredUsers = users.filter(u =>
    u.firstname.toLowerCase().includes(searchUser.toLowerCase()) ||
    u.lastname.toLowerCase().includes(searchUser.toLowerCase()) ||
    u.email.toLowerCase().includes(searchUser.toLowerCase())
  )

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800">⚙️ Admin Panel</h1>
          <p className="text-gray-400 text-sm mt-1">จัดการระบบและข้อมูลพื้นฐาน</p>
        </div>

        <div className="flex gap-2 mb-6 border-b border-gray-200 overflow-x-auto">
          {[
            { key: 'overview', label: '📊 ภาพรวม' },
            { key: 'users', label: '👥 ผู้ใช้' },
            { key: 'master', label: '🗂️ Master Data' },
            { key: 'complaints', label: '📋 คำร้องทั้งหมด' },
            { key: 'audit', label: '📝 Audit Log' },
            { key: 'system', label: '🖥️ System Log' },
            { key: 'broadcast', label: '📢 แจ้งเตือนฉุกเฉิน' },
          ].map(t => (
            <button key={t.key} onClick={() => setActiveTab(t.key)}
              className={`px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors
                ${activeTab === t.key ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
              {t.label}
            </button>
          ))}
        </div>

        {activeTab === 'overview' && (
          <div>
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
            <div className="grid grid-cols-3 gap-4">
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
        )}

        {activeTab === 'users' && (
          <div>
            <input placeholder="ค้นหาชื่อ หรืออีเมล..." value={searchUser}
              onChange={e => setSearchUser(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-blue-100" />
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
                        <select value={u.role} onChange={e => handleChangeRole(u.user_id, e.target.value)}
                          className={`text-xs px-2 py-1 rounded-full font-medium border-0 cursor-pointer ${roleBadgeColor[u.role]}`}>
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
                        <button onClick={() => handleToggleUser(u.user_id)}
                          className={`text-xs px-3 py-1.5 rounded-lg font-medium ${u.is_active ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-green-50 text-green-600 hover:bg-green-100'}`}>
                          {u.is_active ? 'ปิดใช้งาน' : 'เปิดใช้งาน'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'master' && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
              <div className="flex justify-between items-center mb-4">
                <h2 className="font-semibold text-gray-800">🏷️ หมวดหมู่</h2>
                <button onClick={() => { setEditTarget(null); setCatForm({ category_name: '', for_role: 'all' }); setShowCatModal(true) }}
                  className="text-xs px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700">+ เพิ่ม</button>
              </div>
              <div className="space-y-2">
                {categories.map(c => (
                  <div key={c.category_id} className="flex justify-between items-center px-3 py-2 bg-gray-50 rounded-xl">
                    <span className="text-sm text-gray-700">{c.category_name}</span>
                    <div className="flex gap-2">
                      <button onClick={() => { setEditTarget(c); setCatForm({ category_name: c.category_name, for_role: c.for_role }); setShowCatModal(true) }}
                        className="text-xs px-2 py-1 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100">แก้ไข</button>
                      <button onClick={() => handleDeleteCat(c.category_id)}
                        className="text-xs px-2 py-1 bg-red-50 text-red-600 rounded-lg hover:bg-red-100">ลบ</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
              <div className="flex justify-between items-center mb-4">
                <h2 className="font-semibold text-gray-800">🏫 คณะ/หน่วยงาน</h2>
                <button onClick={() => { setEditTarget(null); setDeptForm({ department_name: '' }); setShowDeptModal(true) }}
                  className="text-xs px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700">+ เพิ่ม</button>
              </div>
              <div className="space-y-2">
                {departments.map(d => (
                  <div key={d.department_id} className="flex justify-between items-center px-3 py-2 bg-gray-50 rounded-xl">
                    <span className="text-sm text-gray-700">{d.department_name}</span>
                    <div className="flex gap-2">
                      <button onClick={() => { setEditTarget(d); setDeptForm({ department_name: d.department_name }); setShowDeptModal(true) }}
                        className="text-xs px-2 py-1 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100">แก้ไข</button>
                      <button onClick={() => handleDeleteDept(d.department_id)}
                        className="text-xs px-2 py-1 bg-red-50 text-red-600 rounded-lg hover:bg-red-100">ลบ</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
              <div className="flex justify-between items-center mb-4">
                <h2 className="font-semibold text-gray-800">📍 สถานที่</h2>
                <button onClick={() => { setEditTarget(null); setLocForm({ building: '', floor: '', room: '', department_id: '' }); setShowLocModal(true) }}
                  className="text-xs px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700">+ เพิ่ม</button>
              </div>
              <div className="space-y-2">
                {locations.map(l => (
                  <div key={l.location_id} className="flex justify-between items-center px-3 py-2 bg-gray-50 rounded-xl">
                    <span className="text-sm text-gray-700">{l.building} {l.floor ? `ชั้น ${l.floor}` : ''} {l.room ? `ห้อง ${l.room}` : ''}</span>
                    <div className="flex gap-2">
                      <button onClick={() => { setEditTarget(l); setLocForm({ building: l.building, floor: l.floor || '', room: l.room || '', department_id: String(l.department_id || '') }); setShowLocModal(true) }}
                        className="text-xs px-2 py-1 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100">แก้ไข</button>
                      <button onClick={() => handleDeleteLoc(l.location_id)}
                        className="text-xs px-2 py-1 bg-red-50 text-red-600 rounded-lg hover:bg-red-100">ลบ</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'complaints' && (
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-4 py-3 text-xs text-gray-500 font-medium">#</th>
                  <th className="text-left px-4 py-3 text-xs text-gray-500 font-medium">หัวข้อ</th>
                  <th className="text-left px-4 py-3 text-xs text-gray-500 font-medium">คณะ</th>
                  <th className="text-left px-4 py-3 text-xs text-gray-500 font-medium">ผู้แจ้ง</th>
                  <th className="text-left px-4 py-3 text-xs text-gray-500 font-medium">สถานะ</th>
                  <th className="text-left px-4 py-3 text-xs text-gray-500 font-medium">วันที่</th>
                </tr>
              </thead>
              <tbody>
                {complaints.map(c => {
                  const sCfg = statusConfig[c.status] || statusConfig['pending']
                  return (
                    <tr key={c.issue_id} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="px-4 py-3 text-gray-400 text-xs">#{c.issue_id}</td>
                      <td className="px-4 py-3 font-medium text-gray-800">{c.title}</td>
                      <td className="px-4 py-3 text-gray-500 text-xs">{c.department_name || '-'}</td>
                      <td className="px-4 py-3 text-gray-500 text-xs">{c.firstname} {c.lastname}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${sCfg.color}`}>{sCfg.label}</span>
                      </td>
                      <td className="px-4 py-3 text-gray-400 text-xs">
                        {new Date(c.created_at).toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric' })}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'audit' && (
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-4 py-3 text-xs text-gray-500 font-medium">เวลา</th>
                  <th className="text-left px-4 py-3 text-xs text-gray-500 font-medium">Admin</th>
                  <th className="text-left px-4 py-3 text-xs text-gray-500 font-medium">การกระทำ</th>
                  <th className="text-left px-4 py-3 text-xs text-gray-500 font-medium">รายละเอียด</th>
                </tr>
              </thead>
              <tbody>
                {auditLogs.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-10 text-center text-gray-400">ยังไม่มีประวัติการดำเนินการ</td>
                  </tr>
                ) : auditLogs.map(log => (
                  <tr key={log.log_id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="px-4 py-3 text-xs text-gray-400">
                      {new Date(log.created_at).toLocaleDateString('th-TH', {
                        year: 'numeric', month: 'short', day: 'numeric',
                        hour: '2-digit', minute: '2-digit'
                      })}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-600">{log.admin_firstname} {log.admin_lastname}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                        log.action === 'DISABLE_USER' ? 'bg-red-100 text-red-600' :
                        log.action === 'ENABLE_USER' ? 'bg-green-100 text-green-600' :
                        'bg-blue-100 text-blue-600'
                      }`}>{log.action}</span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">{log.detail}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'broadcast' && (
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm max-w-xl">
            <h2 className="font-semibold text-gray-800 mb-1">ส่งแจ้งเตือนฉุกเฉิน</h2>
            <p className="text-xs text-gray-400 mb-5">ข้อความจะถูกส่งทันทีไปยังกลุ่มที่เลือก</p>

            <label className="text-xs text-gray-500 mb-1 block font-medium">กลุ่มผู้รับ</label>
            <div className="flex flex-wrap gap-2 mb-4">
              {[
                { val: 'all',       label: 'ทุกคน' },
                { val: 'student',   label: 'นักศึกษา' },
                { val: 'personnel', label: 'บุคลากร' },
                { val: 'samo',      label: 'สโมสร' },
                { val: 'officer',   label: 'เจ้าหน้าที่' },
              ].map(r => (
                <button key={r.val}
                  onClick={() => {
                    if (r.val === 'all') { setBroadcastRoles(['all']); return }
                    const filtered = broadcastRoles.filter(x => x !== 'all')
                    setBroadcastRoles(filtered.includes(r.val)
                      ? filtered.filter(x => x !== r.val)
                      : [...filtered, r.val])
                  }}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                    broadcastRoles.includes(r.val) || (r.val !== 'all' && broadcastRoles.includes('all') && r.val === 'all')
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'
                  }`}>
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
              onChange={e => { setBroadcastMsg(e.target.value); setBroadcastResult('') }}
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
        )}

        {activeTab === 'system' && (
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
                <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                    <th className="text-left px-4 py-3 text-xs text-gray-500 font-medium">เวลา</th>
                    <th className="text-left px-4 py-3 text-xs text-gray-500 font-medium">ประเภท</th>
                    <th className="text-left px-4 py-3 text-xs text-gray-500 font-medium">ข้อความ</th>
                    <th className="text-left px-4 py-3 text-xs text-gray-500 font-medium">IP</th>
                    </tr>
                </thead>
                <tbody>
                    {systemLogs.length === 0 ? (
                    <tr>
                        <td colSpan={4} className="px-4 py-10 text-center text-gray-400">ยังไม่มี System Log</td>
                    </tr>
                    ) : systemLogs.map(log => (
                    <tr key={log.log_id} className="border-b border-gray-50 hover:bg-gray-50">
                        <td className="px-4 py-3 text-xs text-gray-400">
                        {new Date(log.created_at).toLocaleDateString('th-TH', {
                            year: 'numeric', month: 'short', day: 'numeric',
                            hour: '2-digit', minute: '2-digit'
                        })}
                        </td>
                        <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                            log.type === 'LOGIN_FAILED' ? 'bg-red-100 text-red-600' :
                            log.type === 'ERROR' ? 'bg-orange-100 text-orange-600' :
                            log.type === 'WARNING' ? 'bg-yellow-100 text-yellow-600' :
                            'bg-gray-100 text-gray-600'
                        }`}>{log.type}</span>
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-600">{log.message}</td>
                        <td className="px-4 py-3 text-xs text-gray-400">{log.ip_address || '-'}</td>
                    </tr>
                    ))}
                </tbody>
                </table>
            </div>
            )}

      </div>

      {showCatModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center px-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-xl">
            <h2 className="font-bold text-gray-800 mb-4">{editTarget ? 'แก้ไขหมวดหมู่' : 'เพิ่มหมวดหมู่'}</h2>
            <label className="text-xs text-gray-500 mb-1 block">ชื่อหมวดหมู่ *</label>
            <input value={catForm.category_name} onChange={e => setCatForm({ ...catForm, category_name: e.target.value })}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-blue-100" />
            <label className="text-xs text-gray-500 mb-1 block">สำหรับ Role</label>
            <select value={catForm.for_role} onChange={e => setCatForm({ ...catForm, for_role: e.target.value })}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-blue-100 bg-white">
              <option value="all">ทุก Role</option>
              <option value="student">นักศึกษา</option>
              <option value="personnel">บุคลากร</option>
            </select>
            <div className="flex gap-3">
              <button onClick={() => { setShowCatModal(false); setEditTarget(null) }}
                className="flex-1 border border-gray-200 rounded-xl py-2.5 text-sm text-gray-600 hover:bg-gray-50">ยกเลิก</button>
              <button onClick={handleSaveCat}
                className="flex-1 bg-blue-600 text-white rounded-xl py-2.5 text-sm font-semibold hover:bg-blue-700">บันทึก</button>
            </div>
          </div>
        </div>
      )}

      {showDeptModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center px-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-xl">
            <h2 className="font-bold text-gray-800 mb-4">{editTarget ? 'แก้ไขคณะ' : 'เพิ่มคณะ'}</h2>
            <label className="text-xs text-gray-500 mb-1 block">ชื่อคณะ *</label>
            <input value={deptForm.department_name} onChange={e => setDeptForm({ department_name: e.target.value })}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-blue-100" />
            <div className="flex gap-3">
              <button onClick={() => { setShowDeptModal(false); setEditTarget(null) }}
                className="flex-1 border border-gray-200 rounded-xl py-2.5 text-sm text-gray-600 hover:bg-gray-50">ยกเลิก</button>
              <button onClick={handleSaveDept}
                className="flex-1 bg-blue-600 text-white rounded-xl py-2.5 text-sm font-semibold hover:bg-blue-700">บันทึก</button>
            </div>
          </div>
        </div>
      )}

      {showLocModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center px-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-xl">
            <h2 className="font-bold text-gray-800 mb-4">{editTarget ? 'แก้ไขสถานที่' : 'เพิ่มสถานที่'}</h2>
            <label className="text-xs text-gray-500 mb-1 block">ชื่ออาคาร *</label>
            <input value={locForm.building} onChange={e => setLocForm({ ...locForm, building: e.target.value })}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-blue-100" />
            <label className="text-xs text-gray-500 mb-1 block">ชั้น</label>
            <input value={locForm.floor} onChange={e => setLocForm({ ...locForm, floor: e.target.value })}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-blue-100" />
            <label className="text-xs text-gray-500 mb-1 block">ห้อง</label>
            <input value={locForm.room} onChange={e => setLocForm({ ...locForm, room: e.target.value })}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-blue-100" />
            <label className="text-xs text-gray-500 mb-1 block">คณะ</label>
            <select value={locForm.department_id} onChange={e => setLocForm({ ...locForm, department_id: e.target.value })}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-blue-100 bg-white">
              <option value="">ไม่ระบุ</option>
              {departments.map(d => (
                <option key={d.department_id} value={d.department_id}>{d.department_name}</option>
              ))}
            </select>
            <div className="flex gap-3">
              <button onClick={() => { setShowLocModal(false); setEditTarget(null) }}
                className="flex-1 border border-gray-200 rounded-xl py-2.5 text-sm text-gray-600 hover:bg-gray-50">ยกเลิก</button>
              <button onClick={handleSaveLoc}
                className="flex-1 bg-blue-600 text-white rounded-xl py-2.5 text-sm font-semibold hover:bg-blue-700">บันทึก</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}