// tests/unit/complaints.test.ts
// ครอบคลุม: TC-006, TC-007, TC-008, TC-010, TC-013, TC-014, TC-025, TC-029, TC-033, TC-034, TC-046

jest.mock('../../db', () => ({ execute: jest.fn(), query: jest.fn() }))
jest.mock('../../controllers/notificationController', () => ({
  createNotification: jest.fn().mockResolvedValue(undefined)
}))

import pool from '../../db'
import {
  createComplaint,
  getMyComplaints,
  cancelComplaint,
  updateStatus,
  updatePriority,
  getComplaints,        
  getComplaintImages,
} from '../../controllers/complaintController'

const mockReq = (overrides = {}) => ({
  user: { id: 1, email: 'student@buu.ac.th', role: 'student' },
  body: {},
  params: {},
  files: [],
  ...overrides,
} as any)

const mockRes = () => {
  const res: any = {}
  res.status = jest.fn().mockReturnValue(res)
  res.json = jest.fn().mockReturnValue(res)
  return res
}

// ─── createComplaint ────────────────────────────────────────────────────────

describe('createComplaint', () => {
  beforeEach(() => jest.clearAllMocks())

  // TC-006: ส่งคำร้องพร้อมข้อมูลครบ → 201 + issue_id
  test('TC-006: ส่งคำร้องพร้อมข้อมูลครบถ้วน → 201 + issue_id', async () => {
    ;(pool.execute as jest.Mock)
      .mockResolvedValueOnce([{ insertId: 10 }])     // INSERT issue_report
      .mockResolvedValueOnce([[]])                    // SELECT staff สำหรับแจ้งเตือน

    const req = mockReq({
      body: { title: 'ไฟดับ', description: 'ห้อง 101', category_id: '1', location_id: '1', priority: 'medium' },
      files: [],
    })
    const res = mockRes()
    await createComplaint(req, res)

    expect(res.status).toHaveBeenCalledWith(201)
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Issue reported successfully', issue_id: 10 })
    )
  })

  // TC-006 (variant): ส่งพร้อมรูปภาพ → INSERT image ด้วย
  test('TC-006: ส่งคำร้องพร้อมรูปภาพ → INSERT image_path ด้วย', async () => {
    ;(pool.execute as jest.Mock)
      .mockResolvedValueOnce([{ insertId: 11 }])     // INSERT issue_report
      .mockResolvedValueOnce([{ insertId: 1 }])      // INSERT issue_image
      .mockResolvedValueOnce([[]])                    // SELECT staff

    const req = mockReq({
      body: { title: 'น้ำรั่ว', description: 'ชั้น 2', category_id: '2', location_id: '1', priority: 'high' },
      files: [{ path: 'uploads/test.jpg' }],
    })
    const res = mockRes()
    await createComplaint(req, res)

    expect(res.status).toHaveBeenCalledWith(201)
    // ตรวจว่า execute ถูกเรียกมากกว่า 1 ครั้ง (รวม insert image)
    expect((pool.execute as jest.Mock).mock.calls.length).toBeGreaterThanOrEqual(2)
  })

  // TC-025: Personnel ส่งคำร้องเชิงนโยบาย → 201
  test('TC-025: Personnel ส่งคำร้อง → 201 + issue_id', async () => {
    ;(pool.execute as jest.Mock)
      .mockResolvedValueOnce([{ insertId: 20 }])
      .mockResolvedValueOnce([[]])

    const req = mockReq({
      user: { id: 5, email: 'personnel@buu.ac.th', role: 'personnel' },
      body: { title: 'นโยบายห้องน้ำ', description: 'ต้องปรับปรุง', category_id: '3', location_id: '2', priority: 'high' },
      files: [],
    })
    const res = mockRes()
    await createComplaint(req, res)

    expect(res.status).toHaveBeenCalledWith(201)
  })

  // TC-007: ส่งคำร้องโดยไม่กรอก title → ต้องไม่สำเร็จ (DB จะ error)
  test('TC-007: title ว่าง → DB error → ไม่ได้ 201', async () => {
    ;(pool.execute as jest.Mock).mockRejectedValueOnce(new Error('Column title cannot be null'))

    const req = mockReq({
      body: { title: '', description: '', category_id: '1', location_id: '1' },
      files: [],
    })
    const res = mockRes()

    await expect(createComplaint(req, res)).rejects.toThrow()
  })

  // TC-029: กำหนด priority = high → บันทึก priority ถูกต้อง
  test('TC-029: priority = high → INSERT ด้วย priority = high', async () => {
    ;(pool.execute as jest.Mock)
      .mockResolvedValueOnce([{ insertId: 30 }])
      .mockResolvedValueOnce([[]])

    const req = mockReq({
      body: { title: 'ด่วนมาก', description: 'เร่งด่วน', category_id: '1', location_id: '1', priority: 'high' },
      files: [],
    })
    const res = mockRes()
    await createComplaint(req, res)

    // ตรวจว่า execute ถูกเรียกด้วย priority = high
    const firstCall = (pool.execute as jest.Mock).mock.calls[0]
    expect(firstCall[1]).toContain('high')
  })

  // TC-006 (no priority): ไม่ระบุ priority → default = medium
  test('TC-006: ไม่ระบุ priority → ใช้ default = medium', async () => {
    ;(pool.execute as jest.Mock)
      .mockResolvedValueOnce([{ insertId: 31 }])
      .mockResolvedValueOnce([[]])

    const req = mockReq({
      body: { title: 'ทดสอบ', description: 'test', category_id: '1', location_id: '1' },
      files: [],
    })
    const res = mockRes()
    await createComplaint(req, res)

    const firstCall = (pool.execute as jest.Mock).mock.calls[0]
    expect(firstCall[1]).toContain('medium')
  })
})

