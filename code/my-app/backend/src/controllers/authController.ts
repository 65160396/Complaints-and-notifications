import { Request, Response } from 'express'
import pool from '../db'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

export const register = async (req: Request, res: Response) => {
  const { student_id, employee_code, firstname, lastname, email, password, role, phone } = req.body
  const hashed = await bcrypt.hash(password, 10)
  await pool.execute(
    `INSERT INTO app_user (student_id, employee_code, firstname, lastname, email, password, role, phone)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [student_id || null, employee_code || null, firstname, lastname, email, hashed, role || 'student', phone || null]
  )
  res.status(201).json({ message: 'Registered successfully' })
}

export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body
  const [rows]: any = await pool.execute('SELECT * FROM app_user WHERE email = ?', [email])
  const user = rows[0]
  if (!user || !(await bcrypt.compare(password, user.password)))
    return res.status(401).json({ message: 'Invalid credentials' })

  const token = jwt.sign(
    { id: user.user_id, email: user.email, role: user.role },
    process.env.JWT_SECRET!,
    { expiresIn: '1d' }
  )
  res.json({
    token,
    user: {
      id: user.user_id,
      firstname: user.firstname,
      lastname: user.lastname,
      email: user.email,
      role: user.role
    }
  })
}