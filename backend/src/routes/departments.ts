import { Router } from 'express'
import pool from '../db'
import { protect } from '../middleware/authMiddleware'

const router = Router()

// ดึงรายชื่อคณะทั้งหมด (ไม่ต้อง login สำหรับหน้า register)
router.get('/', async (_req, res) => {
  const [rows] = await pool.execute('SELECT * FROM department ORDER BY department_name ASC')
  res.json(rows)
})

// ดึง users ในคณะ สำหรับ Samo มอบหมายงาน (US7)
router.get('/:dept_id/users', protect, async (req, res) => {
  const { dept_id } = req.params
  const [rows] = await pool.execute(
    `SELECT user_id, firstname, lastname, role FROM app_user
     WHERE department_id = ? ORDER BY firstname ASC`,
    [dept_id]
  )
  res.json(rows)
})

export default router