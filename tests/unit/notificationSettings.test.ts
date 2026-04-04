// tests/unit/notificationSettings.test.ts
// ครอบคลุม: TC-009, TC-027, TC-043, TC-058

import { getSettings, updateSettings, resetSettings } from '../../controllers/notificationSettingsController'
import pool from '../../db'

jest.mock('../../db')

const mockRes = () => {
  const res: any = {}
  res.status = jest.fn().mockReturnValue(res)
  res.json   = jest.fn().mockReturnValue(res)
  return res
}
const makeReq = (overrides: any) => ({
  body: {}, user: { id: 1, role: 'student' },
  ...overrides,
} as any)

beforeEach(() => jest.clearAllMocks())

// ══════════════════════════════════════════════════════════════════════════════
// getSettings
// ══════════════════════════════════════════════════════════════════════════════

describe('getSettings', () => {
  it('should return existing settings when found', async () => {
    const fakeSettings = { user_id: 1, in_app_enabled: 1, notify_status_change: 1, notify_new_complaint: 0 }
    ;(pool.execute as jest.Mock).mockResolvedValueOnce([[fakeSettings]])

    const res = mockRes()
    await getSettings(makeReq({ user: { id: 1 } }), res)

    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ is_default: false }))
  })

  it('should return default settings when no record exists', async () => {
    ;(pool.execute as jest.Mock).mockResolvedValueOnce([[]])

    const res = mockRes()
    await getSettings(makeReq({ user: { id: 1 } }), res)

    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      in_app_enabled: 1,
      notify_status_change: 1,
      notify_new_complaint: 1,
      is_default: true,
    }))
  })
})

// ══════════════════════════════════════════════════════════════════════════════
// updateSettings
// ══════════════════════════════════════════════════════════════════════════════

describe('updateSettings', () => {

  // ─── TC-009: ปิดการแจ้งเตือน ─────────────────────────────────────────────

  describe('TC-009: ปิดการแจ้งเตือน (Student)', () => {
    it('should UPDATE when settings already exist', async () => {
      ;(pool.execute as jest.Mock)
        .mockResolvedValueOnce([[{ setting_id: 1 }]])  // SELECT existing
        .mockResolvedValueOnce([{}])                    // UPDATE

      const res = mockRes()
      await updateSettings(makeReq({
        body: { in_app_enabled: 0, notify_status_change: 1, notify_new_complaint: 1 },
        user: { id: 1 },
      }), res)

      expect(res.json).toHaveBeenCalledWith({ message: 'บันทึกการตั้งค่าเรียบร้อยแล้ว' })
    })

    it('should INSERT when settings do not exist yet', async () => {
      ;(pool.execute as jest.Mock)
        .mockResolvedValueOnce([[]])  // ไม่มี record
        .mockResolvedValueOnce([{}])  // INSERT

      const res = mockRes()
      await updateSettings(makeReq({
        body: { in_app_enabled: 1, notify_status_change: 0, notify_new_complaint: 1 },
        user: { id: 1 },
      }), res)

      expect(res.json).toHaveBeenCalledWith({ message: 'บันทึกการตั้งค่าเรียบร้อยแล้ว' })
    })
  })

  // ─── TC-027: Personnel กำหนดช่องทางรับแจ้งเตือน ─────────────────────────

  describe('TC-027/TC-043/TC-058: บันทึก settings ตาม role ต่างๆ', () => {
    const roles = ['personnel', 'samo', 'officer']
    roles.forEach((role) => {
      it(`should save notification settings for ${role}`, async () => {
        ;(pool.execute as jest.Mock)
          .mockResolvedValueOnce([[{ setting_id: 1 }]])
          .mockResolvedValueOnce([{}])

        const res = mockRes()
        await updateSettings(makeReq({
          body: { in_app_enabled: 1, notify_status_change: 1, notify_new_complaint: 1 },
          user: { id: 10, role },
        }), res)

        expect(res.json).toHaveBeenCalledWith({ message: 'บันทึกการตั้งค่าเรียบร้อยแล้ว' })
      })
    })
  })
})

// ══════════════════════════════════════════════════════════════════════════════
// resetSettings
// ══════════════════════════════════════════════════════════════════════════════

describe('resetSettings', () => {
  it('should reset to default values and return default settings', async () => {
    ;(pool.execute as jest.Mock).mockResolvedValueOnce([{}])

    const res = mockRes()
    await resetSettings(makeReq({ user: { id: 1 } }), res)

    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      message: 'คืนค่าเริ่มต้นเรียบร้อยแล้ว',
      settings: expect.objectContaining({ in_app_enabled: 1 }),
    }))
  })
})