// ─── getMyComplaints ─────────────────────────────────────────────────────────

describe('getMyComplaints', () => {
  beforeEach(() => jest.clearAllMocks())

  // TC-010: ดูสถานะคำร้องของตนเอง → แสดงรายการถูกต้อง
  test('TC-010: ดึง complaints ของตัวเอง → return array ของ complaints', async () => {
    const fakeComplaints = [
      { complaint_id: 1, title: 'ไฟดับ', status: 'pending', category_name: 'ซ่อมแซม' },
      { complaint_id: 2, title: 'น้ำรั่ว', status: 'in_progress', category_name: 'ซ่อมแซม' },
    ]
    ;(pool.execute as jest.Mock).mockResolvedValueOnce([fakeComplaints])

    const req = mockReq()
    const res = mockRes()
    await getMyComplaints(req, res)

    expect(res.json).toHaveBeenCalledWith(fakeComplaints)
  })

  // TC-010: ไม่มีคำร้อง → return array ว่าง
  test('TC-010: ไม่มีคำร้อง → return []', async () => {
    ;(pool.execute as jest.Mock).mockResolvedValueOnce([[]])

    const req = mockReq()
    const res = mockRes()
    await getMyComplaints(req, res)

    expect(res.json).toHaveBeenCalledWith([])
  })
})

// ─── cancelComplaint ─────────────────────────────────────────────────────────

