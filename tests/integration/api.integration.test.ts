// tests/integration/api.integration.test.ts
// ครอบคลุม: TC-001, TC-002, TC-004, TC-006, TC-010, TC-013, TC-046, TC-064

// เก็บ reference ของ mock functions ไว้ก่อน
const mockExecute = jest.fn()
const mockCompare = jest.fn()
const mockHash    = jest.fn()

jest.mock('../../db', () => ({
  __esModule: true,
  default: { execute: mockExecute },
}))
jest.mock('bcryptjs', () => ({
  compare: mockCompare,
  hash:    mockHash,
}))
jest.mock('../../controllers/notificationController', () => ({
  createNotification: jest.fn().mockResolvedValue(undefined),
}))
jest.mock('../../middleware/uploadMiddleware', () => ({
  __esModule: true,
  default: { array: () => (_req: any, _res: any, next: any) => next() },
}))

import request from 'supertest'
import express from 'express'
import cors    from 'cors'
import jwt     from 'jsonwebtoken'

import authRoutes      from '../../routes/auth'
import complaintRoutes from '../../routes/complaints'
import categoryRoutes  from '../../routes/categories'

const app = express()
app.use(cors())
app.use(express.json())
app.use('/api/auth',       authRoutes)
app.use('/api/complaints', complaintRoutes)
app.use('/api/categories', categoryRoutes)

const SECRET    = process.env.JWT_SECRET || 'test-secret'
const makeToken = (role = 'student', id = 1, dept: number | null = null) =>
  jwt.sign({ id, email: `${role}@buu.ac.th`, role, department_id: dept }, SECRET)

// authMiddleware เรียก pool.execute 1 ครั้ง (UPDATE last_active) ก่อน controller
const mockMiddleware = () => mockExecute.mockResolvedValueOnce([{}])

beforeEach(() => {
  mockExecute.mockReset()
  mockCompare.mockReset()
  mockHash.mockReset()
})

// ══════════════════════════════════════════════════════════════════════════════
// POST /api/auth/login
// ══════════════════════════════════════════════════════════════════════════════

describe('IT: POST /api/auth/login', () => {

  test('TC-001: login ถูกต้อง → 200 + token', async () => {
    const fakeUser = {
      user_id: 1, firstname: 'สมชาย', lastname: 'ใจดี',
      email: 'student@buu.ac.th', password: 'hashed',
      role: 'student', department_id: null,
    }
    mockExecute.mockResolvedValueOnce([[fakeUser]])
    mockCompare.mockResolvedValueOnce(true)

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'student@buu.ac.th', password: 'correctpass' })

    expect(res.status).toBe(200)
    expect(res.body).toHaveProperty('token')
    expect(res.body.user.role).toBe('student')
  })

  test('TC-002: password ผิด → 401', async () => {
    const fakeUser = { user_id: 1, email: 'student@buu.ac.th', password: 'hashed', role: 'student' }
    mockExecute
      .mockResolvedValueOnce([[fakeUser]])
      .mockResolvedValueOnce([{}])   // INSERT system_log
    mockCompare.mockResolvedValueOnce(false)

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'student@buu.ac.th', password: 'wrongpass' })

    expect(res.status).toBe(401)
    expect(res.body.message).toBe('Invalid credentials')
  })

  test('TC-004: email ไม่มีในระบบ → 401', async () => {
    mockExecute
      .mockResolvedValueOnce([[]])
      .mockResolvedValueOnce([{}])   // INSERT system_log
    mockCompare.mockResolvedValueOnce(false)

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'notfound@buu.ac.th', password: 'somepass' })

    expect(res.status).toBe(401)
  })

  test('TC-064: Admin login → role = admin ใน response', async () => {
    const fakeAdmin = {
      user_id: 99, firstname: 'แอดมิน', lastname: 'ระบบ',
      email: 'admin@buu.ac.th', password: 'hashed',
      role: 'admin', department_id: null,
    }
    mockExecute.mockResolvedValueOnce([[fakeAdmin]])
    mockCompare.mockResolvedValueOnce(true)

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@buu.ac.th', password: 'adminpass' })

    expect(res.status).toBe(200)
    expect(res.body.user.role).toBe('admin')
  })
})

