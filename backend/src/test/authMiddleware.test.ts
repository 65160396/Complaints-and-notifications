import { protect } from '../middleware/authMiddleware'
import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'

jest.mock('jsonwebtoken')

const mockNext: NextFunction = jest.fn()

const mockRes = () => {
  const res = {} as Response
  res.status = jest.fn().mockReturnValue(res)
  res.json = jest.fn().mockReturnValue(res)
  return res
}

describe('protect middleware', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should return 401 if no token provided', () => {
    const req = { headers: {} } as Request
    const res = mockRes()

    protect(req as any, res, mockNext)

    expect(res.status).toHaveBeenCalledWith(401)
    expect(res.json).toHaveBeenCalledWith({ message: 'No token' })
    expect(mockNext).not.toHaveBeenCalled()
  })

  it('should call next() if token is valid', () => {
    const req = {
      headers: { authorization: 'Bearer validtoken' }
    } as Request
    const res = mockRes()

    const decoded = { id: 1, email: 'test@test.com', role: 'student' }
    ;(jwt.verify as jest.Mock).mockReturnValue(decoded)

    protect(req as any, res, mockNext)

    expect(mockNext).toHaveBeenCalled()
    expect((req as any).user).toEqual(decoded)
  })

  it('should return 401 if token is invalid', () => {
    const req = {
      headers: { authorization: 'Bearer invalidtoken' }
    } as Request
    const res = mockRes()

    ;(jwt.verify as jest.Mock).mockImplementation(() => {
      throw new Error('invalid token')
    })

    protect(req as any, res, mockNext)

    expect(res.status).toHaveBeenCalledWith(401)
    expect(res.json).toHaveBeenCalledWith({ message: 'Invalid token' })
    expect(mockNext).not.toHaveBeenCalled()
  })
})