describe('cancelComplaint', () => {
  beforeEach(() => jest.clearAllMocks())

  // TC-013: ยกเลิกคำร้องสถานะ "รอดำเนินการ" → สำเร็จ
  test('TC-013: ยกเลิกคำร้อง status = pending → 200 ยกเลิกเรียบร้อย', async () => {
    ;(pool.execute as jest.Mock)
      .mockResolvedValueOnce([[{ complaint_id: 1, user_id: 1, status: 'pending', title: 'ไฟดับ' }]])
      .mockResolvedValueOnce([{ affectedRows: 1 }])

    const req = mockReq({ params: { id: '1' } })
    const res = mockRes()
    await cancelComplaint(req, res)

    expect(res.json).toHaveBeenCalledWith({ message: 'ยกเลิกคำร้องเรียบร้อยแล้ว' })
  })

  // TC-014: ยกเลิกคำร้องสถานะ "กำลังดำเนินการ" → 400
  test('TC-014: ยกเลิกคำร้อง status = in_progress → 400 ยกเลิกไม่ได้', async () => {
    ;(pool.execute as jest.Mock)
      .mockResolvedValueOnce([[{ complaint_id: 2, user_id: 1, status: 'in_progress', title: 'น้ำรั่ว' }]])

    const req = mockReq({ params: { id: '2' } })
    const res = mockRes()
    await cancelComplaint(req, res)

    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: expect.stringContaining('รอดำเนินการ') })
    )
  })

  // TC-033: Personnel ยกเลิกคำร้องของตัวเองที่ pending → สำเร็จ
  test('TC-033: Personnel ยกเลิกคำร้อง status = pending → 200', async () => {
    ;(pool.execute as jest.Mock)
      .mockResolvedValueOnce([[{ complaint_id: 5, user_id: 5, status: 'pending', title: 'นโยบาย' }]])
      .mockResolvedValueOnce([{ affectedRows: 1 }])

    const req = mockReq({
      user: { id: 5, role: 'personnel' },
      params: { id: '5' },
    })
    const res = mockRes()
    await cancelComplaint(req, res)

    expect(res.json).toHaveBeenCalledWith({ message: 'ยกเลิกคำร้องเรียบร้อยแล้ว' })
  })

  // TC-034: Personnel ยกเลิกคำร้อง in_progress → 400
  test('TC-034: Personnel ยกเลิกคำร้อง status = in_progress → 400', async () => {
    ;(pool.execute as jest.Mock)
      .mockResolvedValueOnce([[{ complaint_id: 6, user_id: 5, status: 'in_progress', title: 'นโยบาย' }]])

    const req = mockReq({
      user: { id: 5, role: 'personnel' },
      params: { id: '6' },
    })
    const res = mockRes()
    await cancelComplaint(req, res)

    expect(res.status).toHaveBeenCalledWith(400)
  })

  // คำร้องไม่มีในระบบ / เป็นของคนอื่น → 404
  test('คำร้องไม่พบหรือเป็นของคนอื่น → 404', async () => {
    ;(pool.execute as jest.Mock).mockResolvedValueOnce([[]])

    const req = mockReq({ params: { id: '999' } })
    const res = mockRes()
    await cancelComplaint(req, res)

    expect(res.status).toHaveBeenCalledWith(404)
  })
})

// ─── updateStatus ─────────────────────────────────────────────────────────────

describe('updateStatus', () => {
  beforeEach(() => jest.clearAllMocks())

  // TC-008: อัปเดตสถานะ → ผู้แจ้งได้รับ notification (createNotification ถูกเรียก)
  test('TC-008: อัปเดตสถานะเป็น in_progress → createNotification ถูกเรียก', async () => {
    const { createNotification } = require('../../controllers/notificationController')
    ;(pool.execute as jest.Mock)
      .mockResolvedValueOnce([[{ user_id: 1, title: 'ไฟดับ' }]])
      .mockResolvedValueOnce([{ affectedRows: 1 }])

    const req = mockReq({
      user: { id: 2, role: 'samo' },
      params: { id: '1' },
      body: { status: 'in_progress' },
    })
    const res = mockRes()
    await updateStatus(req, res)

    expect(createNotification).toHaveBeenCalled()
    expect(res.json).toHaveBeenCalledWith({ message: 'Status updated' })
  })

  // TC-063: อัปเดตสถานะเป็น resolved → แจ้ง user ว่าแก้ไขแล้ว
  test('TC-063: อัปเดตสถานะเป็น resolved → createNotification ถูกเรียก', async () => {
    const { createNotification } = require('../../controllers/notificationController')
    ;(pool.execute as jest.Mock)
      .mockResolvedValueOnce([[{ user_id: 1, title: 'ไฟดับ' }]])
      .mockResolvedValueOnce([{ affectedRows: 1 }])

    const req = mockReq({
      user: { id: 2, role: 'officer' },
      params: { id: '1' },
      body: { status: 'resolved' },
    })
    const res = mockRes()
    await updateStatus(req, res)

    expect(createNotification).toHaveBeenCalledWith(
      1,
      expect.stringContaining('แก้ไขเรียบร้อย'),
      1
    )
  })
})

