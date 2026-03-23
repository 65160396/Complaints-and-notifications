// tests/unit/survey.test.ts
// ครอบคลุม: TC-011, TC-012

jest.mock('../../db', () => ({ execute: jest.fn() }))

import pool from '../../db'
import {
  submitSurvey,
  getSurvey,
} from '../../controllers/surveyController'

const mockReq = (overrides = {}) => ({
  user: { id: 1, email: 'student@buu.ac.th', role: 'student' },
  body: {},
  params: {},
  ...overrides,
} as any)

const mockRes = () => {
  const res: any = {}
  res.status = jest.fn().mockReturnValue(res)
  res.json = jest.fn().mockReturnValue(res)
  return res
}

// ─── submitSurvey ─────────────────────────────────────────────────────────────

describe('submitSurvey', () => {
  beforeEach(() => jest.clearAllMocks())

  // TC-011: ประเมิน 4 ดาว สำเร็จ → 201
  test('TC-011: ประเมิน 4 ดาวสำเร็จ → 201 ขอบคุณสำหรับการประเมิน', async () => {
    ;(pool.execute as jest.Mock)
      .mockResolvedValueOnce([[{ issue_id: 1, user_id: 1, status: 'resolved' }]]) // issue ถูกต้อง
      .mockResolvedValueOnce([[]])                                                   // ยังไม่เคยประเมิน
      .mockResolvedValueOnce([{ insertId: 1 }])                                     // INSERT สำเร็จ

    const req = mockReq({ body: { issue_id: 1, rating: 4, comment: 'ดีมาก' } })
    const res = mockRes()
    await submitSurvey(req, res)

    expect(res.status).toHaveBeenCalledWith(201)
    expect(res.json).toHaveBeenCalledWith({ message: 'ขอบคุณสำหรับการประเมิน' })
  })

  // TC-012: ประเมินซ้ำ → 400
  test('TC-012: ประเมินซ้ำ → 400 คุณได้ประเมินไปแล้ว', async () => {
    ;(pool.execute as jest.Mock)
      .mockResolvedValueOnce([[{ issue_id: 1, user_id: 1, status: 'resolved' }]]) // issue ถูกต้อง
      .mockResolvedValueOnce([[{ survey_id: 1 }]])                                  // เคยประเมินแล้ว

    const req = mockReq({ body: { issue_id: 1, rating: 5, comment: 'ดี' } })
    const res = mockRes()
    await submitSurvey(req, res)

    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith({ message: 'คุณได้ประเมินคำร้องนี้ไปแล้ว' })
  })

  // rating น้อยกว่า 1 → 400
  test('rating = 0 → 400 กรุณาให้คะแนน 1-5 ดาว', async () => {
    const req = mockReq({ body: { issue_id: 1, rating: 0 } })
    const res = mockRes()
    await submitSurvey(req, res)

    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith({ message: 'กรุณาให้คะแนน 1-5 ดาว' })
  })

  // rating มากกว่า 5 → 400
  test('rating = 6 → 400 กรุณาให้คะแนน 1-5 ดาว', async () => {
    const req = mockReq({ body: { issue_id: 1, rating: 6 } })
    const res = mockRes()
    await submitSurvey(req, res)

    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith({ message: 'กรุณาให้คะแนน 1-5 ดาว' })
  })

  // คำร้องยังไม่ resolved → 400
  test('คำร้องยังไม่ resolved → 400 ไม่พบคำร้อง', async () => {
    ;(pool.execute as jest.Mock).mockResolvedValueOnce([[]])

    const req = mockReq({ body: { issue_id: 1, rating: 4 } })
    const res = mockRes()
    await submitSurvey(req, res)

    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith({ message: 'ไม่พบคำร้องนี้ หรือยังไม่ได้รับการแก้ไข' })
  })

  // ประเมิน 1 ดาว (ต่ำสุด) → สำเร็จ
  test('rating = 1 (ต่ำสุด) → 201 สำเร็จ', async () => {
    ;(pool.execute as jest.Mock)
      .mockResolvedValueOnce([[{ issue_id: 2, user_id: 1, status: 'resolved' }]])
      .mockResolvedValueOnce([[]])
      .mockResolvedValueOnce([{ insertId: 2 }])

    const req = mockReq({ body: { issue_id: 2, rating: 1 } })
    const res = mockRes()
    await submitSurvey(req, res)

    expect(res.status).toHaveBeenCalledWith(201)
  })

  // ประเมิน 5 ดาว (สูงสุด) → สำเร็จ
  test('rating = 5 (สูงสุด) → 201 สำเร็จ', async () => {
    ;(pool.execute as jest.Mock)
      .mockResolvedValueOnce([[{ issue_id: 3, user_id: 1, status: 'resolved' }]])
      .mockResolvedValueOnce([[]])
      .mockResolvedValueOnce([{ insertId: 3 }])

    const req = mockReq({ body: { issue_id: 3, rating: 5, comment: 'ดีเยี่ยม' } })
    const res = mockRes()
    await submitSurvey(req, res)

    expect(res.status).toHaveBeenCalledWith(201)
  })
})

// ─── getSurvey ────────────────────────────────────────────────────────────────

describe('getSurvey', () => {
  beforeEach(() => jest.clearAllMocks())

  // มีผลประเมิน → return survey
  test('มีผลประเมิน → return survey data', async () => {
    const fakeSurvey = { survey_id: 1, issue_id: 1, rating: 4, comment: 'ดีมาก' }
    ;(pool.execute as jest.Mock).mockResolvedValueOnce([[fakeSurvey]])

    const req = mockReq({ params: { issue_id: '1' } })
    const res = mockRes()
    await getSurvey(req, res)

    expect(res.json).toHaveBeenCalledWith(fakeSurvey)
  })

  // TC-012: ยังไม่มีผลประเมิน → return null
  test('TC-012: ยังไม่มีผลประเมิน → return null', async () => {
    ;(pool.execute as jest.Mock).mockResolvedValueOnce([[]])

    const req = mockReq({ params: { issue_id: '99' } })
    const res = mockRes()
    await getSurvey(req, res)

    expect(res.json).toHaveBeenCalledWith(null)
  })
})