import { getComplaints, getMyComplaints, createComplaint, updateStatus } from '../controllers/complaintController'
import { Response } from 'express'
import { AuthRequest } from '../middleware/authMiddleware'
import pool from '../db'

jest.mock('../db', () => ({ __esModule: true, default: { execute: jest.fn() } }))

const mockRes = () => {
  const res = {} as Response
  res.status = jest.fn().mockReturnValue(res)
  res.json = jest.fn().mockReturnValue(res)
  return res
}

const mockAuthReq = (overrides = {}): AuthRequest => ({
  user: { id: 1, email: 'test@test.com', role: 'student' },
  body: {},
  params: {},
  ...overrides
} as any)

describe('getComplaints', () => {
  beforeEach(() => jest.clearAllMocks())

  it('should return all complaints with 200', async () => {
    const fakeData = [
      { issue_id: 1, title: 'test issue', status: 'pending' }
    ]
    ;(pool.execute as jest.Mock).mockResolvedValue([fakeData])

    const req = mockAuthReq()
    const res = mockRes()

    await getComplaints(req, res)

    expect(res.json).toHaveBeenCalledWith(fakeData)
  })
})

describe('getMyComplaints', () => {
  beforeEach(() => jest.clearAllMocks())

  it('should return complaints of current user', async () => {
    const fakeData = [
      { issue_id: 1, title: 'my issue', status: 'pending' }
    ]
    ;(pool.execute as jest.Mock).mockResolvedValue([fakeData])

    const req = mockAuthReq()
    const res = mockRes()

    await getMyComplaints(req, res)

    expect(pool.execute).toHaveBeenCalledWith(
      expect.any(String),
      [1]
    )
    expect(res.json).toHaveBeenCalledWith(fakeData)
  })
})

describe('createComplaint', () => {
  beforeEach(() => jest.clearAllMocks())

  it('should create complaint and return 201', async () => {
    ;(pool.execute as jest.Mock).mockResolvedValue([{}])

    const req = mockAuthReq({
      body: {
        title: 'น้ำรั่ว',
        description: 'ห้องน้ำชั้น 2',
        category_id: 1,
        location_id: 1,
        priority: 'high'
      }
    })
    const res = mockRes()

    await createComplaint(req, res)

    expect(res.status).toHaveBeenCalledWith(201)
    expect(res.json).toHaveBeenCalledWith({ message: 'Issue reported successfully' })
  })

  it('should use default priority as medium if not provided', async () => {
    ;(pool.execute as jest.Mock).mockResolvedValue([{}])

    const req = mockAuthReq({
      body: {
        title: 'ไฟดับ',
        description: '',
        category_id: 1,
        location_id: 1
      }
    })
    const res = mockRes()

    await createComplaint(req, res)

    expect(pool.execute).toHaveBeenCalledWith(
      expect.any(String),
      expect.arrayContaining(['medium'])
    )
  })
})

describe('updateStatus', () => {
  beforeEach(() => jest.clearAllMocks())

  it('should update status and return success message', async () => {
    ;(pool.execute as jest.Mock).mockResolvedValue([{}])

    const req = mockAuthReq({
      params: { id: '1' },
      body: { status: 'in_progress' }
    })
    const res = mockRes()

    await updateStatus(req, res)

    expect(pool.execute).toHaveBeenCalledWith(
      expect.any(String),
      ['in_progress', '1']
    )
    expect(res.json).toHaveBeenCalledWith({ message: 'Status updated' })
  })
})