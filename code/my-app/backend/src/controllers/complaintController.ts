import { Response } from 'express'
import pool from '../db'
import { AuthRequest } from '../middleware/authMiddleware'
import { createNotification } from './notificationController'

export const getComplaints = async (req: AuthRequest, res: Response) => {
  const [rows] = await pool.execute(`
    SELECT i.*, u.firstname, u.lastname, u.email,
           c.category_name, l.building, l.floor, l.room
    FROM issue_report i
    JOIN app_user u ON i.user_id = u.user_id
    JOIN category c ON i.category_id = c.category_id
    JOIN location l ON i.location_id = l.location_id
    ORDER BY i.created_at DESC
  `)
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
      await pool.execute(
        'INSERT INTO issue_image (issue_id, image_path) VALUES (?, ?)',
        [issueId, file.path]
      )
    }
  }

  // US6 — แจ้งเตือน personnel/samo/officer ว่ามีคำร้องใหม่
  const [staffRows]: any = await pool.execute(
    `SELECT user_id FROM app_user WHERE role IN ('personnel', 'samo', 'officer', 'admin')`
  )
  for (const staff of staffRows) {
    await createNotification(
      staff.user_id,
      `มีคำร้องใหม่: "${title}"`,
      issueId
    )
  }

  res.status(201).json({ message: 'Issue reported successfully', issue_id: issueId })
}

// อัปเดตสถานะ + แจ้งเจ้าของคำร้อง
export const updateStatus = async (req: AuthRequest, res: Response) => {
  const { id } = req.params
  const { status } = req.body

  // ดึงข้อมูลคำร้องก่อนเพื่อรู้ว่าเจ้าของคือใคร
  const [rows]: any = await pool.execute(
    'SELECT user_id, title FROM issue_report WHERE issue_id = ?',
    [id]
  )
  const complaint = rows[0]

  await pool.execute(
    'UPDATE issue_report SET status = ? WHERE issue_id = ?',
    [status, id]
  )

  // US6 — แจ้งเตือนเจ้าของคำร้องเมื่อสถานะเปลี่ยน
  if (complaint) {
    const statusMessages: Record<string, string> = {
      in_progress: `คำร้อง "${complaint.title}" กำลังได้รับการดำเนินการแล้ว`,
      resolved:    `คำร้อง "${complaint.title}" ได้รับการแก้ไขเรียบร้อยแล้ว ✅`,
      cancelled:   `คำร้อง "${complaint.title}" ถูกยกเลิก`,
    }
    const message = statusMessages[status]
    if (message) {
      await createNotification(complaint.user_id, message, Number(id))
    }
  }

  res.json({ message: 'Status updated' })
}

// D8 — กำหนดระดับความเร่งด่วน
export const updatePriority = async (req: AuthRequest, res: Response) => {
  const { id } = req.params
  const { priority } = req.body
  const allowedRoles = ['personnel', 'samo', 'officer', 'admin']

  if (!allowedRoles.includes(req.user!.role)) {
    return res.status(403).json({ message: 'ไม่มีสิทธิ์เปลี่ยนระดับความเร่งด่วน' })
  }

  const validPriorities = ['low', 'medium', 'high']
  if (!validPriorities.includes(priority)) {
    return res.status(400).json({ message: 'ระดับความเร่งด่วนไม่ถูกต้อง' })
  }

  await pool.execute(
    'UPDATE issue_report SET priority = ? WHERE issue_id = ?',
    [priority, id]
  )
  res.json({ message: 'Priority updated' })
}

// US10/D10 — ยกเลิกการร้องเรียน
export const cancelComplaint = async (req: AuthRequest, res: Response) => {
  const { id } = req.params
  const userId = req.user!.id

  const [rows]: any = await pool.execute(
    'SELECT * FROM issue_report WHERE issue_id = ? AND user_id = ?',
    [id, userId]
  )
  const complaint = rows[0]

  if (!complaint) {
    return res.status(404).json({ message: 'ไม่พบคำร้องนี้' })
  }
  if (complaint.status !== 'pending') {
    return res.status(400).json({ message: 'ยกเลิกได้เฉพาะคำร้องที่อยู่ในสถานะรอดำเนินการเท่านั้น' })
  }

  await pool.execute(
    'UPDATE issue_report SET status = ? WHERE issue_id = ?',
    ['cancelled', id]
  )
  res.json({ message: 'ยกเลิกคำร้องเรียบร้อยแล้ว' })
}

// US8/D9 — ดึงรูปภาพของคำร้อง
export const getComplaintImages = async (req: AuthRequest, res: Response) => {
  const { id } = req.params
  const [rows] = await pool.execute(
    'SELECT * FROM issue_image WHERE issue_id = ? ORDER BY uploaded_at ASC',
    [id]
  )
  res.json(rows)
}