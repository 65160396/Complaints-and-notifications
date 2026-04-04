// tests/integration/api.integration.test.ts
// ครอบคลุม: TC-001, TC-002, TC-004, TC-006, TC-010, TC-013, TC-046, TC-064

import request from 'supertest'
import express from 'express'
import cors from 'cors'
import jwt from 'jsonwebtoken'

jest.mock('../../db', () => ({
  execute: jest.fn(),
  query: jest.fn(),
  getConnection: jest.fn().mockResolvedValue(true),
}))
jest.mock('bcryptjs')
jest.mock('../../controllers/notificationController', () => ({
  createNotification: jest.fn().mockResolvedValue(undefined),
}))

import pool from '../../db'
import bcrypt from 'bcryptjs'
import authRoutes from '../../routes/auth'
import complaintRoutes from '../../routes/complaints'
import categoryRoutes from '../../routes/categories'

const app = express()
app.use(cors())
app.use(express.json())
app.use('/api/auth', authRoutes)
app.use('/api/complaints', complaintRoutes)
app.use('/api/categories', categoryRoutes)

const makeToken = (role = 'student', id = 1) =>
  jwt.sign({ id, email: `${role}@buu.ac.th`, role }, process.env.JWT_SECRET!)

describe('IT: POST /api/auth/login', () => {
  beforeEach(() => jest.clearAllMocks())

  // TC-001: login สำเร็จ → 200 + token
  test('TC-001: login ถูกต้อง → 200 + token', async () => {
    const fakeUser = { user_id: 1, firstname: 'สมชาย', lastname: 'ใจดี', email: 'student@buu.ac.th', password: 'hashed', role: 'student' }
    ;(pool.execute as jest.Mock).mockResolvedValueOnce([[fakeUser]])
    ;(bcrypt.compare as jest.Mock).mockResolvedValueOnce(true)

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'student@buu.ac.th', password: 'correctpass' })

    expect(res.status).toBe(200)
    expect(res.body).toHaveProperty('token')
    expect(res.body.user.role).toBe('student')
  })

  // TC-002: password ผิด → 401
  test('TC-002: password ผิด → 401', async () => {
    const fakeUser = { user_id: 1, email: 'student@buu.ac.th', password: 'hashed', role: 'student' }
    ;(pool.execute as jest.Mock).mockResolvedValueOnce([[fakeUser]])
    ;(bcrypt.compare as jest.Mock).mockResolvedValueOnce(false)

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'student@buu.ac.th', password: 'wrongpass' })

    expect(res.status).toBe(401)
    expect(res.body.message).toBe('Invalid credentials')
  })

  // TC-004: email ไม่มีในระบบ → 401
  test('TC-004: email ไม่มีในระบบ → 401', async () => {
    ;(pool.execute as jest.Mock).mockResolvedValueOnce([[]])

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'notfound@buu.ac.th', password: 'somepass' })

    expect(res.status).toBe(401)
  })

  // TC-064: Admin login → role = admin
  test('TC-064: Admin login → role = admin ใน response', async () => {
    const fakeAdmin = { user_id: 99, firstname: 'แอดมิน', lastname: 'ระบบ', email: 'admin@buu.ac.th', password: 'hashed', role: 'admin' }
    ;(pool.execute as jest.Mock).mockResolvedValueOnce([[fakeAdmin]])
    ;(bcrypt.compare as jest.Mock).mockResolvedValueOnce(true)

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@buu.ac.th', password: 'adminpass' })

    expect(res.status).toBe(200)
    expect(res.body.user.role).toBe('admin')
  })
})

describe('IT: GET /api/categories', () => {
  beforeEach(() => jest.clearAllMocks())

  // ไม่มี token → 401
  test('ไม่มี token → 401', async () => {
    const res = await request(app).get('/api/categories')
    expect(res.status).toBe(401)
  })

  // มี token → 200 + array
  test('มี token → 200 + categories array', async () => {
    ;(pool.execute as jest.Mock).mockResolvedValueOnce([[
      { category_id: 1, category_name: 'ซ่อมแซม' },
      { category_id: 2, category_name: 'ทำความสะอาด' },
    ]])

    const res = await request(app)
      .get('/api/categories')
      .set('Authorization', `Bearer ${makeToken()}`)

    expect(res.status).toBe(200)
    expect(Array.isArray(res.body)).toBe(true)
    expect(res.body.length).toBe(2)
  })
})

describe('IT: GET /api/complaints/my', () => {
  beforeEach(() => jest.clearAllMocks())

  // TC-010: ดึง complaints ของตัวเอง → 200
  test('TC-010: ดึง complaints ของตัวเอง → 200 + array', async () => {
    ;(pool.execute as jest.Mock).mockResolvedValueOnce([[
      { complaint_id: 1, title: 'ไฟดับ', status: 'pending' },
    ]])

    const res = await request(app)
      .get('/api/complaints/my')
      .set('Authorization', `Bearer ${makeToken()}`)

    expect(res.status).toBe(200)
    expect(Array.isArray(res.body)).toBe(true)
  })

  // ไม่มี token → 401
  test('ไม่มี token → 401', async () => {
    const res = await request(app).get('/api/complaints/my')
    expect(res.status).toBe(401)
  })
})

describe('IT: PATCH /api/complaints/:id/priority', () => {
  beforeEach(() => jest.clearAllMocks())

  // TC-046: Samo ปรับ priority → 200
  test('TC-046: Samo ปรับ priority → 200', async () => {
    ;(pool.execute as jest.Mock).mockResolvedValueOnce([{ affectedRows: 1 }])

    const res = await request(app)
      .patch('/api/complaints/1/priority')
      .set('Authorization', `Bearer ${makeToken('samo', 10)}`)
      .send({ priority: 'high' })

    expect(res.status).toBe(200)
    expect(res.body.message).toBe('Priority updated')
  })

  // Student ปรับ priority → 403
  test('Student ปรับ priority → 403 ไม่มีสิทธิ์', async () => {
    const res = await request(app)
      .patch('/api/complaints/1/priority')
      .set('Authorization', `Bearer ${makeToken('student', 1)}`)
      .send({ priority: 'high' })

    expect(res.status).toBe(403)
  })
})

describe('IT: PATCH /api/complaints/:id/cancel', () => {
  beforeEach(() => jest.clearAllMocks())

  // TC-013: ยกเลิกคำร้อง pending → 200
  test('TC-013: ยกเลิกคำร้อง pending → 200', async () => {
    ;(pool.execute as jest.Mock)
      .mockResolvedValueOnce([[{ complaint_id: 1, user_id: 1, status: 'pending', title: 'ไฟดับ' }]])
      .mockResolvedValueOnce([{ affectedRows: 1 }])

    const res = await request(app)
      .patch('/api/complaints/1/cancel')
      .set('Authorization', `Bearer ${makeToken('student', 1)}`)

    expect(res.status).toBe(200)
    expect(res.body.message).toBe('ยกเลิกคำร้องเรียบร้อยแล้ว')
  })

  // TC-014: ยกเลิกคำร้อง in_progress → 400
  test('TC-014: ยกเลิกคำร้อง in_progress → 400', async () => {
    ;(pool.execute as jest.Mock)
      .mockResolvedValueOnce([[{ complaint_id: 2, user_id: 1, status: 'in_progress', title: 'น้ำรั่ว' }]])

    const res = await request(app)
      .patch('/api/complaints/2/cancel')
      .set('Authorization', `Bearer ${makeToken('student', 1)}`)

    expect(res.status).toBe(400)
  })
})