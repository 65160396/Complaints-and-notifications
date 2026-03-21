import { register, login } from '../controllers/authController'
import { Request, Response } from 'express'
import pool from '../db'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

jest.mock('../db', () => ({ __esModule: true, default: { execute: jest.fn() } }))
jest.mock('bcryptjs')
jest.mock('jsonwebtoken')

const mockRes = () => {
  const res = {} as Response
  res.status = jest.fn().mockReturnValue(res)
  res.json = jest.fn().mockReturnValue(res)
  return res
}

describe('register', () => {
  beforeEach(() => jest.clearAllMocks())

  it('should register successfully and return 201', async () => {
    const req = {
      body: {
        student_id: '65010001',
        firstname: 'Test',
        lastname: 'User',
        email: 'test@test.com',
        password: '123456',
        role: 'student'
      }
    } as Request
    const res = mockRes()

    ;(bcrypt.hash as jest.Mock).mockResolvedValue('hashedpassword')
    ;(pool.execute as jest.Mock).mockResolvedValue([{}])

    await register(req, res)

    expect(res.status).toHaveBeenCalledWith(201)
    expect(res.json).toHaveBeenCalledWith({ message: 'Registered successfully' })
  })

  it('should use default role as student if role not provided', async () => {
    const req = {
      body: {
        firstname: 'Test',
        lastname: 'User',
        email: 'test2@test.com',
        password: '123456'
      }
    } as Request
    const res = mockRes()

    ;(bcrypt.hash as jest.Mock).mockResolvedValue('hashedpassword')
    ;(pool.execute as jest.Mock).mockResolvedValue([{}])

    await register(req, res)

    expect(pool.execute).toHaveBeenCalledWith(
      expect.any(String),
      expect.arrayContaining(['student'])
    )
  })
})

describe('login', () => {
  beforeEach(() => jest.clearAllMocks())

  it('should return token on valid credentials', async () => {
    const req = {
      body: { email: 'test@test.com', password: '123456' }
    } as Request
    const res = mockRes()

    const fakeUser = {
      user_id: 1,
      email: 'test@test.com',
      firstname: 'Test',
      lastname: 'User',
      role: 'student',
      password: 'hashedpassword'
    }

    ;(pool.execute as jest.Mock).mockResolvedValue([[fakeUser]])
    ;(bcrypt.compare as jest.Mock).mockResolvedValue(true)
    ;(jwt.sign as jest.Mock).mockReturnValue('fake.jwt.token')

    await login(req, res)

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ token: 'fake.jwt.token' })
    )
  })

  it('should return 401 if user not found', async () => {
    const req = {
      body: { email: 'notfound@test.com', password: '123456' }
    } as Request
    const res = mockRes()

    ;(pool.execute as jest.Mock).mockResolvedValue([[]])

    await login(req, res)

    expect(res.status).toHaveBeenCalledWith(401)
    expect(res.json).toHaveBeenCalledWith({ message: 'Invalid credentials' })
  })

  it('should return 401 if password is wrong', async () => {
    const req = {
      body: { email: 'test@test.com', password: 'wrongpassword' }
    } as Request
    const res = mockRes()

    const fakeUser = { user_id: 1, email: 'test@test.com', password: 'hashedpassword' }

    ;(pool.execute as jest.Mock).mockResolvedValue([[fakeUser]])
    ;(bcrypt.compare as jest.Mock).mockResolvedValue(false)

    await login(req, res)

    expect(res.status).toHaveBeenCalledWith(401)
    expect(res.json).toHaveBeenCalledWith({ message: 'Invalid credentials' })
  })
})