// ─── updatePriority ───────────────────────────────────────────────────────────

describe('updatePriority', () => {
  beforeEach(() => jest.clearAllMocks())

  // TC-046: Samo ปรับระดับความเร่งด่วน → สำเร็จ
  test('TC-046: Samo ปรับ priority → 200 Priority updated', async () => {
    ;(pool.execute as jest.Mock).mockResolvedValueOnce([{ affectedRows: 1 }])

    const req = mockReq({
      user: { id: 10, role: 'samo' },
      params: { id: '1' },
      body: { priority: 'high' },
    })
    const res = mockRes()
    await updatePriority(req, res)

    expect(res.json).toHaveBeenCalledWith({ message: 'Priority updated' })
  })

  // TC-029: Officer ปรับ priority = high → สำเร็จ
  test('TC-029: Officer ปรับ priority = high → 200', async () => {
    ;(pool.execute as jest.Mock).mockResolvedValueOnce([{ affectedRows: 1 }])

    const req = mockReq({
      user: { id: 20, role: 'officer' },
      params: { id: '2' },
      body: { priority: 'high' },
    })
    const res = mockRes()
    await updatePriority(req, res)

    expect(res.json).toHaveBeenCalledWith({ message: 'Priority updated' })
  })

  // Student พยายามปรับ priority → 403
  test('Student พยายามปรับ priority → 403 ไม่มีสิทธิ์', async () => {
    const req = mockReq({
      user: { id: 1, role: 'student' },
      params: { id: '1' },
      body: { priority: 'high' },
    })
    const res = mockRes()
    await updatePriority(req, res)

    expect(res.status).toHaveBeenCalledWith(403)
    expect(res.json).toHaveBeenCalledWith({ message: 'ไม่มีสิทธิ์เปลี่ยนระดับความเร่งด่วน' })
  })

  // priority ไม่ถูกต้อง → 400
  test('priority ไม่ถูกต้อง (เช่น urgent) → 400', async () => {
    const req = mockReq({
      user: { id: 10, role: 'samo' },
      params: { id: '1' },
      body: { priority: 'urgent' }, // ไม่ใช่ low/medium/high
    })
    const res = mockRes()
    await updatePriority(req, res)

    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith({ message: 'ระดับความเร่งด่วนไม่ถูกต้อง' })
  })
})
describe('getComplaints', () => {
  beforeEach(() => jest.clearAllMocks())

  test('admin/officer ดึงคำร้องทั้งหมด → return array', async () => {
    const fakeComplaints = [
      { complaint_id: 1, title: 'ไฟดับ', firstname: 'สมชาย', category_name: 'ซ่อมแซม' },
      { complaint_id: 2, title: 'น้ำรั่ว', firstname: 'สมหญิง', category_name: 'ซ่อมแซม' },
    ]
    ;(pool.execute as jest.Mock).mockResolvedValueOnce([fakeComplaints])

    const req = mockReq({ user: { id: 99, role: 'admin' } })
    const res = mockRes()
    await getComplaints(req, res)

    expect(res.json).toHaveBeenCalledWith(fakeComplaints)
  })
})

describe('getComplaintImages', () => {
  beforeEach(() => jest.clearAllMocks())

  test('TC-006: ดึงรูปภาพของคำร้อง → return array of images', async () => {
    const fakeImages = [
      { image_id: 1, issue_id: 1, image_path: 'uploads/test.jpg' },
    ]
    ;(pool.execute as jest.Mock).mockResolvedValueOnce([fakeImages])

    const req = mockReq({ params: { id: '1' } })
    const res = mockRes()
    await getComplaintImages(req, res)

    expect(res.json).toHaveBeenCalledWith(fakeImages)
  })
})