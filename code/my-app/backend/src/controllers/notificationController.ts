import { Response } from 'express'
import pool from '../db'
import { AuthRequest } from '../middleware/authMiddleware'

// ดึง notification ของ user คนนี้
export const getNotifications = async (req: AuthRequest, res: Response) => {
  const [rows] = await pool.execute(`
    SELECT n.*, 
           i.title as issue_title,
           i.status as issue_status
    FROM notification n
    LEFT JOIN issue_report i ON n.issue_id = i.issue_id
    WHERE n.user_id = ?
    ORDER BY n.created_at DESC
    LIMIT 50
  `, [req.user!.id])
  res.json(rows)
}

// จำนวน notification ที่ยังไม่ได้อ่าน
export const getUnreadCount = async (req: AuthRequest, res: Response) => {
  const [rows]: any = await pool.execute(
    'SELECT COUNT(*) as count FROM notification WHERE user_id = ? AND is_read = 0',
    [req.user!.id]
  )
  res.json({ count: rows[0].count })
}

// mark อ่านแล้วทีละอัน
export const markAsRead = async (req: AuthRequest, res: Response) => {
  const { id } = req.params
  await pool.execute(
    'UPDATE notification SET is_read = 1 WHERE notification_id = ? AND user_id = ?',
    [id, req.user!.id]
  )
  res.json({ message: 'Marked as read' })
}

// mark อ่านแล้วทั้งหมด
export const markAllAsRead = async (req: AuthRequest, res: Response) => {
  await pool.execute(
    'UPDATE notification SET is_read = 1 WHERE user_id = ? AND is_read = 0',
    [req.user!.id]
  )
  res.json({ message: 'All marked as read' })
}

// helper: สร้าง notification โดยเช็ค settings ก่อนเสมอ
// type: 'status_change' | 'new_complaint'
export const createNotification = async (
  userId: number,
  message: string,
  issueId?: number,
  channel: string = 'in_app',
  type: 'status_change' | 'new_complaint' = 'status_change'
) => {
  // ดึง settings ของ user นี้
  const [settingsRows]: any = await pool.execute(
    'SELECT * FROM notification_settings WHERE user_id = ?',
    [userId]
  )
  const settings = settingsRows[0]

  // ถ้าไม่มี settings = ใช้ค่า default (เปิดทุกอย่าง)
  const inAppEnabled      = settings ? settings.in_app_enabled       : 1
  const notifyStatus      = settings ? settings.notify_status_change : 1
  const notifyNewComplaint = settings ? settings.notify_new_complaint : 1

  // เช็คว่าควรส่งหรือไม่
  if (!inAppEnabled) return
  if (type === 'status_change'  && !notifyStatus)       return
  if (type === 'new_complaint'  && !notifyNewComplaint) return

  await pool.execute(
    `INSERT INTO notification (user_id, issue_id, message, channel, is_read, type)
     VALUES (?, ?, ?, ?, 0, ?)`,
    [userId, issueId || null, message, channel, type]
  )
}
// Admin — broadcast แจ้งเตือนฉุกเฉินไปยังกลุ่มผู้ใช้
export const broadcastNotification = async (req: AuthRequest, res: Response) => {
  if (req.user!.role !== 'admin') return res.status(403).json({ message: 'ไม่มีสิทธิ์' })
  const { message, target_roles } = req.body
  if (!message || !message.trim()) return res.status(400).json({ message: 'กรุณาระบุข้อความ' })

  // target_roles: ['all'] หรือ ['student','personnel','samo','officer','admin']
  let userQuery = 'SELECT user_id FROM app_user WHERE is_active = 1'
  const params: any[] = []
  if (target_roles && target_roles.length > 0 && !target_roles.includes('all')) {
    const placeholders = target_roles.map(() => '?').join(',')
    userQuery += ` AND role IN (${placeholders})`
    params.push(...target_roles)
  }

  const [users]: any = await pool.execute(userQuery, params)
  let sent = 0
  for (const u of users) {
    await pool.execute(
      `INSERT INTO notification (user_id, issue_id, message, channel, is_read, type)
       VALUES (?, NULL, ?, 'in_app', 0, 'status_change')`,
      [u.user_id, message.trim()]
    )
    sent++
  }
  res.json({ message: `ส่งแจ้งเตือนสำเร็จ ${sent} คน` })
}
