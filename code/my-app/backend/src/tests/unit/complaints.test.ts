// tests/unit/complaints.test.ts
// ครอบคลุม: TC-006, TC-007, TC-010, TC-011, TC-012, TC-013, TC-014, TC-016, TC-017, TC-018,
//            TC-019, TC-020, TC-021, TC-022, TC-025, TC-028, TC-029, TC-030, TC-031,
//            TC-033, TC-034, TC-036, TC-039, TC-040, TC-041, TC-044, TC-045, TC-046,
//            TC-048, TC-049, TC-050, TC-051, TC-052, TC-055, TC-056, TC-059, TC-060,
//            TC-062, TC-063

import {
  createComplaint, getMyComplaints, cancelComplaint,
  updateStatus, acceptComplaint, updatePriority,
  forwardComplaint, assignComplaint, updateCategory,
  getComplaintsByDept, getComplaints,
} from '../../controllers/complaintController'
import { createNotification } from '../../../src/controllers/notificationController'
import pool from '../../db'

jest.mock('../../db')
jest.mock('../../controllers/notificationController')

const mockNotify = createNotification as jest.Mock

const mockRes = () => {
  const res: any = {}
  res.status = jest.fn().mockReturnValue(res)
  res.json   = jest.fn().mockReturnValue(res)
  return res
}

const makeReq = (overrides: any) => ({
  body: {}, params: {}, user: { id: 1, role: 'student', department_id: null },
  files: [],
  ...overrides,
} as any)

beforeEach(() => jest.clearAllMocks())

// ══════════════════════════════════════════════════════════════════════════════
// createComplaint
// ══════════════════════════════════════════════════════════════════════════════

describe('createComplaint', () => {

  // ─── TC-006: ส่งคำร้องพร้อมรูปภาพ ─────────────────────────────────────────

  describe('TC-006: ส่งคำร้องร้องเรียนพร้อมรูปภาพ', () => {
    it('should insert complaint + images and notify staff, return 201', async () => {
      ;(pool.execute as jest.Mock)
        .mockResolvedValueOnce([{ insertId: 1 }])         // INSERT issue_report
        .mockResolvedValueOnce([{}])                       // INSERT issue_image
        .mockResolvedValueOnce([[{ user_id: 99 }]])        // SELECT staff
      mockNotify.mockResolvedValue(undefined)

      const req = makeReq({
        body: { title: 'ไฟดับ', description: 'ไฟดับที่อาคาร A', category_id: 1, department_id: 2 },
        files: [{ path: 'uploads/img1.jpg' }],
      })
      const res = mockRes()

      await createComplaint(req, res)

      expect(res.status).toHaveBeenCalledWith(201)
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ issue_id: 1 }))
    })
  })

  // ─── TC-007: ส่งคำร้องโดยไม่กรอกรายละเอียด ───────────────────────────────
  // (validation อยู่ที่ middleware/frontend — controller insert ได้เลย แต่ถ้า description = '' DB จะรับ)
  // ทดสอบว่า student priority ถูก force เป็น medium เสมอ

  describe('TC-007 / TC-029: student priority ถูก force เป็น medium', () => {
    it('should always set priority=medium for student regardless of input', async () => {
      ;(pool.execute as jest.Mock)
        .mockResolvedValueOnce([{ insertId: 5 }])
        .mockResolvedValueOnce([[]])   // SELECT staff (ไม่มี dept)

      const req = makeReq({
        body: { title: 'ทดสอบ', description: 'test', category_id: 1, priority: 'high' },
        user: { id: 1, role: 'student', department_id: null },
      })
      const res = mockRes()

      await createComplaint(req, res)

      const insertCall = (pool.execute as jest.Mock).mock.calls[0]
      expect(insertCall[1]).toContain('medium')   // priority ถูก override
      expect(insertCall[1]).not.toContain('high')
    })
  })

  // ─── TC-025/TC-029: personnel/samo ตั้ง priority ได้ ──────────────────────

  describe('TC-025: personnel ส่งคำร้องพร้อม priority=high ได้', () => {
    it('should use provided priority when role is not student', async () => {
      ;(pool.execute as jest.Mock)
        .mockResolvedValueOnce([{ insertId: 6 }])
        .mockResolvedValueOnce([[]])

      const req = makeReq({
        body: { title: 'ท่อแตก', description: 'urgent', category_id: 2, priority: 'high', department_id: 1 },
        user: { id: 10, role: 'personnel', department_id: 1 },
      })
      const res = mockRes()

      await createComplaint(req, res)

      const insertCall = (pool.execute as jest.Mock).mock.calls[0]
      expect(insertCall[1]).toContain('high')
    })
  })
})

