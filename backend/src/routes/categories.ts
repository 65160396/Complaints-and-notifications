import { Router } from 'express'
import pool from '../db'
import { protect } from '../middleware/authMiddleware'

const router = Router()

router.get('/', protect, async (req, res) => {
  const [rows] = await pool.execute('SELECT * FROM category')
  res.json(rows)
})

export default router