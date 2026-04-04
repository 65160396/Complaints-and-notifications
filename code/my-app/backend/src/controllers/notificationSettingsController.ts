import { Response } from 'express'
import pool from '../db'
import { AuthRequest } from '../middleware/authMiddleware'

// ค่า default
const DEFAULT_SETTINGS = {
  in_app_enabled:       1,
  notify_status_change: 1,
  notify_new_complaint: 1,
}

// ดึงการตั้งค่า — ถ้ายังไม่มีให้คืนค่า default
export const getSettings = async (req: AuthRequest, res: Response) => {
  const [rows]: any = await pool.execute(
    'SELECT * FROM notification_settings WHERE user_id = ?',
    [req.user!.id]
  )

  if (!rows[0]) {
    return res.json({ ...DEFAULT_SETTINGS, user_id: req.user!.id, is_default: true })
  }

  res.json({ ...rows[0], is_default: false })
}

// บันทึกการตั้งค่า — ถ้ายังไม่มีให้ INSERT, ถ้ามีแล้วให้ UPDATE
export const updateSettings = async (req: AuthRequest, res: Response) => {
  const { in_app_enabled, notify_status_change, notify_new_complaint } = req.body
  const userId = req.user!.id

  const [existing]: any = await pool.execute(
    'SELECT setting_id FROM notification_settings WHERE user_id = ?',
    [userId]
  )

  if (existing[0]) {
    await pool.execute(
      `UPDATE notification_settings
       SET in_app_enabled = ?, notify_status_change = ?, notify_new_complaint = ?
       WHERE user_id = ?`,
      [
        in_app_enabled       ?? DEFAULT_SETTINGS.in_app_enabled,
        notify_status_change ?? DEFAULT_SETTINGS.notify_status_change,
        notify_new_complaint ?? DEFAULT_SETTINGS.notify_new_complaint,
        userId,
      ]
    )
  } else {
    await pool.execute(
      `INSERT INTO notification_settings (user_id, in_app_enabled, notify_status_change, notify_new_complaint)
       VALUES (?, ?, ?, ?)`,
      [
        userId,
        in_app_enabled       ?? DEFAULT_SETTINGS.in_app_enabled,
        notify_status_change ?? DEFAULT_SETTINGS.notify_status_change,
        notify_new_complaint ?? DEFAULT_SETTINGS.notify_new_complaint,
      ]
    )
  }

  res.json({ message: 'บันทึกการตั้งค่าเรียบร้อยแล้ว' })
}

// คืนค่าเริ่มต้น
export const resetSettings = async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id

  await pool.execute(
    `INSERT INTO notification_settings (user_id, in_app_enabled, notify_status_change, notify_new_complaint)
     VALUES (?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
       in_app_enabled = ?, notify_status_change = ?, notify_new_complaint = ?`,
    [
      userId,
      DEFAULT_SETTINGS.in_app_enabled,
      DEFAULT_SETTINGS.notify_status_change,
      DEFAULT_SETTINGS.notify_new_complaint,
      DEFAULT_SETTINGS.in_app_enabled,
      DEFAULT_SETTINGS.notify_status_change,
      DEFAULT_SETTINGS.notify_new_complaint,
    ]
  )

  res.json({ message: 'คืนค่าเริ่มต้นเรียบร้อยแล้ว', settings: DEFAULT_SETTINGS })
}