// ══════════════════════════════════════════════════════════════════════════════
// GET /api/categories
// ══════════════════════════════════════════════════════════════════════════════

describe('IT: GET /api/categories', () => {

  test('ไม่มี token → 401', async () => {
    const res = await request(app).get('/api/categories')
    expect(res.status).toBe(401)
  })

  test('มี token → 200 + categories array', async () => {
    mockMiddleware()
    mockExecute.mockResolvedValueOnce([[
      { category_id: 1, category_name: 'ซ่อมแซม',     for_role: 'all' },
      { category_id: 2, category_name: 'ทำความสะอาด', for_role: 'all' },
    ]])

    const res = await request(app)
      .get('/api/categories')
      .set('Authorization', `Bearer ${makeToken()}`)

    expect(res.status).toBe(200)
    expect(Array.isArray(res.body)).toBe(true)
    expect(res.body.length).toBe(2)
  })
})

// ══════════════════════════════════════════════════════════════════════════════
// GET /api/complaints/my
// ══════════════════════════════════════════════════════════════════════════════

describe('IT: GET /api/complaints/my', () => {

  test('TC-010: ดึง complaints ของตัวเอง → 200 + array', async () => {
    mockMiddleware()
    mockExecute.mockResolvedValueOnce([[
      { issue_id: 1, title: 'ไฟดับ', status: 'pending' },
    ]])

    const res = await request(app)
      .get('/api/complaints/my')
      .set('Authorization', `Bearer ${makeToken()}`)

    expect(res.status).toBe(200)
    expect(Array.isArray(res.body)).toBe(true)
  })

  test('ไม่มี token → 401', async () => {
    const res = await request(app).get('/api/complaints/my')
    expect(res.status).toBe(401)
  })
})

// ══════════════════════════════════════════════════════════════════════════════
// PATCH /api/complaints/:id/priority
// ══════════════════════════════════════════════════════════════════════════════

describe('IT: PATCH /api/complaints/:id/priority', () => {

  test('TC-046: Samo ปรับ priority → 200', async () => {
    mockMiddleware()
    mockExecute.mockResolvedValueOnce([{ affectedRows: 1 }])

    const res = await request(app)
      .patch('/api/complaints/1/priority')
      .set('Authorization', `Bearer ${makeToken('samo', 10, 1)}`)
      .send({ priority: 'high' })

    expect(res.status).toBe(200)
    expect(res.body.message).toBe('Priority updated')
  })

  test('Student ปรับ priority → 403 ไม่มีสิทธิ์', async () => {
    mockMiddleware()

    const res = await request(app)
      .patch('/api/complaints/1/priority')
      .set('Authorization', `Bearer ${makeToken('student', 1)}`)
      .send({ priority: 'high' })

    expect(res.status).toBe(403)
  })
})

// ══════════════════════════════════════════════════════════════════════════════
// PATCH /api/complaints/:id/cancel
// ══════════════════════════════════════════════════════════════════════════════

describe('IT: PATCH /api/complaints/:id/cancel', () => {

  test('TC-013: ยกเลิกคำร้อง pending → 200', async () => {
    mockMiddleware()
    mockExecute
      .mockResolvedValueOnce([[{ issue_id: 1, user_id: 1, status: 'pending', title: 'ไฟดับ' }]])
      .mockResolvedValueOnce([{ affectedRows: 1 }])

    const res = await request(app)
      .patch('/api/complaints/1/cancel')
      .set('Authorization', `Bearer ${makeToken('student', 1)}`)

    expect(res.status).toBe(200)
    expect(res.body.message).toBe('ยกเลิกคำร้องเรียบร้อยแล้ว')
  })

  test('TC-014: ยกเลิกคำร้อง in_progress → 400', async () => {
    mockMiddleware()
    mockExecute.mockResolvedValueOnce([[{ issue_id: 2, user_id: 1, status: 'in_progress', title: 'น้ำรั่ว' }]])

    const res = await request(app)
      .patch('/api/complaints/2/cancel')
      .set('Authorization', `Bearer ${makeToken('student', 1)}`)

    expect(res.status).toBe(400)
  })
})