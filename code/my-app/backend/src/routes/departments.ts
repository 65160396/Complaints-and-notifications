import { Router } from 'express'
import pool from '../db'
import { protect, AuthRequest } from '../middleware/authMiddleware'

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

// Admin — เพิ่มคณะ
router.post('/', protect, async (req: AuthRequest, res) => {
  if (req.user!.role !== 'admin') return res.status(403).json({ message: 'ไม่มีสิทธิ์' })
  const { department_name } = req.body
  if (!department_name) return res.status(400).json({ message: 'กรุณากรอกชื่อคณะ' })
  const [result]: any = await pool.execute(
    'INSERT INTO department (department_name) VALUES (?)',
    [department_name]
  )
  res.status(201).json({ message: 'เพิ่มคณะสำเร็จ', department_id: result.insertId })
})

// Admin — แก้ไขคณะ
router.put('/:id', protect, async (req: AuthRequest, res) => {
  if (req.user!.role !== 'admin') return res.status(403).json({ message: 'ไม่มีสิทธิ์' })
  const { department_name } = req.body
  await pool.execute(
    'UPDATE department SET department_name = ? WHERE department_id = ?',
    [department_name, req.params.id]
  )
  res.json({ message: 'แก้ไขคณะสำเร็จ' })
})

// Admin — ลบคณะ
router.delete('/:id', protect, async (req: AuthRequest, res) => {
  if (req.user!.role !== 'admin') return res.status(403).json({ message: 'ไม่มีสิทธิ์' })
  await pool.execute('DELETE FROM department WHERE department_id = ?', [req.params.id])
  res.json({ message: 'ลบคณะสำเร็จ' })
})

export default router