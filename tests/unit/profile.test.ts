// tests/unit/profile.test.ts
// ครอบคลุม: TC-005, TC-024, TC-038, TC-054, TC-066, TC-069

import { getProfile, updateProfile, changePassword } from '../../controllers/profileController'
import pool from '../../db'
import bcrypt from 'bcryptjs'

jest.mock('../../db')
jest.mock('bcryptjs')

const mockRes = () => {
  const res: any = {}
  res.status = jest.fn().mockReturnValue(res)
  res.json   = jest.fn().mockReturnValue(res)
  return res
}
const makeReq = (overrides: any) => ({
  body: {}, params: {}, user: { id: 1, role: 'student', department_id: null },
  ...overrides,
} as any)

beforeEach(() => jest.clearAllMocks())

// ══════════════════════════════════════════════════════════════════════════════
// getProfile
// ══════════════════════════════════════════════════════════════════════════════

describe('getProfile', () => {
  it('should return user profile data', async () => {
    const fakeUser = { user_id: 1, firstname: 'สมชาย', lastname: 'ใจดี', email: 'test@email.com', role: 'student' }
    ;(pool.execute as jest.Mock).mockResolvedValueOnce([[fakeUser]])

    const res = mockRes()
    await getProfile(makeReq({ user: { id: 1 } }), res)

    expect(res.json).toHaveBeenCalledWith(fakeUser)
  })

  it('should return 404 when user not found', async () => {
    ;(pool.execute as jest.Mock).mockResolvedValueOnce([[]])

    const res = mockRes()
    await getProfile(makeReq({ user: { id: 999 } }), res)

    expect(res.status).toHaveBeenCalledWith(404)
  })
})

// ══════════════════════════════════════════════════════════════════════════════
// updateProfile
// ══════════════════════════════════════════════════════════════════════════════

describe('updateProfile', () => {

  // ─── TC-005: Student แก้ไขโปรไฟล์ ──────────────────────────────────────

  describe('TC-005: Student แก้ไขข้อมูลโปรไฟล์ (เบอร์โทร)', () => {
    it('should update profile and return updated user data', async () => {
      const updatedUser = { user_id: 1, firstname: 'สมชาย', lastname: 'ใจดี', phone: '0899999999' }
      ;(pool.execute as jest.Mock)
        .mockResolvedValueOnce([{}])             // UPDATE
        .mockResolvedValueOnce([[updatedUser]])  // SELECT ใหม่

      const res = mockRes()
      await updateProfile(makeReq({
        body: { firstname: 'สมชาย', lastname: 'ใจดี', phone: '0899999999' },
        user: { id: 1 },
      }), res)

      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        message: 'อัปเดตโปรไฟล์เรียบร้อยแล้ว',
        user: updatedUser,
      }))
    })
  })

  // ─── TC-024: Personnel แก้ไขโปรไฟล์ ─────────────────────────────────────

  describe('TC-024: Personnel แก้ไขข้อมูลโปรไฟล์', () => {
    it('should update personnel profile successfully', async () => {
      const updatedUser = { user_id: 10, firstname: 'บุคลากร', lastname: 'ใหม่', phone: '0811111111' }
      ;(pool.execute as jest.Mock)
        .mockResolvedValueOnce([{}])
        .mockResolvedValueOnce([[updatedUser]])

      const res = mockRes()
      await updateProfile(makeReq({
        body: { firstname: 'บุคลากร', lastname: 'ใหม่', phone: '0811111111' },
        user: { id: 10, role: 'personnel' },
      }), res)

      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: 'อัปเดตโปรไฟล์เรียบร้อยแล้ว' }))
    })
  })

  // ─── TC-038: Samo แก้ไขโปรไฟล์ ──────────────────────────────────────────

  describe('TC-038: Samo แก้ไขข้อมูลโปรไฟล์สโมสร', () => {
    it('should update samo profile successfully', async () => {
      const updatedUser = { user_id: 20, firstname: 'สโมสร', lastname: 'ปรับปรุง', phone: '0822222222' }
      ;(pool.execute as jest.Mock)
        .mockResolvedValueOnce([{}])
        .mockResolvedValueOnce([[updatedUser]])

      const res = mockRes()
      await updateProfile(makeReq({
        body: { firstname: 'สโมสร', lastname: 'ปรับปรุง', phone: '0822222222' },
        user: { id: 20, role: 'samo' },
      }), res)

      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: 'อัปเดตโปรไฟล์เรียบร้อยแล้ว' }))
    })
  })

  // ─── TC-054: Officer แก้ไขโปรไฟล์ ───────────────────────────────────────

  describe('TC-054: University Officer แก้ไขข้อมูลโปรไฟล์', () => {
    it('should update officer profile successfully', async () => {
      const updatedUser = { user_id: 30, firstname: 'เจ้าหน้าที่', lastname: 'อัปเดต', phone: '0833333333' }
      ;(pool.execute as jest.Mock)
        .mockResolvedValueOnce([{}])
        .mockResolvedValueOnce([[updatedUser]])

      const res = mockRes()
      await updateProfile(makeReq({
        body: { firstname: 'เจ้าหน้าที่', lastname: 'อัปเดต', phone: '0833333333' },
        user: { id: 30, role: 'officer' },
      }), res)

      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: 'อัปเดตโปรไฟล์เรียบร้อยแล้ว' }))
    })
  })

  // ─── TC-069: Admin แก้ไขโปรไฟล์ตัวเอง ───────────────────────────────────

  describe('TC-069: Admin แก้ไขโปรไฟล์ของตนเอง', () => {
    it('should update admin profile successfully', async () => {
      const updatedUser = { user_id: 99, firstname: 'Admin', lastname: 'Updated', phone: '0844444444' }
      ;(pool.execute as jest.Mock)
        .mockResolvedValueOnce([{}])
        .mockResolvedValueOnce([[updatedUser]])

      const res = mockRes()
      await updateProfile(makeReq({
        body: { firstname: 'Admin', lastname: 'Updated', phone: '0844444444' },
        user: { id: 99, role: 'admin' },
      }), res)

      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: 'อัปเดตโปรไฟล์เรียบร้อยแล้ว' }))
    })
  })

  it('should return 400 when firstname or lastname is missing', async () => {
    const res = mockRes()
    await updateProfile(makeReq({ body: { firstname: '', lastname: '' }, user: { id: 1 } }), res)

    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith({ message: 'กรุณากรอกชื่อและนามสกุล' })
  })
})

