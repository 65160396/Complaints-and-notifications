// tests/unit/auth.test.ts
// ครอบคลุม: TC-001, TC-002, TC-004, TC-023, TC-037, TC-053, TC-064, TC-065

jest.mock('../../db', () => ({ execute: jest.fn() }))
jest.mock('bcryptjs')
jest.mock('jsonwebtoken')

import pool from '../../db'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { register, login } from '../../controllers/authController'

const mockReq = (body = {}) => ({ body } as any)
const mockRes = () => {
  const res: any = {}
  res.status = jest.fn().mockReturnValue(res)
  res.json = jest.fn().mockReturnValue(res)
  return res
}

describe('Auth - login', () => {
  beforeEach(() => jest.clearAllMocks())

  // TC-001: เข้าสู่ระบบด้วยข้อมูลถูกต้อง (Student)
  test('TC-001: login สำเร็จด้วย email/password ถูกต้อง → 200 + token', async () => {
    const fakeUser = {
      user_id: 1, firstname: 'สมชาย', lastname: 'ใจดี',
      email: 'student@buu.ac.th', password: 'hashed', role: 'student'
    }
    ;(pool.execute as jest.Mock).mockResolvedValueOnce([[fakeUser]])
    ;(bcrypt.compare as jest.Mock).mockResolvedValueOnce(true)
    ;(jwt.sign as jest.Mock).mockReturnValue('fake_token')

    const req = mockReq({ email: 'student@buu.ac.th', password: 'correctpass' })
    const res = mockRes()
    await login(req, res)

    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ token: 'fake_token' }))
  })

  // TC-002: เข้าสู่ระบบด้วยรหัสผ่านผิด → 401
  test('TC-002: login ด้วย password ผิด → 401 Invalid credentials', async () => {
    const fakeUser = {
      user_id: 1, email: 'student@buu.ac.th', password: 'hashed', role: 'student'
    }
    ;(pool.execute as jest.Mock).mockResolvedValueOnce([[fakeUser]])
    ;(bcrypt.compare as jest.Mock).mockResolvedValueOnce(false)

    const req = mockReq({ email: 'student@buu.ac.th', password: 'wrongpass' })
    const res = mockRes()
    await login(req, res)

    expect(res.status).toHaveBeenCalledWith(401)
    expect(res.json).toHaveBeenCalledWith({ message: 'Invalid credentials' })
  })

  // TC-004: เข้าสู่ระบบด้วยบัญชีที่ไม่มีในระบบ → 401
  test('TC-004: email ไม่มีในระบบ → 401 Invalid credentials', async () => {
    ;(pool.execute as jest.Mock).mockResolvedValueOnce([[]])

    const req = mockReq({ email: 'notfound@buu.ac.th', password: 'somepass' })
    const res = mockRes()
    await login(req, res)

    expect(res.status).toHaveBeenCalledWith(401)
    expect(res.json).toHaveBeenCalledWith({ message: 'Invalid credentials' })
  })

  // TC-023: Personnel เข้าสู่ระบบสำเร็จ → role = personnel
  test('TC-023: Personnel login สำเร็จ → token มี role = personnel', async () => {
    const fakePersonnel = {
      user_id: 5, firstname: 'สมหมาย', lastname: 'รักงาน',
      email: 'personnel@buu.ac.th', password: 'hashed', role: 'personnel'
    }
    ;(pool.execute as jest.Mock).mockResolvedValueOnce([[fakePersonnel]])
    ;(bcrypt.compare as jest.Mock).mockResolvedValueOnce(true)
    ;(jwt.sign as jest.Mock).mockReturnValue('personnel_token')

    const req = mockReq({ email: 'personnel@buu.ac.th', password: 'correctpass' })
    const res = mockRes()
    await login(req, res)

    expect(jwt.sign).toHaveBeenCalledWith(
      expect.objectContaining({ role: 'personnel' }),
      expect.anything(), expect.anything()
    )
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ token: 'personnel_token' }))
  })

  // TC-037: Samo login สำเร็จ → role = samo
  test('TC-037: Samo login สำเร็จ → token มี role = samo', async () => {
    const fakeSamo = {
      user_id: 10, firstname: 'สโมสร', lastname: 'คณะวิทย์',
      email: 'samo@buu.ac.th', password: 'hashed', role: 'samo'
    }
    ;(pool.execute as jest.Mock).mockResolvedValueOnce([[fakeSamo]])
    ;(bcrypt.compare as jest.Mock).mockResolvedValueOnce(true)
    ;(jwt.sign as jest.Mock).mockReturnValue('samo_token')

    const req = mockReq({ email: 'samo@buu.ac.th', password: 'samopass' })
    const res = mockRes()
    await login(req, res)

    expect(jwt.sign).toHaveBeenCalledWith(
      expect.objectContaining({ role: 'samo' }),
      expect.anything(), expect.anything()
    )
  })

  // TC-053: University Officer login สำเร็จ → role = officer
  test('TC-053: Officer login สำเร็จ → token มี role = officer', async () => {
    const fakeOfficer = {
      user_id: 20, firstname: 'เจ้าหน้าที่', lastname: 'มหาวิทยาลัย',
      email: 'officer@buu.ac.th', password: 'hashed', role: 'officer'
    }
    ;(pool.execute as jest.Mock).mockResolvedValueOnce([[fakeOfficer]])
    ;(bcrypt.compare as jest.Mock).mockResolvedValueOnce(true)
    ;(jwt.sign as jest.Mock).mockReturnValue('officer_token')

    const req = mockReq({ email: 'officer@buu.ac.th', password: 'officerpass' })
    const res = mockRes()
    await login(req, res)

    expect(jwt.sign).toHaveBeenCalledWith(
      expect.objectContaining({ role: 'officer' }),
      expect.anything(), expect.anything()
    )
  })

  // TC-064: Admin login สำเร็จ → role = admin
  test('TC-064: Admin login สำเร็จ → token มี role = admin', async () => {
    const fakeAdmin = {
      user_id: 99, firstname: 'แอดมิน', lastname: 'ระบบ',
      email: 'admin@buu.ac.th', password: 'hashed', role: 'admin'
    }
    ;(pool.execute as jest.Mock).mockResolvedValueOnce([[fakeAdmin]])
    ;(bcrypt.compare as jest.Mock).mockResolvedValueOnce(true)
    ;(jwt.sign as jest.Mock).mockReturnValue('admin_token')

    const req = mockReq({ email: 'admin@buu.ac.th', password: 'adminpass' })
    const res = mockRes()
    await login(req, res)

    expect(jwt.sign).toHaveBeenCalledWith(
      expect.objectContaining({ role: 'admin' }),
      expect.anything(), expect.anything()
    )
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ token: 'admin_token' }))
  })
})

describe('Auth - register', () => {
  beforeEach(() => jest.clearAllMocks())

  // TC-065: Admin เพิ่มผู้ใช้ใหม่ → 201
  test('TC-065: register ผู้ใช้ใหม่สำเร็จ → 201 Registered successfully', async () => {
    ;(bcrypt.hash as jest.Mock).mockResolvedValueOnce('hashed_pw')
    ;(pool.execute as jest.Mock).mockResolvedValueOnce([{ insertId: 10 }])

    const req = mockReq({
      firstname: 'ทดสอบ', lastname: 'ระบบ',
      email: 'newuser@buu.ac.th', password: '123456', role: 'student'
    })
    const res = mockRes()
    await register(req, res)

    expect(res.status).toHaveBeenCalledWith(201)
    expect(res.json).toHaveBeenCalledWith({ message: 'Registered successfully' })
  })
})