import { Router } from 'express'
import pool from '../db'
import { protect, AuthRequest } from '../middleware/authMiddleware'

const router = Router()

// ดึงรายการหน่วยงานทั้งหมด
router.get('/', protect, async (_req, res) => {
  const [rows] = await pool.execute('SELECT * FROM work_team ORDER BY team_name ASC')
  res.json(rows)
})

// Admin เพิ่ม/แก้ไขหน่วยงาน
router.post('/', protect, async (req: AuthRequest, res) => {
  if (req.user!.role !== 'admin') return res.status(403).json({ message: 'ไม่มีสิทธิ์' })
  const { team_name, description } = req.body
  if (!team_name) return res.status(400).json({ message: 'กรุณาระบุชื่อหน่วยงาน' })
  const [result]: any = await pool.execute(
    'INSERT INTO work_team (team_name, description) VALUES (?, ?)', [team_name, description || null]
  )
  res.status(201).json({ message: 'เพิ่มหน่วยงานสำเร็จ', team_id: result.insertId })
})

export default router
