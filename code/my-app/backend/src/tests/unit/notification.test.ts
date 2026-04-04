// tests/unit/notification.test.ts
// ครอบคลุม: TC-008, TC-009, TC-026, TC-027, TC-035, TC-042, TC-043, TC-057, TC-058, TC-070, TC-071

import {
  getNotifications, getUnreadCount, markAsRead, markAllAsRead,
  createNotification, broadcastNotification,
} from '../../controllers/notificationController'
import pool from '../../db'

jest.mock('../../db')

const mockRes = () => {
  const res: any = {}
  res.status = jest.fn().mockReturnValue(res)
  res.json   = jest.fn().mockReturnValue(res)
  return res
}
const makeReq = (overrides: any) => ({
  body: {}, params: {}, user: { id: 1, role: 'student', department_id: null },
  ...overrides,
} as any)

beforeEach(() => jest.clearAllMocks())

// ══════════════════════════════════════════════════════════════════════════════
// getNotifications
// ══════════════════════════════════════════════════════════════════════════════

describe('getNotifications', () => {

  // ─── TC-008/TC-026/TC-042/TC-057: ดึง notification list ──────────────────

  describe('TC-008: student ดึงรายการแจ้งเตือน', () => {
    it('should return notification list for current user', async () => {
      const fakeRows = [{ notification_id: 1, message: 'คำร้องถูกรับแล้ว', is_read: 0 }]
      ;(pool.execute as jest.Mock).mockResolvedValueOnce([fakeRows])

      const res = mockRes()
      await getNotifications(makeReq({ user: { id: 1, role: 'student' } }), res)

      expect(res.json).toHaveBeenCalledWith(fakeRows)
    })
  })
})

// ══════════════════════════════════════════════════════════════════════════════
// getUnreadCount
// ══════════════════════════════════════════════════════════════════════════════

describe('getUnreadCount', () => {
  it('should return unread count for user', async () => {
    ;(pool.execute as jest.Mock).mockResolvedValueOnce([[{ count: 3 }]])

    const res = mockRes()
    await getUnreadCount(makeReq({ user: { id: 1 } }), res)

    expect(res.json).toHaveBeenCalledWith({ count: 3 })
  })
})

// ══════════════════════════════════════════════════════════════════════════════
// markAsRead / markAllAsRead
// ══════════════════════════════════════════════════════════════════════════════

describe('markAsRead', () => {

  // ─── TC-009: ปิดการแจ้งเตือน (mark อ่านแล้ว) ─────────────────────────────

  describe('TC-009: mark notification อ่านแล้ว', () => {
    it('should update is_read=1 for specific notification', async () => {
      ;(pool.execute as jest.Mock).mockResolvedValueOnce([{}])

      const res = mockRes()
      await markAsRead(makeReq({ params: { id: '1' }, user: { id: 1 } }), res)

      expect(res.json).toHaveBeenCalledWith({ message: 'Marked as read' })
    })
  })
})

describe('markAllAsRead', () => {
  it('should mark all notifications as read', async () => {
    ;(pool.execute as jest.Mock).mockResolvedValueOnce([{}])

    const res = mockRes()
    await markAllAsRead(makeReq({ user: { id: 1 } }), res)

    expect(res.json).toHaveBeenCalledWith({ message: 'All marked as read' })
  })
})

// ══════════════════════════════════════════════════════════════════════════════
// createNotification (helper)
// ══════════════════════════════════════════════════════════════════════════════

