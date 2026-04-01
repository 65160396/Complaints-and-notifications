import { Router } from 'express'
import pool from '../db'
import { protect } from '../middleware/authMiddleware'
import { AuthRequest } from '../middleware/authMiddleware'

const router = Router()

// ดึง category ตาม role ของ user
router.get('/', protect, async (req: AuthRequest, res) => {
  const role = req.user!.role
  let forRoles: string[]

  if (['personnel', 'samo', 'officer', 'admin'].includes(role)) {
    forRoles = ['personnel', 'all']
  } else {
    forRoles = ['student', 'all']
  }

  const placeholders = forRoles.map(() => '?').join(', ')
  const [rows] = await pool.execute(
    `SELECT * FROM category WHERE for_role IN (${placeholders}) ORDER BY category_id ASC`,
    forRoles
  )
  res.json(rows)
})

// ดึง category ทั้งหมด (สำหรับ Samo คัดกรอง)
router.get('/all', protect, async (req: AuthRequest, res) => {
  const allowedRoles = ['samo', 'officer', 'admin']
  if (!allowedRoles.includes(req.user!.role)) {
    return res.status(403).json({ message: 'ไม่มีสิทธิ์' })
  }
  const [rows] = await pool.execute('SELECT * FROM category ORDER BY category_id ASC')
  res.json(rows)
})

export default router