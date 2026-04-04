'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import api, { getUser } from '../../lib/api'

interface Profile {
  user_id: number
  firstname: string
  lastname: string
  email: string
  role: string
  phone: string | null
  student_id: string | null
  employee_code: string | null
}

const roleLabel: Record<string, string> = {
  student:   'นักศึกษา',
  personnel: 'บุคลากร',
  samo:      'สโมสรคณะ',
  officer:   'เจ้าหน้าที่มหาวิทยาลัย',
  admin:     'ผู้ดูแลระบบ',
}

const roleBadgeColor: Record<string, string> = {
  student:   'bg-blue-100 text-blue-700',
  personnel: 'bg-green-100 text-green-700',
  samo:      'bg-yellow-100 text-yellow-700',
  officer:   'bg-orange-100 text-orange-700',
  admin:     'bg-purple-100 text-purple-700',
}

type Tab = 'info' | 'password'

export default function ProfilePage() {
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<Tab>('info')

  // info form
  const [form, setForm] = useState({ firstname: '', lastname: '', phone: '' })
  const [infoLoading, setInfoLoading] = useState(false)
  const [infoMsg, setInfoMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // password form
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' })
  const [pwLoading, setPwLoading] = useState(false)
  const [pwMsg, setPwMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    const user = getUser()
    if (!user) { 
      router.push('/login'); 
      return 
    }

    api.get('/profile')
      .then(res => {
        setProfile(res.data)
        setForm({
          firstname: res.data.firstname,
          lastname:  res.data.lastname,
          phone:     res.data.phone || '',
        })
      })
      .catch(() => router.push('/login'))
      .finally(() => setLoading(false))
  }, [])

  const handleUpdateInfo = async (e: React.FormEvent) => {
    e.preventDefault()
    setInfoMsg(null)
    setInfoLoading(true)
    try {
      const res = await api.patch('/profile', form)
      // อัปเดต localStorage ด้วย
      const currentUser = getUser()
      localStorage.setItem('user', JSON.stringify({
        ...currentUser,
        firstname: form.firstname,
        lastname:  form.lastname,
      }))
      setProfile(res.data.user)
      setInfoMsg({ type: 'success', text: 'อัปเดตโปรไฟล์เรียบร้อยแล้ว' })
    } catch (err: any) {
      setInfoMsg({ type: 'error', text: err?.response?.data?.message || 'เกิดข้อผิดพลาด' })
    } finally {
      setInfoLoading(false)
    }
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setPwMsg(null)

    if (pwForm.newPassword !== pwForm.confirmPassword) {
      setPwMsg({ type: 'error', text: 'รหัสผ่านใหม่ไม่ตรงกัน' })
      return
    }
    if (pwForm.newPassword.length < 8) {
      setPwMsg({ type: 'error', text: 'รหัสผ่านใหม่ต้องมีอย่างน้อย 8 ตัวอักษร' })
      return
    }

    setPwLoading(true)
    try {
      await api.patch('/profile/change-password', {
        currentPassword: pwForm.currentPassword,
        newPassword:     pwForm.newPassword,
      })
      setPwMsg({ type: 'success', text: 'เปลี่ยนรหัสผ่านเรียบร้อยแล้ว' })
      setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
    } catch (err: any) {
      setPwMsg({ type: 'error', text: err?.response?.data?.message || 'เกิดข้อผิดพลาด' })
    } finally {
      setPwLoading(false)
    }
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-gray-400 text-sm">กำลังโหลด...</p>
      </div>
    </div>
  )

  if (!profile) return null

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-xl mx-auto px-4 py-8">

        {/* Profile header card */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-6 flex items-center gap-5 shadow-sm">
          <div className="w-16 h-16 rounded-full bg-blue-600 flex items-center justify-center text-white text-2xl font-bold shrink-0">
            {profile.firstname[0]}
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-800">{profile.firstname} {profile.lastname}</h1>
            <p className="text-sm text-gray-400 mt-0.5">{profile.email}</p>
            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${roleBadgeColor[profile.role] || 'bg-gray-100 text-gray-600'}`}>
                {roleLabel[profile.role] || profile.role}
              </span>
              {profile.student_id && (
                <span className="text-xs text-gray-400">รหัสนักศึกษา: {profile.student_id}</span>
              )}
              {profile.employee_code && (
                <span className="text-xs text-gray-400">รหัสพนักงาน: {profile.employee_code}</span>
              )}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex bg-gray-100 rounded-xl p-1 mb-6">
          {([
            { key: 'info',     label: '👤 ข้อมูลส่วนตัว' },
            { key: 'password', label: '🔒 เปลี่ยนรหัสผ่าน' },
          ] as { key: Tab; label: string }[]).map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all
                ${tab === t.key ? 'bg-white shadow text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Tab: ข้อมูลส่วนตัว */}
        {tab === 'info' && (
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
            <h2 className="font-semibold text-gray-800 mb-5">แก้ไขข้อมูลส่วนตัว</h2>

            {infoMsg && (
              <div className={`rounded-lg px-4 py-3 text-sm mb-4 ${
                infoMsg.type === 'success'
                  ? 'bg-green-50 border border-green-200 text-green-700'
                  : 'bg-red-50 border border-red-200 text-red-600'
              }`}>
                {infoMsg.text}
              </div>
            )}

            <form onSubmit={handleUpdateInfo} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">ชื่อ *</label>
                  <input required
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400"
                    value={form.firstname}
                    onChange={e => setForm({ ...form, firstname: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">นามสกุล *</label>
                  <input required
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400"
                    value={form.lastname}
                    onChange={e => setForm({ ...form, lastname: e.target.value })}
                  />
                </div>
              </div>

              {/* อีเมล — แสดงอย่างเดียว ไม่ให้แก้ */}
              <div>
                <label className="text-xs text-gray-500 mb-1 block">อีเมล (ไม่สามารถแก้ไขได้)</label>
                <input disabled value={profile.email}
                  className="w-full border border-gray-100 rounded-lg px-3 py-2 text-sm bg-gray-50 text-gray-400 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="text-xs text-gray-500 mb-1 block">เบอร์โทรศัพท์</label>
                <input type="tel" placeholder="0812345678"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400"
                  value={form.phone}
                  onChange={e => setForm({ ...form, phone: e.target.value })}
                />
              </div>

              <button disabled={infoLoading}
                className="w-full bg-blue-600 text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 mt-2">
                {infoLoading ? 'กำลังบันทึก...' : 'บันทึกการเปลี่ยนแปลง'}
              </button>
            </form>
          </div>
        )}

        {/* Tab: เปลี่ยนรหัสผ่าน */}
        {tab === 'password' && (
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
            <h2 className="font-semibold text-gray-800 mb-5">เปลี่ยนรหัสผ่าน</h2>

            {pwMsg && (
              <div className={`rounded-lg px-4 py-3 text-sm mb-4 ${
                pwMsg.type === 'success'
                  ? 'bg-green-50 border border-green-200 text-green-700'
                  : 'bg-red-50 border border-red-200 text-red-600'
              }`}>
                {pwMsg.text}
              </div>
            )}

            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">รหัสผ่านปัจจุบัน *</label>
                <input required type="password" placeholder="รหัสผ่านปัจจุบัน"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400"
                  value={pwForm.currentPassword}
                  onChange={e => setPwForm({ ...pwForm, currentPassword: e.target.value })}
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">รหัสผ่านใหม่ *</label>
                <input required type="password" placeholder="อย่างน้อย 8 ตัวอักษร" minLength={8}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400"
                  value={pwForm.newPassword}
                  onChange={e => setPwForm({ ...pwForm, newPassword: e.target.value })}
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">ยืนยันรหัสผ่านใหม่ *</label>
                <input required type="password" placeholder="กรอกรหัสผ่านใหม่อีกครั้ง"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400"
                  value={pwForm.confirmPassword}
                  onChange={e => setPwForm({ ...pwForm, confirmPassword: e.target.value })}
                />
              </div>
              <button disabled={pwLoading}
                className="w-full bg-blue-600 text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 mt-2">
                {pwLoading ? 'กำลังบันทึก...' : 'เปลี่ยนรหัสผ่าน'}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  )
}