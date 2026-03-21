import { Router } from 'express'
import pool from '../db'
import { protect } from '../middleware/authMiddleware'
import { AuthRequest } from '../middleware/authMiddleware'

const router = Router()

router.get('/', protect, async (req: AuthRequest, res) => {
  const role = req.user!.role

  // กำหนดว่า role นี้ควรเห็น category อะไรบ้าง
  // personnel/samo/officer/admin เห็น category ของตัวเอง + all
  // student เห็นเฉพาะ student + all
  let forRoles: string[]

  if (role === 'personnel' || role === 'samo' || role === 'officer' || role === 'admin') {
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

export default router