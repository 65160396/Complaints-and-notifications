import { Response } from 'express'
import pool from '../db'
import { AuthRequest } from '../middleware/authMiddleware'
import { createNotification } from './notificationController'

export const getComplaints = async (req: AuthRequest, res: Response) => {
  const [rows] = await pool.execute(`
    SELECT i.*, u.firstname, u.lastname, u.email,
           c.category_name, l.building, l.floor, l.room,
           a.firstname as accepted_firstname, a.lastname as accepted_lastname
    FROM issue_report i
    JOIN app_user u ON i.user_id = u.user_id
    JOIN category c ON i.category_id = c.category_id
    JOIN location l ON i.location_id = l.location_id
    LEFT JOIN app_user a ON i.accepted_by = a.user_id
    ORDER BY i.created_at DESC
  `)
  res.json(rows)
}

export const getComplaintsByDept = async (req: AuthRequest, res: Response) => {
  const deptId = req.user!.department_id
  if (!deptId) return res.status(400).json({ message: 'ไม่พบข้อมูลคณะของคุณ' })

  const [rows] = await pool.execute(`
    SELECT i.*, u.firstname, u.lastname, u.email,
           c.category_name, l.building, l.floor, l.room,
           a.firstname as accepted_firstname, a.lastname as accepted_lastname
    FROM issue_report i
    JOIN app_user u ON i.user_id = u.user_id
    JOIN category c ON i.category_id = c.category_id
    JOIN location l ON i.location_id = l.location_id
    LEFT JOIN app_user a ON i.accepted_by = a.user_id
    WHERE (u.department_id = ? OR u.department_id IS NULL)
    ORDER BY i.created_at DESC
  `, [deptId])
  res.json(rows)
}

export const getMyComplaints = async (req: AuthRequest, res: Response) => {
  const [rows] = await pool.execute(`
    SELECT i.*, c.category_name, l.building, l.floor, l.room
    FROM issue_report i
    JOIN category c ON i.category_id = c.category_id
    JOIN location l ON i.location_id = l.location_id
    WHERE i.user_id = ?
    ORDER BY i.created_at DESC
  `, [req.user!.id])
  res.json(rows)
}