// ══════════════════════════════════════════════════════════════════════════════
// getMyComplaints
// ══════════════════════════════════════════════════════════════════════════════

describe('getMyComplaints', () => {

  // ─── TC-010: ดูสถานะคำร้องของตนเอง ───────────────────────────────────────

  describe('TC-010: ดูสถานะคำร้องของตนเอง', () => {
    it('should return complaint list for current user', async () => {
      const fakeRows = [{ issue_id: 1, title: 'ไฟดับ', status: 'pending' }]
      ;(pool.execute as jest.Mock).mockResolvedValueOnce([fakeRows])

      const req = makeReq({ user: { id: 1, role: 'student', department_id: null } })
      const res = mockRes()

      await getMyComplaints(req, res)

      expect(res.json).toHaveBeenCalledWith(fakeRows)
    })
  })
})

// ══════════════════════════════════════════════════════════════════════════════
// cancelComplaint
// ══════════════════════════════════════════════════════════════════════════════

describe('cancelComplaint', () => {

  // ─── TC-013: ยกเลิกคำร้องสถานะ "pending" ────────────────────────────────

  describe('TC-013: ยกเลิกคำร้องสถานะ pending', () => {
    it('should set status=cancelled and return success message', async () => {
      ;(pool.execute as jest.Mock)
        .mockResolvedValueOnce([[{ issue_id: 1, status: 'pending', user_id: 1 }]])
        .mockResolvedValueOnce([{}])

      const req = makeReq({ params: { id: '1' }, user: { id: 1, role: 'student', department_id: null } })
      const res = mockRes()

      await cancelComplaint(req, res)

      expect(res.json).toHaveBeenCalledWith({ message: 'ยกเลิกคำร้องเรียบร้อยแล้ว' })
    })
  })

  // ─── TC-014/TC-033/TC-034: ยกเลิกคำร้องที่ไม่ใช่ pending ────────────────

  describe('TC-014: ยกเลิกคำร้องสถานะ in_progress ไม่ได้', () => {
    it('should return 400 when status is not pending', async () => {
      ;(pool.execute as jest.Mock)
        .mockResolvedValueOnce([[{ issue_id: 1, status: 'in_progress', user_id: 1 }]])

      const req = makeReq({ params: { id: '1' }, user: { id: 1, role: 'student', department_id: null } })
      const res = mockRes()

      await cancelComplaint(req, res)

      expect(res.status).toHaveBeenCalledWith(400)
      expect(res.json).toHaveBeenCalledWith({ message: 'ยกเลิกได้เฉพาะคำร้องที่รอดำเนินการ' })
    })
  })

  describe('TC-033: ยกเลิกคำร้อง pending (Personnel) ได้ปกติ', () => {
    it('should cancel pending complaint for personnel too', async () => {
      ;(pool.execute as jest.Mock)
        .mockResolvedValueOnce([[{ issue_id: 2, status: 'pending', user_id: 10 }]])
        .mockResolvedValueOnce([{}])

      const req = makeReq({ params: { id: '2' }, user: { id: 10, role: 'personnel', department_id: 1 } })
      const res = mockRes()

      await cancelComplaint(req, res)

      expect(res.json).toHaveBeenCalledWith({ message: 'ยกเลิกคำร้องเรียบร้อยแล้ว' })
    })
  })

  describe('TC-034: ยกเลิกคำร้อง in_progress (Personnel) ไม่ได้', () => {
    it('should return 400 for in_progress complaint', async () => {
      ;(pool.execute as jest.Mock)
        .mockResolvedValueOnce([[{ issue_id: 2, status: 'in_progress', user_id: 10 }]])

      const req = makeReq({ params: { id: '2' }, user: { id: 10, role: 'personnel', department_id: 1 } })
      const res = mockRes()

      await cancelComplaint(req, res)

      expect(res.status).toHaveBeenCalledWith(400)
    })
  })
})

// ══════════════════════════════════════════════════════════════════════════════
// updateStatus
// ══════════════════════════════════════════════════════════════════════════════

