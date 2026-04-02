import { Router } from 'express'
import pool from '../db'
import { protect, AuthRequest } from '../middleware/authMiddleware'

const router = Router()

router.get('/', protect, async (req, res) => {
  const [rows] = await pool.execute('SELECT * FROM location')
  res.json(rows)
})


// Admin — เพิ่มสถานที่
router.post('/', protect, async (req: AuthRequest, res) => {
  if (req.user!.role !== 'admin') return res.status(403).json({ message: 'ไม่มีสิทธิ์' })
  const { building, floor, room, department_id } = req.body
  if (!building) return res.status(400).json({ message: 'กรุณากรอกชื่ออาคาร' })
  const [result]: any = await pool.execute(
    'INSERT INTO location (building, floor, room, department_id) VALUES (?, ?, ?, ?)',
    [building, floor || null, room || null, department_id || null]
  )
  res.status(201).json({ message: 'เพิ่มสถานที่สำเร็จ', location_id: result.insertId })
})

// Admin — แก้ไขสถานที่
router.put('/:id', protect, async (req: AuthRequest, res) => {
  if (req.user!.role !== 'admin') return res.status(403).json({ message: 'ไม่มีสิทธิ์' })
  const { building, floor, room, department_id } = req.body
  await pool.execute(
    'UPDATE location SET building = ?, floor = ?, room = ?, department_id = ? WHERE location_id = ?',
    [building, floor || null, room || null, department_id || null, req.params.id]
  )
  res.json({ message: 'แก้ไขสถานที่สำเร็จ' })
})

// Admin — ลบสถานที่
router.delete('/:id', protect, async (req: AuthRequest, res) => {
  if (req.user!.role !== 'admin') return res.status(403).json({ message: 'ไม่มีสิทธิ์' })
  await pool.execute('DELETE FROM location WHERE location_id = ?', [req.params.id])
  res.json({ message: 'ลบสถานที่สำเร็จ' })
})

export default router