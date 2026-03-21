import { Response } from 'express'
import pool from '../db'
import { AuthRequest } from '../middleware/authMiddleware'

export const getComplaints = async (req: AuthRequest, res: Response) => {
  const [rows] = await pool.execute(`
    SELECT i.*, u.firstname, u.lastname, u.email,
           c.category_name, l.building, l.floor, l.room
    FROM issue_report i
    JOIN app_user u ON i.user_id = u.user_id
    JOIN category c ON i.category_id = c.category_id
    JOIN location l ON i.location_id = l.location_id
    ORDER BY i.created_at DESC
  `)
  res.json(rows)
}

export const getMyComplaints = async (req: AuthRequest, res: Response) => {
  const [rows] = await pool.execute(`
    SELECT i.*, c.category_name, l.building, l.floor, l.room
    FROM issue_report i
    JOIN category c ON i.category_id = c.category_id
    JOIN location l ON i.location_id = l.location_id
    WHERE i.user_id = ?
    ORDER BY i.created_at DESC
  `, [req.user!.id])
  res.json(rows)
}

export const createComplaint = async (req: AuthRequest, res: Response) => {
  const { title, description, category_id, location_id, priority } = req.body
  await pool.execute(
    `INSERT INTO issue_report (user_id, title, description, category_id, location_id, priority, status)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [req.user!.id, title, description, category_id, location_id, priority || 'medium', 'pending']
  )
  res.status(201).json({ message: 'Issue reported successfully' })
}

export const updateStatus = async (req: AuthRequest, res: Response) => {
  const { id } = req.params
  const { status } = req.body
  await pool.execute(
    'UPDATE issue_report SET status = ? WHERE issue_id = ?',
    [status, id]
  )
  res.json({ message: 'Status updated' })
}