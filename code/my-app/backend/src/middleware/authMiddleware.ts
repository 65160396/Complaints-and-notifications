import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import pool from '../db'  

export interface AuthRequest extends Request {
  user?: { id: number; email: string; role: string; department_id?: number }
}

export const protect = (req: AuthRequest, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.split(' ')[1]
  if (!token) return res.status(401).json({ message: 'No token' })

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { id: number; email: string; role: string; department_id?: number }
    req.user = decoded

    // ✅ อัปเดต last_active
    pool.execute('UPDATE app_user SET last_active = NOW() WHERE user_id = ?', [decoded.id])

    next()
  } catch {
    res.status(401).json({ message: 'Invalid token' })
  }
}