// US8/D9 — สร้างคำร้องพร้อมรูปภาพ + แจ้ง personnel/samo/officer
export const createComplaint = async (req: AuthRequest, res: Response) => {
  const { title, description, category_id, location_id, priority } = req.body
  const files = req.files as Express.Multer.File[]

  const [result]: any = await pool.execute(
    `INSERT INTO issue_report (user_id, title, description, category_id, location_id, priority, status)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [req.user!.id, title, description, category_id, location_id, priority || 'medium', 'pending']
  )
  const issueId = result.insertId

  if (files && files.length > 0) {
    for (const file of files) {
      await pool.execute('INSERT INTO issue_image (issue_id, image_path) VALUES (?, ?)', [issueId, file.path])
    }
  }

  const reporterDeptId = req.user!.department_id
  let staffQuery = `SELECT user_id FROM app_user WHERE role IN ('samo', 'officer', 'admin')`
  const staffParams: any[] = []
  if (reporterDeptId) {
    staffQuery = `SELECT user_id FROM app_user WHERE role IN ('samo', 'officer', 'admin') AND (department_id = ? OR role IN ('officer', 'admin'))`
    staffParams.push(reporterDeptId)
  }

  const [staffRows]: any = await pool.execute(staffQuery, staffParams)
  for (const staff of staffRows) {
    await createNotification(staff.user_id, `มีคำร้องใหม่: "${title}"`, issueId, 'in_app', 'new_complaint')
  }

  res.status(201).json({ message: 'Issue reported successfully', issue_id: issueId })
}

// อัปเดตสถานะ + แจ้งเจ้าของคำร้อง
export const updateStatus = async (req: AuthRequest, res: Response) => {
  const { id } = req.params
  const { status } = req.body

  const [rows]: any = await pool.execute('SELECT user_id, title FROM issue_report WHERE issue_id = ?', [id])
  const complaint = rows[0]

  await pool.execute('UPDATE issue_report SET status = ? WHERE issue_id = ?', [status, id])

  // US6 — แจ้งเตือนเจ้าของคำร้องเมื่อสถานะเปลี่ยน
  if (complaint) {
    const msgs: Record<string, string> = {
      in_progress: `คำร้อง "${complaint.title}" กำลังได้รับการดำเนินการแล้ว`,
      resolved:    `คำร้อง "${complaint.title}" ได้รับการแก้ไขเรียบร้อยแล้ว ✅`,
      cancelled:   `คำร้อง "${complaint.title}" ถูกยกเลิก`,
      forwarded:   `คำร้อง "${complaint.title}" ถูกส่งต่อไปยังเจ้าหน้าที่มหาวิทยาลัยแล้ว`,
      pending:     `คำร้อง "${complaint.title}" ถูกตั้งค่ากลับเป็นรอดำเนินการ`, // ✅ เพิ่ม
    }
    if (msgs[status]) {
      await createNotification(complaint.user_id, msgs[status], Number(id), 'in_app', 'status_change')
    } else {
      // ✅ log เพื่อ debug กรณี status ไม่ตรง
      console.warn(`[updateStatus] ไม่พบ message สำหรับ status: "${status}"`)
    }
  }

  res.json({ message: 'Status updated' })
}

export const acceptComplaint = async (req: AuthRequest, res: Response) => {
  const { id } = req.params
  const userId = req.user!.id

  if (!['samo', 'officer', 'admin'].includes(req.user!.role)) {
    return res.status(403).json({ message: 'ไม่มีสิทธิ์รับเรื่อง' })
  }

  const [rows]: any = await pool.execute('SELECT * FROM issue_report WHERE issue_id = ?', [id])
  const complaint = rows[0]

  if (!complaint) return res.status(404).json({ message: 'ไม่พบคำร้องนี้' })
  if (complaint.accepted_by) return res.status(400).json({ message: 'คำร้องนี้มีผู้รับเรื่องไปแล้ว' })
  if (complaint.status !== 'pending') return res.status(400).json({ message: 'รับได้เฉพาะคำร้องที่รอดำเนินการ' })

  await pool.execute(
    'UPDATE issue_report SET accepted_by = ?, status = ? WHERE issue_id = ?',
    [userId, 'in_progress', id]
  )

  await createNotification(
    complaint.user_id,
    `คำร้อง "${complaint.title}" กำลังได้รับการดำเนินการแล้ว`,
    Number(id), 'in_app', 'status_change'
  )
  res.json({ message: 'รับเรื่องเรียบร้อยแล้ว' })
}

export const updateCategory = async (req: AuthRequest, res: Response) => {
  const { id } = req.params
  const { category_id } = req.body

  if (!['samo', 'admin'].includes(req.user!.role)) {
    return res.status(403).json({ message: 'ไม่มีสิทธิ์แก้ไขหมวดหมู่' })
  }
  if (!category_id) return res.status(400).json({ message: 'กรุณาเลือกหมวดหมู่' })

  const [catRows]: any = await pool.execute('SELECT * FROM category WHERE category_id = ?', [category_id])
  if (!catRows[0]) return res.status(400).json({ message: 'ไม่พบหมวดหมู่นี้' })

  const [issueRows]: any = await pool.execute(
    'SELECT i.*, c.category_name FROM issue_report i JOIN category c ON i.category_id = c.category_id WHERE i.issue_id = ?',
    [id]
  )
  if (!issueRows[0]) return res.status(404).json({ message: 'ไม่พบคำร้องนี้' })

  await pool.execute('UPDATE issue_report SET category_id = ? WHERE issue_id = ?', [category_id, id])
  res.json({ message: 'แก้ไขหมวดหมู่เรียบร้อยแล้ว', new_category: catRows[0].category_name })
}

// US7 — มอบหมายงานภายในคณะ
export const assignComplaint = async (req: AuthRequest, res: Response) => {
  const { id } = req.params
  const { assigned_to } = req.body
  const assignedBy = req.user!.id

  if (!['samo', 'officer', 'admin'].includes(req.user!.role)) {
    return res.status(403).json({ message: 'ไม่มีสิทธิ์มอบหมายงาน' })
  }
  if (!assigned_to) return res.status(400).json({ message: 'กรุณาระบุผู้รับผิดชอบ' })

  // ตรวจสอบว่า user ที่จะมอบหมายให้มีอยู่จริง
  const [userRows]: any = await pool.execute(
    'SELECT user_id, firstname, lastname FROM app_user WHERE user_id = ?',
    [assigned_to]
  )
  if (!userRows[0]) return res.status(404).json({ message: 'ไม่พบผู้ใช้นี้' })

  const [issueRows]: any = await pool.execute('SELECT * FROM issue_report WHERE issue_id = ?', [id])
  const issue = issueRows[0]
  if (!issue) return res.status(404).json({ message: 'ไม่พบคำร้องนี้' })

  // บันทึกลงตาราง assignment
  await pool.execute(
    `INSERT INTO assignment (issue_id, department_id, assigned_by, assigned_to)
     VALUES (?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE assigned_to = ?, assigned_by = ?, assigned_at = current_timestamp()`,
    [id, req.user!.department_id || 0, assignedBy, assigned_to, assigned_to, assignedBy]
  )

  // แจ้งเตือนคนที่ถูกมอบหมายงาน
  const assignee = userRows[0]
  await createNotification(
    assigned_to,
    `คุณได้รับมอบหมายให้ดูแลคำร้อง: "${issue.title}"`,
    Number(id), 'in_app', 'new_complaint'
  )

  res.json({
    message: 'มอบหมายงานเรียบร้อยแล้ว',
    assigned_to: `${assignee.firstname} ${assignee.lastname}`
  })
}

// US8 — ส่งต่อเจ้าหน้าที่มหาวิทยาลัย
export const forwardComplaint = async (req: AuthRequest, res: Response) => {
  const { id } = req.params
  const { note } = req.body
  const userId = req.user!.id

  if (req.user!.role !== 'samo' && req.user!.role !== 'admin') {
    return res.status(403).json({ message: 'ไม่มีสิทธิ์ส่งต่อ' })
  }
  if (!note || !note.trim()) {
    return res.status(400).json({ message: 'กรุณาระบุเหตุผลในการส่งต่อ' })
  }

  const [rows]: any = await pool.execute('SELECT * FROM issue_report WHERE issue_id = ?', [id])
  const issue = rows[0]
  if (!issue) return res.status(404).json({ message: 'ไม่พบคำร้องนี้' })

  if (!['pending', 'in_progress'].includes(issue.status)) {
    return res.status(400).json({ message: 'ไม่สามารถส่งต่อคำร้องนี้ได้' })
  }

  // เปลี่ยน status เป็น forwarded + บันทึกหมายเหตุ
  await pool.execute(
    'UPDATE issue_report SET status = ?, forwarded_note = ?, accepted_by = ? WHERE issue_id = ?',
    ['forwarded', note.trim(), userId, id]
  )

  // แจ้งเตือนเจ้าของคำร้อง
  await createNotification(
    issue.user_id,
    `คำร้อง "${issue.title}" ถูกส่งต่อไปยังเจ้าหน้าที่มหาวิทยาลัยแล้ว`,
    Number(id), 'in_app', 'status_change'
  )

  // แจ้งเตือน officer ทุกคน
  const [officerRows]: any = await pool.execute(
    `SELECT user_id FROM app_user WHERE role IN ('officer', 'admin')`
  )
  for (const officer of officerRows) {
    await createNotification(
      officer.user_id,
      `มีคำร้องส่งต่อมาจากสโมสรคณะ: "${issue.title}"`,
      Number(id), 'in_app', 'new_complaint'
    )
  }

  res.json({ message: 'ส่งต่อเรื่องเรียบร้อยแล้ว' })
}

export const updatePriority = async (req: AuthRequest, res: Response) => {
  const { id } = req.params
  const { priority } = req.body

  if (!['personnel', 'samo', 'officer', 'admin'].includes(req.user!.role)) {
    return res.status(403).json({ message: 'ไม่มีสิทธิ์' })
  }

  const validPriorities = ['low', 'medium', 'high']
  if (!validPriorities.includes(priority)) return res.status(400).json({ message: 'ระดับความเร่งด่วนไม่ถูกต้อง' })

  await pool.execute('UPDATE issue_report SET priority = ? WHERE issue_id = ?', [priority, id])
  res.json({ message: 'Priority updated' })
}

// US10/D10 — ยกเลิกการร้องเรียน
export const cancelComplaint = async (req: AuthRequest, res: Response) => {
  const { id } = req.params
  const userId = req.user!.id

  const [rows]: any = await pool.execute('SELECT * FROM issue_report WHERE issue_id = ? AND user_id = ?', [id, userId])
  const complaint = rows[0]

  if (!complaint) return res.status(404).json({ message: 'ไม่พบคำร้องนี้' })
  if (complaint.status !== 'pending') return res.status(400).json({ message: 'ยกเลิกได้เฉพาะคำร้องที่รอดำเนินการ' })

  await pool.execute('UPDATE issue_report SET status = ? WHERE issue_id = ?', ['cancelled', id])
  res.json({ message: 'ยกเลิกคำร้องเรียบร้อยแล้ว' })
}

// US8/D9 — ดึงรูปภาพของคำร้อง
export const getComplaintImages = async (req: AuthRequest, res: Response) => {
  const { id } = req.params
  const [rows] = await pool.execute('SELECT * FROM issue_image WHERE issue_id = ? ORDER BY uploaded_at ASC', [id])
  res.json(rows)
}