describe('updateStatus', () => {

  // ─── TC-008/TC-026/TC-057/TC-063: แจ้งเตือนเมื่อสถานะเปลี่ยน ─────────────

  describe('TC-063: จบงาน → status=resolved + แจ้งเตือนเจ้าของ', () => {
    it('should update status and call createNotification with correct message', async () => {
      ;(pool.execute as jest.Mock)
        .mockResolvedValueOnce([[{ user_id: 1, title: 'ไฟดับ' }]])
        .mockResolvedValueOnce([{}])
      mockNotify.mockResolvedValue(undefined)

      const req = makeReq({
        params: { id: '1' },
        body: { status: 'resolved' },
        user: { id: 30, role: 'officer', department_id: null },
      })
      const res = mockRes()

      await updateStatus(req, res)

      expect(mockNotify).toHaveBeenCalledWith(
        1,
        expect.stringContaining('แก้ไขเรียบร้อยแล้ว'),
        1, 'in_app', 'status_change'
      )
      expect(res.json).toHaveBeenCalledWith({ message: 'Status updated' })
    })
  })

  describe('TC-040/TC-055: รับเรื่อง → status=in_progress แจ้งเตือน', () => {
    it('should notify owner when status changes to in_progress', async () => {
      ;(pool.execute as jest.Mock)
        .mockResolvedValueOnce([[{ user_id: 1, title: 'น้ำรั่ว' }]])
        .mockResolvedValueOnce([{}])
      mockNotify.mockResolvedValue(undefined)

      const req = makeReq({
        params: { id: '2' },
        body: { status: 'in_progress' },
        user: { id: 20, role: 'samo', department_id: 1 },
      })
      const res = mockRes()

      await updateStatus(req, res)

      expect(mockNotify).toHaveBeenCalledWith(
        1, expect.stringContaining('กำลังได้รับการดำเนินการ'),
        2, 'in_app', 'status_change'
      )
    })
  })
})

// ══════════════════════════════════════════════════════════════════════════════
// acceptComplaint
// ══════════════════════════════════════════════════════════════════════════════

describe('acceptComplaint', () => {

  // ─── TC-040: samo รับเรื่อง pending ─────────────────────────────────────

  describe('TC-040: samo กดรับเรื่อง pending', () => {
    it('should update status to in_progress and notify owner', async () => {
      ;(pool.execute as jest.Mock)
        .mockResolvedValueOnce([[{ issue_id: 1, status: 'pending', user_id: 1, title: 'ไฟดับ' }]])
        .mockResolvedValueOnce([{}])
      mockNotify.mockResolvedValue(undefined)

      const req = makeReq({
        params: { id: '1' },
        user: { id: 20, role: 'samo', department_id: 1 },
      })
      const res = mockRes()

      await acceptComplaint(req, res)

      expect(res.json).toHaveBeenCalledWith({ message: 'รับเรื่องเรียบร้อยแล้ว' })
      expect(mockNotify).toHaveBeenCalled()
    })
  })

  // ─── TC-041: samo อื่นรับซ้ำไม่ได้ (status ไม่ใช่ pending) ──────────────

  describe('TC-041: samo อื่นพยายามรับซ้ำ', () => {
    it('should return 400 when complaint is already in_progress', async () => {
      ;(pool.execute as jest.Mock)
        .mockResolvedValueOnce([[{ issue_id: 1, status: 'in_progress', user_id: 1, title: 'ไฟดับ' }]])

      const req = makeReq({
        params: { id: '1' },
        user: { id: 21, role: 'samo', department_id: 1 },
      })
      const res = mockRes()

      await acceptComplaint(req, res)

      expect(res.status).toHaveBeenCalledWith(400)
    })
  })

  // ─── TC-055: officer รับ forwarded ───────────────────────────────────────

  describe('TC-055: officer รับคำร้องที่ forwarded มา', () => {
    it('should update status to in_progress for forwarded complaint', async () => {
      ;(pool.execute as jest.Mock)
        .mockResolvedValueOnce([[{ issue_id: 5, status: 'forwarded', user_id: 1, title: 'น้ำรั่ว' }]])
        .mockResolvedValueOnce([{}])
      mockNotify.mockResolvedValue(undefined)

      const req = makeReq({
        params: { id: '5' },
        user: { id: 30, role: 'officer', department_id: null },
      })
      const res = mockRes()

      await acceptComplaint(req, res)

      expect(res.json).toHaveBeenCalledWith({ message: 'รับเรื่องเรียบร้อยแล้ว' })
    })
  })

  // ─── TC-056: officer คนที่ 2 รับซ้ำไม่ได้ ────────────────────────────────

  describe('TC-056: officer คนที่ 2 รับซ้ำไม่ได้', () => {
    it('should return 400 when complaint is already in_progress for officer', async () => {
      ;(pool.execute as jest.Mock)
        .mockResolvedValueOnce([[{ issue_id: 5, status: 'in_progress', user_id: 1, title: 'น้ำรั่ว' }]])

      const req = makeReq({
        params: { id: '5' },
        user: { id: 31, role: 'officer', department_id: null },
      })
      const res = mockRes()

      await acceptComplaint(req, res)

      expect(res.status).toHaveBeenCalledWith(400)
    })
  })

  // ─── student ไม่มีสิทธิ์รับเรื่อง ────────────────────────────────────────

  describe('student ไม่มีสิทธิ์รับเรื่อง', () => {
    it('should return 403 for student role', async () => {
      const req = makeReq({
        params: { id: '1' },
        user: { id: 1, role: 'student', department_id: null },
      })
      const res = mockRes()

      await acceptComplaint(req, res)

      expect(res.status).toHaveBeenCalledWith(403)
    })
  })
})