// ══════════════════════════════════════════════════════════════════════════════
// changePassword
// ══════════════════════════════════════════════════════════════════════════════

describe('changePassword', () => {

  // ─── TC-066 (ส่วน password): เปลี่ยนรหัสผ่าน ─────────────────────────────

  it('should change password successfully when current password is correct', async () => {
    ;(pool.execute as jest.Mock).mockResolvedValueOnce([[{ password: 'hashed' }]])
    ;(bcrypt.compare as jest.Mock).mockResolvedValue(true)
    ;(bcrypt.hash as jest.Mock).mockResolvedValue('new-hashed')
    ;(pool.execute as jest.Mock).mockResolvedValueOnce([{}])

    const res = mockRes()
    await changePassword(makeReq({
      body: { currentPassword: 'oldpass', newPassword: 'newpass123' },
      user: { id: 1 },
    }), res)

    expect(res.json).toHaveBeenCalledWith({ message: 'เปลี่ยนรหัสผ่านเรียบร้อยแล้ว' })
  })

  it('should return 400 when current password is wrong', async () => {
    ;(pool.execute as jest.Mock).mockResolvedValueOnce([[{ password: 'hashed' }]])
    ;(bcrypt.compare as jest.Mock).mockResolvedValue(false)

    const res = mockRes()
    await changePassword(makeReq({
      body: { currentPassword: 'wrongpass', newPassword: 'newpass123' },
      user: { id: 1 },
    }), res)

    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith({ message: 'รหัสผ่านปัจจุบันไม่ถูกต้อง' })
  })

  it('should return 400 when new password is less than 8 characters', async () => {
    const res = mockRes()
    await changePassword(makeReq({
      body: { currentPassword: 'oldpass', newPassword: '1234' },
      user: { id: 1 },
    }), res)

    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith({ message: 'รหัสผ่านใหม่ต้องมีอย่างน้อย 8 ตัวอักษร' })
  })

  it('should return 400 when fields are missing', async () => {
    const res = mockRes()
    await changePassword(makeReq({ body: {}, user: { id: 1 } }), res)

    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith({ message: 'กรุณากรอกข้อมูลให้ครบ' })
  })
})
