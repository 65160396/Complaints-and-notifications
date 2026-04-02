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

// Admin — เพิ่มหมวดหมู่
router.post('/', protect, async (req: AuthRequest, res) => {
  if (req.user!.role !== 'admin') return res.status(403).json({ message: 'ไม่มีสิทธิ์' })
  const { category_name, for_role } = req.body
  if (!category_name) return res.status(400).json({ message: 'กรุณากรอกชื่อหมวดหมู่' })
  const [result]: any = await pool.execute(
    'INSERT INTO category (category_name, for_role) VALUES (?, ?)',
    [category_name, for_role || 'all']
  )
  res.status(201).json({ message: 'เพิ่มหมวดหมู่สำเร็จ', category_id: result.insertId })
})

// Admin — แก้ไขหมวดหมู่
router.put('/:id', protect, async (req: AuthRequest, res) => {
  if (req.user!.role !== 'admin') return res.status(403).json({ message: 'ไม่มีสิทธิ์' })
  const { category_name, for_role } = req.body
  await pool.execute(
    'UPDATE category SET category_name = ?, for_role = ? WHERE category_id = ?',
    [category_name, for_role || 'all', req.params.id]
  )
  res.json({ message: 'แก้ไขหมวดหมู่สำเร็จ' })
})

// Admin — ลบหมวดหมู่
router.delete('/:id', protect, async (req: AuthRequest, res) => {
  if (req.user!.role !== 'admin') return res.status(403).json({ message: 'ไม่มีสิทธิ์' })
  await pool.execute('DELETE FROM category WHERE category_id = ?', [req.params.id])
  res.json({ message: 'ลบหมวดหมู่สำเร็จ' })
})

export default router