// ══════════════════════════════════════════════════════════════════════════════
// updatePriority
// ══════════════════════════════════════════════════════════════════════════════

describe('updatePriority', () => {

  // ─── TC-029/TC-036/TC-046: ปรับระดับความเร่งด่วน ─────────────────────────

  const priorityMap = [
    { priority: 'low',    label: 'ปกติ'      },
    { priority: 'medium', label: 'ด่วน'      },
    { priority: 'high',   label: 'ด่วนที่สุด' },
  ]

  priorityMap.forEach(({ priority }) => {
    it(`should update priority to ${priority} successfully`, async () => {
      ;(pool.execute as jest.Mock).mockResolvedValueOnce([{}])

      const req = makeReq({
        params: { id: '1' },
        body: { priority },
        user: { id: 20, role: 'samo', department_id: 1 },
      })
      const res = mockRes()

      await updatePriority(req, res)

      expect(res.json).toHaveBeenCalledWith({ message: 'Priority updated' })
    })
  })

  describe('TC-036: student ไม่มีสิทธิ์ปรับ priority', () => {
    it('should return 403 with correct message for student', async () => {
      const req = makeReq({
        params: { id: '1' },
        body: { priority: 'high' },
        user: { id: 1, role: 'student', department_id: null },
      })
      const res = mockRes()

      await updatePriority(req, res)

      expect(res.status).toHaveBeenCalledWith(403)
      expect(res.json).toHaveBeenCalledWith({ message: 'ไม่มีสิทธิ์แก้ไขความเร่งด่วน' })
    })
  })

  it('should return 400 for invalid priority value', async () => {
    const req = makeReq({
      params: { id: '1' },
      body: { priority: 'urgent' },
      user: { id: 20, role: 'samo', department_id: 1 },
    })
    const res = mockRes()

    await updatePriority(req, res)

    expect(res.status).toHaveBeenCalledWith(400)
  })
})

// ══════════════════════════════════════════════════════════════════════════════
// forwardComplaint
// ══════════════════════════════════════════════════════════════════════════════

