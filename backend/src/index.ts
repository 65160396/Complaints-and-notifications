import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import authRoutes from './routes/auth'
import complaintRoutes from './routes/complaints'
import categoryRoutes from './routes/categories'
import locationRoutes from './routes/locations'
import pool from './db'   

dotenv.config()
const app = express()

app.use(cors())
app.use(express.json())

// ดูว่าต่อกับdbได้มั้ย
pool.getConnection()
  .then(() => {
    console.log(' Connected to MySQL')
  })
  .catch((err) => {
    console.error(' MySQL connection failed:', err.message)
  })

app.use('/api/auth', authRoutes)
app.use('/api/complaints', complaintRoutes)
app.use('/api/categories', categoryRoutes)
app.use('/api/locations', locationRoutes)

const PORT = process.env.PORT || 5000
app.listen(PORT, () => console.log(`Server running on :${PORT}`))