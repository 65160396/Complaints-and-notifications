import { Router } from 'express'
import pool from '../db'
import { protect, AuthRequest } from '../middleware/authMiddleware'
import bcrypt from 'bcryptjs'

const router = Router()

// Admin — ดึง Audit Log 
router.get('/audit-logs', protect, async (req: AuthRequest, res) => {
  if (req.user!.role !== 'admin') return res.status(403).json({ message: 'ไม่มีสิทธิ์' })
  const [rows] = await pool.execute(`
    SELECT al.*, u.firstname as admin_firstname, u.lastname as admin_lastname
    FROM audit_log al
    JOIN app_user u ON al.admin_id = u.user_id
    ORDER BY al.created_at DESC
    LIMIT 100
  `)
  res.json(rows)
})

// ดึง staff ทั้งหมด (personnel, samo, officer)
router.get('/staff', protect, async (req, res) => {
  const [rows] = await pool.execute(
    `SELECT user_id, firstname, lastname, role FROM app_user 
     WHERE role IN ('personnel', 'samo', 'officer')
     ORDER BY role, firstname`
  )
  res.json(rows)
})

// Admin — ดึงผู้ใช้ทั้งหมด
router.get('/', protect, async (req: AuthRequest, res) => {
  if (req.user!.role !== 'admin') return res.status(403).json({ message: 'ไม่มีสิทธิ์' })
  const [rows] = await pool.execute(
    `SELECT user_id, firstname, lastname, email, role, phone, is_active
     FROM app_user ORDER BY role, firstname ASC`
  )
  res.json(rows)
})

// Admin — แก้ไข role ผู้ใช้
router.put('/:id/role', protect, async (req: AuthRequest, res) => {
  if (req.user!.role !== 'admin') return res.status(403).json({ message: 'ไม่มีสิทธิ์' })
  const { role, confirm_password } = req.body
  const validRoles = ['student', 'personnel', 'samo', 'officer', 'admin']
  if (!validRoles.includes(role)) return res.status(400).json({ message: 'Role ไม่ถูกต้อง' })

  // เปลี่ยนเป็น admin ต้องยืนยันรหัสผ่านก่อน
  if (role === 'admin') {
    if (!confirm_password) return res.status(400).json({ message: 'กรุณายืนยันรหัสผ่าน' })
    const [rows]: any = await pool.execute('SELECT password FROM app_user WHERE user_id = ?', [req.user!.id])
    const isMatch = await bcrypt.compare(confirm_password, rows[0].password)
    if (!isMatch) return res.status(401).json({ message: 'รหัสผ่านไม่ถูกต้อง' })
  }

  await pool.execute('UPDATE app_user SET role = ? WHERE user_id = ?', [role, req.params.id])
  await pool.execute(
    'INSERT INTO audit_log (admin_id, action, target_user_id, detail) VALUES (?, ?, ?, ?)',
    [req.user!.id, 'CHANGE_ROLE', req.params.id, `เปลี่ยน Role เป็น ${role}`]
  )
  res.json({ message: 'แก้ไข Role สำเร็จ' })
})


// Admin — ปิด/เปิดใช้งานบัญชี
router.put('/:id/toggle', protect, async (req: AuthRequest, res) => {
  if (req.user!.role !== 'admin') return res.status(403).json({ message: 'ไม่มีสิทธิ์' })
  const [rows]: any = await pool.execute('SELECT is_active FROM app_user WHERE user_id = ?', [req.params.id])
  if (!rows[0]) return res.status(404).json({ message: 'ไม่พบผู้ใช้' })
  const newStatus = rows[0].is_active ? 0 : 1
  await pool.execute('UPDATE app_user SET is_active = ? WHERE user_id = ?', [newStatus, req.params.id])

  // บันทึก Audit Log
  await pool.execute(
    'INSERT INTO audit_log (admin_id, action, target_user_id, detail) VALUES (?, ?, ?, ?)',
    [req.user!.id, newStatus ? 'ENABLE_USER' : 'DISABLE_USER', req.params.id, newStatus ? 'เปิดใช้งานบัญชี' : 'ปิดใช้งานบัญชี']
  )
  res.json({ message: newStatus ? 'เปิดใช้งานสำเร็จ' : 'ปิดใช้งานสำเร็จ', is_active: newStatus })
})

// Admin — ดึง System Log
router.get('/system-logs', protect, async (req: AuthRequest, res) => {
  if (req.user!.role !== 'admin') return res.status(403).json({ message: 'ไม่มีสิทธิ์' })
  const [rows] = await pool.execute(`
    SELECT sl.*, u.firstname, u.lastname
    FROM system_log sl
    LEFT JOIN app_user u ON sl.user_id = u.user_id
    ORDER BY sl.created_at DESC
    LIMIT 100
  `)
  res.json(rows)
})

// Admin — ดึงจำนวน user online (active ใน 30 นาที)
router.get('/online-count', protect, async (req: AuthRequest, res) => {
  if (req.user!.role !== 'admin') return res.status(403).json({ message: 'ไม่มีสิทธิ์' })
  const [rows]: any = await pool.execute(
    'SELECT COUNT(*) as count FROM app_user WHERE last_active > DATE_SUB(NOW(), INTERVAL 30 MINUTE)'
  )
  res.json({ count: rows[0].count })
})

export default router