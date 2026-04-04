// tests/unit/profile.test.ts
// ครอบคลุม: TC-005, TC-024, TC-038, TC-054, TC-069

jest.mock('../../db', () => ({ execute: jest.fn() }))
jest.mock('bcryptjs')

import pool from '../../db'
import bcrypt from 'bcryptjs'
import {
  getProfile,
  updateProfile,
  changePassword,
} from '../../controllers/profileController'

const mockReq = (overrides = {}) => ({
  user: { id: 1, email: 'student@buu.ac.th', role: 'student' },
  body: {},
  ...overrides,
} as any)

const mockRes = () => {
  const res: any = {}
  res.status = jest.fn().mockReturnValue(res)
  res.json = jest.fn().mockReturnValue(res)
  return res
}

// ─── getProfile ───────────────────────────────────────────────────────────────

describe('getProfile', () => {
  beforeEach(() => jest.clearAllMocks())

  // TC-005: ดึงโปรไฟล์ตัวเอง → return user data
  test('TC-005: ดึงโปรไฟล์สำเร็จ → return user data', async () => {
    const fakeUser = { user_id: 1, firstname: 'สมชาย', lastname: 'ใจดี', email: 'student@buu.ac.th', role: 'student', phone: '0812345678' }
    ;(pool.execute as jest.Mock).mockResolvedValueOnce([[fakeUser]])

    const req = mockReq()
    const res = mockRes()
    await getProfile(req, res)

    expect(res.json).toHaveBeenCalledWith(fakeUser)
  })

  // ไม่พบ user → 404
  test('ไม่พบ user → 404', async () => {
    ;(pool.execute as jest.Mock).mockResolvedValueOnce([[]])

    const req = mockReq()
    const res = mockRes()
    await getProfile(req, res)

    expect(res.status).toHaveBeenCalledWith(404)
    expect(res.json).toHaveBeenCalledWith({ message: 'ไม่พบผู้ใช้' })
  })
})

// ─── updateProfile ────────────────────────────────────────────────────────────

describe('updateProfile', () => {
  beforeEach(() => jest.clearAllMocks())

  // TC-005/TC-024/TC-069: แก้ไขโปรไฟล์สำเร็จ
  test('TC-005: แก้ไขโปรไฟล์สำเร็จ → return user ใหม่', async () => {
    const updatedUser = { user_id: 1, firstname: 'สมชาย', lastname: 'ใจดีมาก', phone: '0899999999' }
    ;(pool.execute as jest.Mock)
      .mockResolvedValueOnce([{ affectedRows: 1 }])  // UPDATE
      .mockResolvedValueOnce([[updatedUser]])          // SELECT ใหม่

    const req = mockReq({ body: { firstname: 'สมชาย', lastname: 'ใจดีมาก', phone: '0899999999' } })
    const res = mockRes()
    await updateProfile(req, res)

    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      message: 'อัปเดตโปรไฟล์เรียบร้อยแล้ว',
      user: updatedUser,
    }))
  })

  // ไม่กรอก firstname → 400
  test('ไม่กรอก firstname → 400', async () => {
    const req = mockReq({ body: { firstname: '', lastname: 'ใจดี' } })
    const res = mockRes()
    await updateProfile(req, res)

    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith({ message: 'กรุณากรอกชื่อและนามสกุล' })
  })

  // ไม่กรอก lastname → 400
  test('ไม่กรอก lastname → 400', async () => {
    const req = mockReq({ body: { firstname: 'สมชาย', lastname: '' } })
    const res = mockRes()
    await updateProfile(req, res)

    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith({ message: 'กรุณากรอกชื่อและนามสกุล' })
  })

  // TC-069: Admin แก้ไขโปรไฟล์ตัวเอง → สำเร็จ
  test('TC-069: Admin แก้ไขโปรไฟล์ → สำเร็จ', async () => {
    const updatedAdmin = { user_id: 99, firstname: 'แอดมิน', lastname: 'ใหม่', phone: '0800000001' }
    ;(pool.execute as jest.Mock)
      .mockResolvedValueOnce([{ affectedRows: 1 }])
      .mockResolvedValueOnce([[updatedAdmin]])

    const req = mockReq({
      user: { id: 99, role: 'admin' },
      body: { firstname: 'แอดมิน', lastname: 'ใหม่', phone: '0800000001' }
    })
    const res = mockRes()
    await updateProfile(req, res)

    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: 'อัปเดตโปรไฟล์เรียบร้อยแล้ว' }))
  })
})

// ─── changePassword ───────────────────────────────────────────────────────────

describe('changePassword', () => {
  beforeEach(() => jest.clearAllMocks())

  // เปลี่ยนรหัสผ่านสำเร็จ
  test('เปลี่ยนรหัสผ่านสำเร็จ → 200', async () => {
    ;(pool.execute as jest.Mock)
      .mockResolvedValueOnce([[{ password: 'hashed_old' }]])  // SELECT
      .mockResolvedValueOnce([{ affectedRows: 1 }])            // UPDATE
    ;(bcrypt.compare as jest.Mock).mockResolvedValueOnce(true)
    ;(bcrypt.hash as jest.Mock).mockResolvedValueOnce('hashed_new')

    const req = mockReq({ body: { currentPassword: 'oldpass123', newPassword: 'newpass123' } })
    const res = mockRes()
    await changePassword(req, res)

    expect(res.json).toHaveBeenCalledWith({ message: 'เปลี่ยนรหัสผ่านเรียบร้อยแล้ว' })
  })

  // รหัสผ่านปัจจุบันผิด → 400
  test('รหัสผ่านปัจจุบันผิด → 400', async () => {
    ;(pool.execute as jest.Mock).mockResolvedValueOnce([[{ password: 'hashed_old' }]])
    ;(bcrypt.compare as jest.Mock).mockResolvedValueOnce(false)

    const req = mockReq({ body: { currentPassword: 'wrongpass', newPassword: 'newpass123' } })
    const res = mockRes()
    await changePassword(req, res)

    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith({ message: 'รหัสผ่านปัจจุบันไม่ถูกต้อง' })
  })

  // รหัสผ่านใหม่น้อยกว่า 8 ตัว → 400
  test('รหัสผ่านใหม่น้อยกว่า 8 ตัว → 400', async () => {
    const req = mockReq({ body: { currentPassword: 'oldpass123', newPassword: '1234567' } })
    const res = mockRes()
    await changePassword(req, res)

    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith({ message: 'รหัสผ่านใหม่ต้องมีอย่างน้อย 8 ตัวอักษร' })
  })

  // ไม่กรอกข้อมูล → 400
  test('ไม่กรอก currentPassword หรือ newPassword → 400', async () => {
    const req = mockReq({ body: { currentPassword: '', newPassword: '' } })
    const res = mockRes()
    await changePassword(req, res)

    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith({ message: 'กรุณากรอกข้อมูลให้ครบ' })
  })
})