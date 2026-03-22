import { Response } from 'express'
import pool from '../db'
import bcrypt from 'bcryptjs'
import { AuthRequest } from '../middleware/authMiddleware'

// ดึงโปรไฟล์ตัวเอง
export const getProfile = async (req: AuthRequest, res: Response) => {
  const [rows]: any = await pool.execute(
    `SELECT user_id, student_id, employee_code, firstname, lastname, email, role, phone
     FROM app_user WHERE user_id = ?`,
    [req.user!.id]
  )
  if (!rows[0]) return res.status(404).json({ message: 'ไม่พบผู้ใช้' })
  res.json(rows[0])
}

// แก้ไขโปรไฟล์ (ชื่อ, นามสกุล, เบอร์โทร)
export const updateProfile = async (req: AuthRequest, res: Response) => {
  const { firstname, lastname, phone } = req.body

  if (!firstname || !lastname) {
    return res.status(400).json({ message: 'กรุณากรอกชื่อและนามสกุล' })
  }

  await pool.execute(
    `UPDATE app_user SET firstname = ?, lastname = ?, phone = ? WHERE user_id = ?`,
    [firstname, lastname, phone || null, req.user!.id]
  )

  // คืนข้อมูลใหม่กลับไปให้ frontend อัปเดต localStorage
  const [rows]: any = await pool.execute(
    `SELECT user_id, student_id, employee_code, firstname, lastname, email, role, phone
     FROM app_user WHERE user_id = ?`,
    [req.user!.id]
  )

  res.json({ message: 'อัปเดตโปรไฟล์เรียบร้อยแล้ว', user: rows[0] })
}

// เปลี่ยนรหัสผ่าน
export const changePassword = async (req: AuthRequest, res: Response) => {
  const { currentPassword, newPassword } = req.body

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ message: 'กรุณากรอกข้อมูลให้ครบ' })
  }
  if (newPassword.length < 8) {
    return res.status(400).json({ message: 'รหัสผ่านใหม่ต้องมีอย่างน้อย 8 ตัวอักษร' })
  }

  const [rows]: any = await pool.execute(
    'SELECT password FROM app_user WHERE user_id = ?',
    [req.user!.id]
  )

  const isMatch = await bcrypt.compare(currentPassword, rows[0].password)
  if (!isMatch) {
    return res.status(400).json({ message: 'รหัสผ่านปัจจุบันไม่ถูกต้อง' })
  }

  const hashed = await bcrypt.hash(newPassword, 10)
  await pool.execute(
    'UPDATE app_user SET password = ? WHERE user_id = ?',
    [hashed, req.user!.id]
  )

  res.json({ message: 'เปลี่ยนรหัสผ่านเรียบร้อยแล้ว' })
}