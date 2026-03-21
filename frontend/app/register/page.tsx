'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import api from '../lib/api'

type Role = 'student' | 'personnel' | 'samo' | 'officer'

const roles: { value: Role; label: string; icon: string; idLabel: string; idPlaceholder: string }[] = [
  { value: 'student',   label: 'นักศึกษา',                  icon: '🎓', idLabel: 'รหัสนักศึกษา',  idPlaceholder: 'เช่น 65010001' },
  { value: 'personnel', label: 'บุคลากร (อาจารย์/เจ้าหน้าที่)', icon: '👔', idLabel: 'รหัสพนักงาน',   idPlaceholder: 'เช่น EMP001' },
  { value: 'samo',      label: 'สโมสรคณะ',                  icon: '🏫', idLabel: 'รหัสพนักงาน',   idPlaceholder: 'เช่น SAMO001' },
  { value: 'officer',   label: 'เจ้าหน้าที่มหาวิทยาลัย',    icon: '🏛️', idLabel: 'รหัสพนักงาน',   idPlaceholder: 'เช่น OFF001' },
]

export default function RegisterPage() {
  const router = useRouter()
  const [selectedRole, setSelectedRole] = useState<Role>('student')
  const [form, setForm] = useState({
    firstname: '',
    lastname: '',
    email: '',
    password: '',
    confirmPassword: '',
    idCode: '',   // student_id หรือ employee_code ขึ้นอยู่กับ role
    phone: '',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const set = (key: string, val: string) => setForm(f => ({ ...f, [key]: val }))

  const currentRole = roles.find(r => r.value === selectedRole)!

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (form.password !== form.confirmPassword) {
      setError('รหัสผ่านไม่ตรงกัน')
      return
    }
    if (form.password.length < 8) {
      setError('รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร')
      return
    }

    setLoading(true)
    try {
      await api.post('/auth/register', {
        firstname:     form.firstname,
        lastname:      form.lastname,
        email:         form.email,
        password:      form.password,
        role:          selectedRole,
        phone:         form.phone || null,
        student_id:    selectedRole === 'student' ? form.idCode : null,
        employee_code: selectedRole !== 'student' ? form.idCode : null,
      })
      router.push('/login?registered=1')
    } catch (err: any) {
      setError(err?.response?.data?.message || 'เกิดข้อผิดพลาด กรุณาลองใหม่')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 w-full max-w-md p-8">

        {/* Header */}
        <div className="text-center mb-8">
          <span className="text-blue-600 font-bold text-2xl tracking-tight">IMS</span>
          <h1 className="text-xl font-semibold text-gray-800 mt-2">สมัครสมาชิก</h1>
          <p className="text-gray-400 text-sm mt-1">ระบบแจ้งและติดตามปัญหา</p>
        </div>

        {/* Role selector */}
        <div className="mb-6">
          <label className="text-xs text-gray-500 mb-2 block">ประเภทผู้ใช้งาน</label>
          <div className="grid grid-cols-2 gap-2">
            {roles.map(r => (
              <button
                key={r.value}
                type="button"
                onClick={() => setSelectedRole(r.value)}
                className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm font-medium transition-all text-left
                  ${selectedRole === r.value
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                  }`}
              >
                <span>{r.icon}</span>
                <span className="leading-tight">{r.label}</span>
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 rounded-lg px-4 py-3 text-sm mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">

          {/* ชื่อ - นามสกุล */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">ชื่อ *</label>
              <input required placeholder="ชื่อ"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400"
                value={form.firstname} onChange={e => set('firstname', e.target.value)} />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">นามสกุล *</label>
              <input required placeholder="นามสกุล"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400"
                value={form.lastname} onChange={e => set('lastname', e.target.value)} />
            </div>
          </div>

          {/* รหัสตาม role */}
          <div>
            <label className="text-xs text-gray-500 mb-1 block">{currentRole.idLabel} *</label>
            <input required placeholder={currentRole.idPlaceholder}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400"
              value={form.idCode} onChange={e => set('idCode', e.target.value)} />
          </div>

          {/* อีเมล */}
          <div>
            <label className="text-xs text-gray-500 mb-1 block">อีเมล *</label>
            <input required type="email" placeholder="example@email.com"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400"
              value={form.email} onChange={e => set('email', e.target.value)} />
          </div>

          {/* เบอร์โทร */}
          <div>
            <label className="text-xs text-gray-500 mb-1 block">เบอร์โทรศัพท์</label>
            <input type="tel" placeholder="0812345678"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400"
              value={form.phone} onChange={e => set('phone', e.target.value)} />
          </div>

          {/* รหัสผ่าน */}
          <div>
            <label className="text-xs text-gray-500 mb-1 block">รหัสผ่าน *</label>
            <input required type="password" placeholder="อย่างน้อย 8 ตัวอักษร" minLength={8}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400"
              value={form.password} onChange={e => set('password', e.target.value)} />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">ยืนยันรหัสผ่าน *</label>
            <input required type="password" placeholder="กรอกรหัสผ่านอีกครั้ง"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400"
              value={form.confirmPassword} onChange={e => set('confirmPassword', e.target.value)} />
          </div>

          <button disabled={loading}
            className="w-full bg-blue-600 text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 mt-2">
            {loading ? 'กำลังสมัคร...' : 'สมัครสมาชิก'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-400 mt-6">
          มีบัญชีอยู่แล้ว?{' '}
          <button onClick={() => router.push('/login')}
            className="text-blue-600 hover:underline font-medium">
            เข้าสู่ระบบ
          </button>
        </p>
      </div>
    </div>
  )
}