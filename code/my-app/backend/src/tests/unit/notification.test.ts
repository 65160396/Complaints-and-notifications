// tests/unit/notification.test.ts
// ครอบคลุม: TC-008, TC-009 (getNotifications, getUnreadCount, markAsRead, markAllAsRead, createNotification)

jest.mock('../../db', () => ({ execute: jest.fn() }))

import pool from '../../db'
import {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  createNotification,
} from '../../controllers/notificationController'

const mockReq = (overrides = {}) => ({
  user: { id: 1, email: 'student@buu.ac.th', role: 'student' },
  params: {},
  body: {},
  ...overrides,
} as any)

const mockRes = () => {
  const res: any = {}
  res.status = jest.fn().mockReturnValue(res)
  res.json = jest.fn().mockReturnValue(res)
  return res
}

// ─── getNotifications ────────────────────────────────────────────────────────

describe('getNotifications', () => {
  beforeEach(() => jest.clearAllMocks())

  // TC-008: ดึง notifications ของ user → return array
  test('TC-008: ดึง notifications สำเร็จ → return array', async () => {
    const fakeNotifications = [
      { notification_id: 1, message: 'คำร้องกำลังดำเนินการ', is_read: 0 },
      { notification_id: 2, message: 'คำร้องแก้ไขแล้ว', is_read: 1 },
    ]
    ;(pool.execute as jest.Mock).mockResolvedValueOnce([fakeNotifications])

    const req = mockReq()
    const res = mockRes()
    await getNotifications(req, res)

    expect(res.json).toHaveBeenCalledWith(fakeNotifications)
  })

  // ไม่มี notifications → return array ว่าง
  test('ไม่มี notifications → return []', async () => {
    ;(pool.execute as jest.Mock).mockResolvedValueOnce([[]])

    const req = mockReq()
    const res = mockRes()
    await getNotifications(req, res)

    expect(res.json).toHaveBeenCalledWith([])
  })
})

// ─── getUnreadCount ──────────────────────────────────────────────────────────

describe('getUnreadCount', () => {
  beforeEach(() => jest.clearAllMocks())

  test('มี unread 3 อัน → return { count: 3 }', async () => {
    ;(pool.execute as jest.Mock).mockResolvedValueOnce([[{ count: 3 }]])

    const req = mockReq()
    const res = mockRes()
    await getUnreadCount(req, res)

    expect(res.json).toHaveBeenCalledWith({ count: 3 })
  })

  test('ไม่มี unread → return { count: 0 }', async () => {
    ;(pool.execute as jest.Mock).mockResolvedValueOnce([[{ count: 0 }]])

    const req = mockReq()
    const res = mockRes()
    await getUnreadCount(req, res)

    expect(res.json).toHaveBeenCalledWith({ count: 0 })
  })
})

// ─── markAsRead ───────────────────────────────────────────────────────────────

describe('markAsRead', () => {
  beforeEach(() => jest.clearAllMocks())

  test('mark notification เดียวว่าอ่านแล้ว → Marked as read', async () => {
    ;(pool.execute as jest.Mock).mockResolvedValueOnce([{ affectedRows: 1 }])

    const req = mockReq({ params: { id: '1' } })
    const res = mockRes()
    await markAsRead(req, res)

    expect(res.json).toHaveBeenCalledWith({ message: 'Marked as read' })
  })
})

// ─── markAllAsRead ────────────────────────────────────────────────────────────

describe('markAllAsRead', () => {
  beforeEach(() => jest.clearAllMocks())

  test('mark ทุก notification ว่าอ่านแล้ว → All marked as read', async () => {
    ;(pool.execute as jest.Mock).mockResolvedValueOnce([{ affectedRows: 3 }])

    const req = mockReq()
    const res = mockRes()
    await markAllAsRead(req, res)

    expect(res.json).toHaveBeenCalledWith({ message: 'All marked as read' })
  })
})

// ─── createNotification ───────────────────────────────────────────────────────

describe('createNotification', () => {
  beforeEach(() => jest.clearAllMocks())

  // TC-008: settings เปิดอยู่ → INSERT notification
  test('TC-008: settings เปิดทุกอย่าง → INSERT notification สำเร็จ', async () => {
    ;(pool.execute as jest.Mock)
      .mockResolvedValueOnce([[{ in_app_enabled: 1, notify_status_change: 1, notify_new_complaint: 1 }]])
      .mockResolvedValueOnce([{ insertId: 1 }])

    await createNotification(1, 'คำร้องกำลังดำเนินการ', 1, 'in_app', 'status_change')

    expect(pool.execute).toHaveBeenCalledTimes(2)
  })

  // TC-009: ปิด in_app_enabled → ไม่ INSERT
  test('TC-009: ปิดการแจ้งเตือน in_app → ไม่ INSERT notification', async () => {
    ;(pool.execute as jest.Mock)
      .mockResolvedValueOnce([[{ in_app_enabled: 0, notify_status_change: 1, notify_new_complaint: 1 }]])

    await createNotification(1, 'คำร้องกำลังดำเนินการ', 1, 'in_app', 'status_change')

    // เรียกแค่ครั้งเดียว (SELECT settings) ไม่มี INSERT
    expect(pool.execute).toHaveBeenCalledTimes(1)
  })

  // TC-009: ปิด notify_status_change → ไม่ INSERT เมื่อ type = status_change
  test('TC-009: ปิด notify_status_change → ไม่แจ้งเตือนเมื่อสถานะเปลี่ยน', async () => {
    ;(pool.execute as jest.Mock)
      .mockResolvedValueOnce([[{ in_app_enabled: 1, notify_status_change: 0, notify_new_complaint: 1 }]])

    await createNotification(1, 'คำร้องกำลังดำเนินการ', 1, 'in_app', 'status_change')

    expect(pool.execute).toHaveBeenCalledTimes(1)
  })

  // ไม่มี settings → ใช้ค่า default (เปิดทุกอย่าง) → INSERT
  test('ไม่มี settings → ใช้ค่า default → INSERT notification', async () => {
    ;(pool.execute as jest.Mock)
      .mockResolvedValueOnce([[]])               // ไม่มี settings
      .mockResolvedValueOnce([{ insertId: 2 }]) // INSERT สำเร็จ

    await createNotification(1, 'มีคำร้องใหม่', 2, 'in_app', 'new_complaint')

    expect(pool.execute).toHaveBeenCalledTimes(2)
  })

  // ปิด notify_new_complaint → ไม่ INSERT เมื่อ type = new_complaint
  test('ปิด notify_new_complaint → ไม่แจ้งเตือนเมื่อมีคำร้องใหม่', async () => {
    ;(pool.execute as jest.Mock)
      .mockResolvedValueOnce([[{ in_app_enabled: 1, notify_status_change: 1, notify_new_complaint: 0 }]])

    await createNotification(1, 'มีคำร้องใหม่', 2, 'in_app', 'new_complaint')

    expect(pool.execute).toHaveBeenCalledTimes(1)
  })
})