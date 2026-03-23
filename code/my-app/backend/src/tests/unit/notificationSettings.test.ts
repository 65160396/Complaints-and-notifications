// tests/unit/notificationSettings.test.ts
// ครอบคลุม: TC-009, TC-027, TC-043, TC-058

jest.mock('../../db', () => ({ execute: jest.fn() }))

import pool from '../../db'
import {
  getSettings,
  updateSettings,
  resetSettings,
} from '../../controllers/notificationSettingsController'

const mockReq = (overrides = {}) => ({
  user: { id: 1, email: 'student@buu.ac.th', role: 'student' },
  body: {},
  ...overrides,
} as any)

const mockRes = () => {
  const res: any = {}
  res.status = jest.fn().mockReturnValue(res)
  res.json = jest.fn().mockReturnValue(res)
  return res
}

// ─── getSettings ─────────────────────────────────────────────────────────────

describe('getSettings', () => {
  beforeEach(() => jest.clearAllMocks())

  // มี settings อยู่แล้ว → return settings
  test('มี settings อยู่แล้ว → return settings + is_default: false', async () => {
    const fakeSettings = { setting_id: 1, user_id: 1, in_app_enabled: 1, notify_status_change: 1, notify_new_complaint: 0 }
    ;(pool.execute as jest.Mock).mockResolvedValueOnce([[fakeSettings]])

    const req = mockReq()
    const res = mockRes()
    await getSettings(req, res)

    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ is_default: false }))
  })

  // ยังไม่มี settings → return default
  test('ยังไม่มี settings → return default values + is_default: true', async () => {
    ;(pool.execute as jest.Mock).mockResolvedValueOnce([[]])

    const req = mockReq()
    const res = mockRes()
    await getSettings(req, res)

    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      in_app_enabled: 1,
      notify_status_change: 1,
      notify_new_complaint: 1,
      is_default: true,
    }))
  })
})

// ─── updateSettings ───────────────────────────────────────────────────────────

describe('updateSettings', () => {
  beforeEach(() => jest.clearAllMocks())

  // TC-009/TC-027/TC-043/TC-058: UPDATE settings ที่มีอยู่แล้ว
  test('TC-009: มี settings อยู่แล้ว → UPDATE สำเร็จ', async () => {
    ;(pool.execute as jest.Mock)
      .mockResolvedValueOnce([[{ setting_id: 1 }]])  // existing
      .mockResolvedValueOnce([{ affectedRows: 1 }])   // UPDATE

    const req = mockReq({
      body: { in_app_enabled: 0, notify_status_change: 1, notify_new_complaint: 1 }
    })
    const res = mockRes()
    await updateSettings(req, res)

    expect(res.json).toHaveBeenCalledWith({ message: 'บันทึกการตั้งค่าเรียบร้อยแล้ว' })
  })

  // ยังไม่มี settings → INSERT ใหม่
  test('TC-027: ยังไม่มี settings → INSERT ใหม่สำเร็จ', async () => {
    ;(pool.execute as jest.Mock)
      .mockResolvedValueOnce([[]])                    // ไม่มี existing
      .mockResolvedValueOnce([{ insertId: 1 }])       // INSERT

    const req = mockReq({
      body: { in_app_enabled: 1, notify_status_change: 0, notify_new_complaint: 1 }
    })
    const res = mockRes()
    await updateSettings(req, res)

    expect(res.json).toHaveBeenCalledWith({ message: 'บันทึกการตั้งค่าเรียบร้อยแล้ว' })
  })

  // ไม่ส่ง body → ใช้ค่า default
  test('ไม่ส่ง body → ใช้ค่า default สำเร็จ', async () => {
    ;(pool.execute as jest.Mock)
      .mockResolvedValueOnce([[{ setting_id: 1 }]])
      .mockResolvedValueOnce([{ affectedRows: 1 }])

    const req = mockReq({ body: {} })
    const res = mockRes()
    await updateSettings(req, res)

    expect(res.json).toHaveBeenCalledWith({ message: 'บันทึกการตั้งค่าเรียบร้อยแล้ว' })
  })
})

// ─── resetSettings ────────────────────────────────────────────────────────────

describe('resetSettings', () => {
  beforeEach(() => jest.clearAllMocks())

  // คืนค่า default → สำเร็จ
  test('คืนค่า default → return default settings', async () => {
    ;(pool.execute as jest.Mock).mockResolvedValueOnce([{ affectedRows: 1 }])

    const req = mockReq()
    const res = mockRes()
    await resetSettings(req, res)

    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      message: 'คืนค่าเริ่มต้นเรียบร้อยแล้ว',
      settings: expect.objectContaining({
        in_app_enabled: 1,
        notify_status_change: 1,
        notify_new_complaint: 1,
      })
    }))
  })
})