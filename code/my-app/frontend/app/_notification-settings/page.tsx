'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import api, { getUser } from '../lib/api'

interface Settings {
  in_app_enabled:        boolean
  notify_status_change:  boolean
  notify_new_complaint:  boolean
}

const DEFAULT: Settings = {
  in_app_enabled:       true,
  notify_status_change: true,
  notify_new_complaint: true,
}

// Toggle component
function ToggleRow({
  label,
  description,
  value,
  onChange,
  disabled,
}: {
  label: string
  description: string
  value: boolean
  onChange: (v: boolean) => void
  disabled?: boolean
}) {
  return (
    <div className={`flex items-center justify-between py-4 ${disabled ? 'opacity-40' : ''}`}>
      <div className="flex-1 min-w-0 pr-4">
        <p className="text-sm font-medium text-gray-800">{label}</p>
        <p className="text-xs text-gray-400 mt-0.5">{description}</p>
      </div>
      <button
        type="button"
        disabled={disabled}
        onClick={() => onChange(!value)}
        className={`relative w-11 h-6 rounded-full transition-colors shrink-0
          ${value ? 'bg-blue-600' : 'bg-gray-200'}`}
      >
        <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform
          ${value ? 'translate-x-5' : 'translate-x-0'}`}
        />
      </button>
    </div>
  )
}

export default function NotificationSettingsPage() {
  const router = useRouter()
  const [settings, setSettings] = useState<Settings>(DEFAULT)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const user = getUser()

  useEffect(() => {
    if (!user) { router.push('/login'); return }

    api.get('/notification-settings')
      .then(res => {
        setSettings({
          in_app_enabled:       !!res.data.in_app_enabled,
          notify_status_change: !!res.data.notify_status_change,
          notify_new_complaint: !!res.data.notify_new_complaint,
        })
      })
      .catch(() => setSettings(DEFAULT))
      .finally(() => setLoading(false))
  }, [])

  const handleSave = async () => {
    setSaving(true)
    setMsg(null)
    try {
      await api.patch('/notification-settings', {
        in_app_enabled:       settings.in_app_enabled       ? 1 : 0,
        notify_status_change: settings.notify_status_change ? 1 : 0,
        notify_new_complaint: settings.notify_new_complaint ? 1 : 0,
      })
      setMsg({ type: 'success', text: 'บันทึกการตั้งค่าเรียบร้อยแล้ว' })
    } catch {
      setMsg({ type: 'error', text: 'เกิดข้อผิดพลาด กรุณาลองใหม่' })
    } finally {
      setSaving(false)
    }
  }

  const handleReset = async () => {
    setSaving(true)
    setMsg(null)
    try {
      await api.post('/notification-settings/reset')
      setSettings(DEFAULT)
      setMsg({ type: 'success', text: 'คืนค่าเริ่มต้นเรียบร้อยแล้ว' })
    } catch {
      setMsg({ type: 'error', text: 'เกิดข้อผิดพลาด กรุณาลองใหม่' })
    } finally {
      setSaving(false)
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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-xl mx-auto px-4 py-8">

        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800">ตั้งค่าการแจ้งเตือน</h1>
          <p className="text-gray-400 text-sm mt-1">เลือกรูปแบบการรับแจ้งเตือนที่ต้องการ</p>
        </div>

        {msg && (
          <div className={`rounded-xl px-4 py-3 text-sm mb-5 ${
            msg.type === 'success'
              ? 'bg-green-50 border border-green-200 text-green-700'
              : 'bg-red-50 border border-red-200 text-red-600'
          }`}>
            {msg.text}
          </div>
        )}

        {/* Settings card */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-6 divide-y divide-gray-50">

          {/* Section: ช่องทาง */}
          <div className="py-4">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">ช่องทางการแจ้งเตือน</p>
          </div>

          <ToggleRow
            label="แจ้งเตือนในระบบ (In-app)"
            description="แสดงกระดิ่ง 🔔 และรายการแจ้งเตือนภายในระบบ"
            value={settings.in_app_enabled}
            onChange={v => setSettings(s => ({ ...s, in_app_enabled: v }))}
          />

          {/* Section: ประเภท */}
          <div className="py-4">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">ประเภทการแจ้งเตือน</p>
          </div>

          <ToggleRow
            label="สถานะคำร้องเปลี่ยน"
            description="แจ้งเมื่อคำร้องของคุณถูกอัปเดตสถานะ"
            value={settings.notify_status_change}
            onChange={v => setSettings(s => ({ ...s, notify_status_change: v }))}
            disabled={!settings.in_app_enabled}
          />

          {/* แสดงเฉพาะ role ที่รับเรื่อง */}
          {['personnel', 'samo', 'officer', 'admin'].includes(user?.role) && (
            <ToggleRow
              label="มีคำร้องใหม่เข้ามา"
              description="แจ้งเมื่อมีนิสิต/บุคลากรส่งคำร้องใหม่เข้าระบบ"
              value={settings.notify_new_complaint}
              onChange={v => setSettings(s => ({ ...s, notify_new_complaint: v }))}
              disabled={!settings.in_app_enabled}
            />
          )}
        </div>

        {/* ปิด in_app → แจ้งเตือนว่าจะไม่ได้รับแจ้งเตือนใดๆ */}
        {!settings.in_app_enabled && (
          <div className="mt-3 bg-yellow-50 border border-yellow-200 rounded-xl px-4 py-3 text-sm text-yellow-700">
            ⚠️ เมื่อปิดการแจ้งเตือนในระบบ คุณจะไม่ได้รับแจ้งเตือนใดๆ ทั้งหมด
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 mt-6">
          <button
            onClick={handleReset}
            disabled={saving}
            className="flex-1 border border-gray-200 rounded-xl py-2.5 text-sm text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            คืนค่าเริ่มต้น
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 bg-blue-600 text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {saving ? 'กำลังบันทึก...' : 'บันทึกการตั้งค่า'}
          </button>
        </div>
      </div>
    </div>
  )
}