describe('createNotification helper', () => {

  // ─── TC-027/TC-043/TC-058: เช็ค settings ก่อนส่ง ─────────────────────────

  describe('TC-027/TC-043/TC-058: ส่งแจ้งเตือนตาม settings', () => {
    it('should insert notification when in_app_enabled=1 and type matches', async () => {
      ;(pool.execute as jest.Mock)
        .mockResolvedValueOnce([[{ in_app_enabled: 1, notify_status_change: 1, notify_new_complaint: 1 }]])
        .mockResolvedValueOnce([{}])  // INSERT notification

      await createNotification(1, 'คำร้องถูกรับแล้ว', 1, 'in_app', 'status_change')

      expect(pool.execute).toHaveBeenCalledTimes(2)
      expect((pool.execute as jest.Mock).mock.calls[1][0]).toContain('INSERT INTO notification')
    })

    it('should NOT insert when in_app_enabled=0', async () => {
      ;(pool.execute as jest.Mock)
        .mockResolvedValueOnce([[{ in_app_enabled: 0, notify_status_change: 1, notify_new_complaint: 1 }]])

      await createNotification(1, 'test', 1, 'in_app', 'status_change')

      expect(pool.execute).toHaveBeenCalledTimes(1)  // แค่ SELECT settings เท่านั้น
    })

    it('should NOT insert status_change when notify_status_change=0', async () => {
      ;(pool.execute as jest.Mock)
        .mockResolvedValueOnce([[{ in_app_enabled: 1, notify_status_change: 0, notify_new_complaint: 1 }]])

      await createNotification(1, 'test', 1, 'in_app', 'status_change')

      expect(pool.execute).toHaveBeenCalledTimes(1)
    })

    it('should NOT insert new_complaint when notify_new_complaint=0', async () => {
      ;(pool.execute as jest.Mock)
        .mockResolvedValueOnce([[{ in_app_enabled: 1, notify_status_change: 1, notify_new_complaint: 0 }]])

      await createNotification(1, 'มีคำร้องใหม่', 1, 'in_app', 'new_complaint')

      expect(pool.execute).toHaveBeenCalledTimes(1)
    })

    it('should use default settings (all enabled) when no settings record exists', async () => {
      ;(pool.execute as jest.Mock)
        .mockResolvedValueOnce([[]])   // settings ไม่มี
        .mockResolvedValueOnce([{}])   // INSERT notification

      await createNotification(1, 'test', 1, 'in_app', 'status_change')

      expect(pool.execute).toHaveBeenCalledTimes(2)
    })
  })
})

// ══════════════════════════════════════════════════════════════════════════════
// broadcastNotification
// ══════════════════════════════════════════════════════════════════════════════

describe('broadcastNotification', () => {

  // ─── TC-071: Admin ส่ง Broadcast ข่าวสารฉุกเฉิน ─────────────────────────

  describe('TC-071: Admin ส่ง broadcast ถึงทุกคน', () => {
    it('should insert notification for every active user and return sent count', async () => {
      const users = [{ user_id: 1 }, { user_id: 2 }, { user_id: 3 }]
      ;(pool.execute as jest.Mock)
        .mockResolvedValueOnce([users])   // SELECT users
        .mockResolvedValueOnce([{}])      // INSERT user 1
        .mockResolvedValueOnce([{}])      // INSERT user 2
        .mockResolvedValueOnce([{}])      // INSERT user 3

      const req = makeReq({
        body: { message: 'ประกาศฉุกเฉิน', target_roles: ['all'] },
        user: { id: 99, role: 'admin' },
      })
      const res = mockRes()

      await broadcastNotification(req, res)

      expect(res.json).toHaveBeenCalledWith({ message: 'ส่งแจ้งเตือนสำเร็จ 3 คน' })
    })

    it('should return 403 when role is not admin', async () => {
      const req = makeReq({
        body: { message: 'test', target_roles: ['all'] },
        user: { id: 1, role: 'student' },
      })
      const res = mockRes()

      await broadcastNotification(req, res)

      expect(res.status).toHaveBeenCalledWith(403)
    })

    it('should return 400 when message is empty', async () => {
      const req = makeReq({
        body: { message: '   ', target_roles: ['all'] },
        user: { id: 99, role: 'admin' },
      })
      const res = mockRes()

      await broadcastNotification(req, res)

      expect(res.status).toHaveBeenCalledWith(400)
      expect(res.json).toHaveBeenCalledWith({ message: 'กรุณาระบุข้อความ' })
    })
  })
})