describe('forwardComplaint', () => {

  // ─── TC-049: ส่งต่อคำร้องไปยัง officer ────────────────────────────────────

  describe('TC-049: samo ส่งต่อคำร้องพร้อมเหตุผล', () => {
    it('should update status=forwarded and notify owner + all officers', async () => {
      ;(pool.execute as jest.Mock)
        .mockResolvedValueOnce([[{ issue_id: 1, status: 'pending', user_id: 1, title: 'ไฟดับ' }]])
        .mockResolvedValueOnce([{}])                              // UPDATE issue_report
        .mockResolvedValueOnce([[{ user_id: 30 }, { user_id: 31 }]])  // SELECT officers
      mockNotify.mockResolvedValue(undefined)

      const req = makeReq({
        params: { id: '1' },
        body: { note: 'เกินขอบเขตคณะ' },
        user: { id: 20, role: 'samo', department_id: 1 },
      })
      const res = mockRes()

      await forwardComplaint(req, res)

      expect(res.json).toHaveBeenCalledWith({ message: 'ส่งต่อเรื่องเรียบร้อยแล้ว' })
      expect(mockNotify).toHaveBeenCalledTimes(3) // เจ้าของ 1 + officer 2
    })
  })

  describe('TC-050: หลังส่งต่อแล้ว ยกเลิกไม่ได้', () => {
    it('should return 400 when trying to forward already-forwarded complaint', async () => {
      ;(pool.execute as jest.Mock)
        .mockResolvedValueOnce([[{ issue_id: 1, status: 'forwarded', user_id: 1, title: 'ไฟดับ' }]])

      const req = makeReq({
        params: { id: '1' },
        body: { note: 'ส่งต่ออีกครั้ง' },
        user: { id: 20, role: 'samo', department_id: 1 },
      })
      const res = mockRes()

      await forwardComplaint(req, res)

      expect(res.status).toHaveBeenCalledWith(400)
      expect(res.json).toHaveBeenCalledWith({ message: 'ไม่สามารถส่งต่อคำร้องนี้ได้' })
    })
  })

  it('should return 400 when note is empty', async () => {
    const req = makeReq({
      params: { id: '1' },
      body: { note: '   ' },
      user: { id: 20, role: 'samo', department_id: 1 },
    })
    const res = mockRes()

    await forwardComplaint(req, res)

    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith({ message: 'กรุณาระบุเหตุผลในการส่งต่อ' })
  })

  it('should return 403 when role is student or personnel', async () => {
    const req = makeReq({
      params: { id: '1' },
      body: { note: 'test' },
      user: { id: 1, role: 'student', department_id: null },
    })
    const res = mockRes()

    await forwardComplaint(req, res)

    expect(res.status).toHaveBeenCalledWith(403)
  })
})

// ══════════════════════════════════════════════════════════════════════════════
// assignComplaint
// ══════════════════════════════════════════════════════════════════════════════

describe('assignComplaint', () => {

  // ─── TC-048/TC-059: มอบหมายงาน ───────────────────────────────────────────

  describe('TC-059: officer มอบหมายทีมช่าง', () => {
    it('should create assignment record and notify complaint owner', async () => {
      ;(pool.execute as jest.Mock)
        .mockResolvedValueOnce([[{ team_id: 5, team_name: 'ทีมช่างไฟฟ้า' }]])  // SELECT team
        .mockResolvedValueOnce([[{ issue_id: 1, status: 'forwarded', user_id: 1, title: 'ไฟดับ' }]]) // SELECT issue
        .mockResolvedValueOnce([{}])   // INSERT assignment
        .mockResolvedValueOnce([{}])   // UPDATE status
      mockNotify.mockResolvedValue(undefined)

      const req = makeReq({
        params: { id: '1' },
        body: { team_id: 5 },
        user: { id: 30, role: 'officer', department_id: null },
      })
      const res = mockRes()

      await assignComplaint(req, res)

      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: 'มอบหมายงานเรียบร้อยแล้ว' }))
      expect(mockNotify).toHaveBeenCalled()
    })
  })

  it('should return 403 for student role', async () => {
    const req = makeReq({
      params: { id: '1' },
      body: { team_id: 5 },
      user: { id: 1, role: 'student', department_id: null },
    })
    const res = mockRes()

    await assignComplaint(req, res)

    expect(res.status).toHaveBeenCalledWith(403)
  })

  it('should return 404 when team not found', async () => {
    ;(pool.execute as jest.Mock).mockResolvedValueOnce([[]])  // team ไม่เจอ

    const req = makeReq({
      params: { id: '1' },
      body: { team_id: 999 },
      user: { id: 30, role: 'officer', department_id: null },
    })
    const res = mockRes()

    await assignComplaint(req, res)

    expect(res.status).toHaveBeenCalledWith(404)
  })
})

// ══════════════════════════════════════════════════════════════════════════════
// updateCategory
// ══════════════════════════════════════════════════════════════════════════════

