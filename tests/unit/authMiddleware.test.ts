// tests/unit/authMiddleware.test.ts
// ครอบคลุม: TC-015, TC-032, TC-047, TC-061, TC-076 (logout = no token), + middleware tests

jest.mock('jsonwebtoken')

import jwt from 'jsonwebtoken'
import { protect, AuthRequest } from '../../middleware/authMiddleware'
import { Response, NextFunction } from 'express'

const mockRes = () => {
  const res: Partial<Response> = {}
  res.status = jest.fn().mockReturnValue(res)
  res.json = jest.fn().mockReturnValue(res)
  return res as Response
}
const mockNext: NextFunction = jest.fn()

describe('authMiddleware - protect', () => {
  beforeEach(() => jest.clearAllMocks())

  // ไม่มี token → 401 (simulate TC-015/TC-032/TC-047/TC-061/TC-076 ฝั่ง backend = session หมดอายุ)
  test('ไม่มี Authorization header → 401 No token', () => {
    const req = { headers: {} } as AuthRequest
    const res = mockRes()

    protect(req, res, mockNext)

    expect(res.status).toHaveBeenCalledWith(401)
    expect(res.json).toHaveBeenCalledWith({ message: 'No token' })
    expect(mockNext).not.toHaveBeenCalled()
  })

  // Token หมดอายุ → 401 Invalid token
  test('Token หมดอายุ/ไม่ถูกต้อง → 401 Invalid token', () => {
    const req = { headers: { authorization: 'Bearer expired_token' } } as AuthRequest
    const res = mockRes()

    ;(jwt.verify as jest.Mock).mockImplementation(() => { throw new Error('TokenExpiredError') })

    protect(req, res, mockNext)

    expect(res.status).toHaveBeenCalledWith(401)
    expect(res.json).toHaveBeenCalledWith({ message: 'Invalid token' })
  })

  // Student token ถูกต้อง → next() + req.user.role = student
  test('Student token ถูกต้อง → next() ถูกเรียก, req.user.role = student', () => {
    const fakeUser = { id: 1, email: 'student@buu.ac.th', role: 'student' }
    const req = { headers: { authorization: 'Bearer student_token' } } as AuthRequest
    const res = mockRes()

    ;(jwt.verify as jest.Mock).mockReturnValue(fakeUser)

    protect(req, res, mockNext)

    expect(mockNext).toHaveBeenCalled()
    expect(req.user).toEqual(fakeUser)
    expect(req.user?.role).toBe('student')
  })

  // Personnel token ถูกต้อง → next() + req.user.role = personnel
  test('Personnel token ถูกต้อง → next() ถูกเรียก, req.user.role = personnel', () => {
    const fakeUser = { id: 5, email: 'personnel@buu.ac.th', role: 'personnel' }
    const req = { headers: { authorization: 'Bearer personnel_token' } } as AuthRequest
    const res = mockRes()

    ;(jwt.verify as jest.Mock).mockReturnValue(fakeUser)

    protect(req, res, mockNext)

    expect(mockNext).toHaveBeenCalled()
    expect(req.user?.role).toBe('personnel')
  })

  // Admin token ถูกต้อง → next() + req.user.role = admin
  test('Admin token ถูกต้อง → next() ถูกเรียก, req.user.role = admin', () => {
    const fakeAdmin = { id: 99, email: 'admin@buu.ac.th', role: 'admin' }
    const req = { headers: { authorization: 'Bearer admin_token' } } as AuthRequest
    const res = mockRes()

    ;(jwt.verify as jest.Mock).mockReturnValue(fakeAdmin)

    protect(req, res, mockNext)

    expect(mockNext).toHaveBeenCalled()
    expect(req.user?.role).toBe('admin')
  })

  // Token format ไม่มี Bearer → 401
  test('Authorization ไม่มี Bearer prefix → 401', () => {
    const req = { headers: { authorization: 'onlytokennobearer' } } as AuthRequest
    const res = mockRes()

    ;(jwt.verify as jest.Mock).mockImplementation(() => { throw new Error('invalid') })

    protect(req, res, mockNext)

    expect(res.status).toHaveBeenCalledWith(401)
  })
})