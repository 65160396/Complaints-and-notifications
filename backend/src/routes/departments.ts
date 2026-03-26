import { Router } from 'express'
import pool from '../db'
import { protect } from '../middleware/authMiddleware'

const router = Router()

// ดึงรายชื่อคณะทั้งหมด (ไม่ต้อง login สำหรับหน้า register)
router.get('/', async (_req, res) => {
  const [rows] = await pool.execute('SELECT * FROM department ORDER BY department_name ASC')
  res.json(rows)
})

export default router