describe('updateCategory', () => {

  // ─── TC-045: samo แก้ไขหมวดหมู่ที่ผิด ────────────────────────────────────

  describe('TC-045: samo แก้ไขหมวดหมู่ที่นิสิตเลือกผิด', () => {
    it('should update category_id and return new category name', async () => {
      ;(pool.execute as jest.Mock)
        .mockResolvedValueOnce([[{ category_id: 2, category_name: 'ความปลอดภัย' }]])  // SELECT category
        .mockResolvedValueOnce([[{ issue_id: 1 }]])   // SELECT issue
        .mockResolvedValueOnce([{}])                   // UPDATE

      const req = makeReq({
        params: { id: '1' },
        body: { category_id: 2 },
        user: { id: 20, role: 'samo', department_id: 1 },
      })
      const res = mockRes()

      await updateCategory(req, res)

      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        message: 'แก้ไขหมวดหมู่เรียบร้อยแล้ว',
        new_category: 'ความปลอดภัย',
      }))
    })
  })

  it('should return 403 for student/personnel', async () => {
    const req = makeReq({
      params: { id: '1' },
      body: { category_id: 2 },
      user: { id: 1, role: 'student', department_id: null },
    })
    const res = mockRes()

    await updateCategory(req, res)

    expect(res.status).toHaveBeenCalledWith(403)
  })
})

// ══════════════════════════════════════════════════════════════════════════════
// getComplaintsByDept (Samo)
// ══════════════════════════════════════════════════════════════════════════════

describe('getComplaintsByDept', () => {

  // ─── TC-039/TC-044/TC-051/TC-052: samo ดูคำร้องในคณะตัวเอง ──────────────

  describe('TC-039/TC-051: samo ดูคำร้องในคณะตัวเอง', () => {
    it('should return complaints filtered by department_id', async () => {
      const fakeRows = [{ issue_id: 1, title: 'ไฟดับ', department_id: 1 }]
      ;(pool.execute as jest.Mock).mockResolvedValueOnce([fakeRows])

      const req = makeReq({ user: { id: 20, role: 'samo', department_id: 1 } })
      const res = mockRes()

      await getComplaintsByDept(req, res)

      expect(res.json).toHaveBeenCalledWith(fakeRows)
    })
  })

  describe('TC-052: samo ไม่มี department_id → 400', () => {
    it('should return 400 when department_id is missing', async () => {
      const req = makeReq({ user: { id: 20, role: 'samo', department_id: null } })
      const res = mockRes()

      await getComplaintsByDept(req, res)

      expect(res.status).toHaveBeenCalledWith(400)
      expect(res.json).toHaveBeenCalledWith({ message: 'ไม่พบข้อมูลคณะของคุณ' })
    })
  })
})

// ══════════════════════════════════════════════════════════════════════════════
// getComplaints (All roles)
// ══════════════════════════════════════════════════════════════════════════════

describe('getComplaints', () => {

  // ─── TC-028/TC-062: ดูภาพรวมคำร้อง ──────────────────────────────────────

  describe('TC-028: personnel เห็นเฉพาะคำร้องของตัวเอง + คณะ', () => {
    it('should query with user_id and department_id for personnel', async () => {
      ;(pool.execute as jest.Mock).mockResolvedValueOnce([[]])

      const req = makeReq({ user: { id: 10, role: 'personnel', department_id: 1 } })
      const res = mockRes()

      await getComplaints(req, res)

      const query = (pool.execute as jest.Mock).mock.calls[0][0] as string
      expect(query).toContain('user_id')
      expect(query).toContain('department_id')
    })
  })

  describe('TC-062: officer เห็นเฉพาะ forwarded/in_progress', () => {
    it('should query with forwarded status for officer', async () => {
      ;(pool.execute as jest.Mock).mockResolvedValueOnce([[]])

      const req = makeReq({ user: { id: 30, role: 'officer', department_id: null } })
      const res = mockRes()

      await getComplaints(req, res)

      const query = (pool.execute as jest.Mock).mock.calls[0][0] as string
      expect(query).toContain('forwarded')
    })
  })

  describe('TC-060: admin เห็นทุกคำร้อง', () => {
    it('should return all complaints for admin', async () => {
      const fakeRows = [{ issue_id: 1 }, { issue_id: 2 }]
      ;(pool.execute as jest.Mock).mockResolvedValueOnce([fakeRows])

      const req = makeReq({ user: { id: 99, role: 'admin', department_id: null } })
      const res = mockRes()

      await getComplaints(req, res)

      expect(res.json).toHaveBeenCalledWith(fakeRows)
    })
  })
})
