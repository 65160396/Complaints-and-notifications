import { Response } from 'express'
import pool from '../db'
import { AuthRequest } from '../middleware/authMiddleware'

// ส่งผลประเมิน
export const submitSurvey = async (req: AuthRequest, res: Response) => {
  const { issue_id, rating, comment } = req.body
  const userId = req.user!.id

  if (!rating || rating < 1 || rating > 5) {
    return res.status(400).json({ message: 'กรุณาให้คะแนน 1-5 ดาว' })
  }

  // ตรวจสอบว่าคำร้องนี้เป็นของ user และ status เป็น resolved
  const [rows]: any = await pool.execute(
    'SELECT * FROM issue_report WHERE issue_id = ? AND user_id = ? AND status = ?',
    [issue_id, userId, 'resolved']
  )
  if (!rows[0]) {
    return res.status(400).json({ message: 'ไม่พบคำร้องนี้ หรือยังไม่ได้รับการแก้ไข' })
  }

  // ตรวจสอบว่าเคยประเมินไปแล้วหรือยัง (UNIQUE KEY จะป้องกันอยู่แล้ว แต่ return message ที่ดีกว่า)
  const [existing]: any = await pool.execute(
    'SELECT * FROM satisfaction_survey WHERE issue_id = ?',
    [issue_id]
  )
  if (existing[0]) {
    return res.status(400).json({ message: 'คุณได้ประเมินคำร้องนี้ไปแล้ว' })
  }

  await pool.execute(
    'INSERT INTO satisfaction_survey (issue_id, user_id, rating, comment) VALUES (?, ?, ?, ?)',
    [issue_id, userId, rating, comment || null]
  )

  res.status(201).json({ message: 'ขอบคุณสำหรับการประเมิน' })
}

// ดึงผลประเมินของคำร้อง (สำหรับ staff/admin ดูได้)
export const getSurvey = async (req: AuthRequest, res: Response) => {
  const { issue_id } = req.params
  const [rows]: any = await pool.execute(
    'SELECT * FROM satisfaction_survey WHERE issue_id = ?',
    [issue_id]
  )
  res.json(rows[0] || null)
}