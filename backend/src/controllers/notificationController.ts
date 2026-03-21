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

// helper: สร้าง notification (ใช้เรียกจาก controller อื่น)
export const createNotification = async (
  userId: number,
  message: string,
  issueId?: number,
  channel: string = 'in_app'
) => {
  await pool.execute(
    `INSERT INTO notification (user_id, issue_id, message, channel, is_read)
     VALUES (?, ?, ?, ?, 0)`,
    [userId, issueId || null, message, channel]
  )
}