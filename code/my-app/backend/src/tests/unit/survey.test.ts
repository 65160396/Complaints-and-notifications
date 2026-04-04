// tests/unit/survey.test.ts
// ครอบคลุม: TC-011, TC-012

import { submitSurvey, getSurvey } from '../../controllers/surveyController'
import pool from '../../db'

jest.mock('../../db')

const mockRes = () => {
  const res: any = {}
  res.status = jest.fn().mockReturnValue(res)
  res.json   = jest.fn().mockReturnValue(res)
  return res
}
const makeReq = (overrides: any) => ({
  body: {}, params: {}, user: { id: 1, role: 'student' },
  ...overrides,
} as any)

beforeEach(() => jest.clearAllMocks())

// ══════════════════════════════════════════════════════════════════════════════
// submitSurvey
// ══════════════════════════════════════════════════════════════════════════════

describe('submitSurvey', () => {

  // ─── TC-011: ประเมินความพึงพอใจหลังคำร้องเสร็จสิ้น ───────────────────────

  describe('TC-011: ประเมินคำร้องที่ resolved แล้ว', () => {
    it('should insert survey and return 201 when complaint is resolved and not yet rated', async () => {
      ;(pool.execute as jest.Mock)
        .mockResolvedValueOnce([[{ issue_id: 1, status: 'resolved', user_id: 1 }]])  // SELECT issue
        .mockResolvedValueOnce([[]])   // SELECT existing survey (ยังไม่มี)
        .mockResolvedValueOnce([{}])   // INSERT survey

      const res = mockRes()
      await submitSurvey(makeReq({
        body: { issue_id: 1, rating: 4, comment: 'ดีมาก' },
        user: { id: 1 },
      }), res)

      expect(res.status).toHaveBeenCalledWith(201)
      expect(res.json).toHaveBeenCalledWith({ message: 'ขอบคุณสำหรับการประเมิน' })
    })
  })

  // ─── TC-012: ประเมินซ้ำหลังจากประเมินไปแล้ว ──────────────────────────────

  describe('TC-012: ประเมินซ้ำไม่ได้', () => {
    it('should return 400 when complaint already has a survey', async () => {
      ;(pool.execute as jest.Mock)
        .mockResolvedValueOnce([[{ issue_id: 1, status: 'resolved', user_id: 1 }]])  // SELECT issue
        .mockResolvedValueOnce([[{ survey_id: 1, rating: 4 }]])   // SELECT existing → มีแล้ว

      const res = mockRes()
      await submitSurvey(makeReq({
        body: { issue_id: 1, rating: 5 },
        user: { id: 1 },
      }), res)

      expect(res.status).toHaveBeenCalledWith(400)
      expect(res.json).toHaveBeenCalledWith({ message: 'คุณได้ประเมินคำร้องนี้ไปแล้ว' })
    })
  })

  it('should return 400 when complaint is not resolved', async () => {
    ;(pool.execute as jest.Mock)
      .mockResolvedValueOnce([[]])  // SELECT → ไม่เจอ (status ไม่ใช่ resolved หรือ user ไม่ตรง)

    const res = mockRes()
    await submitSurvey(makeReq({
      body: { issue_id: 1, rating: 3 },
      user: { id: 1 },
    }), res)

    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith({ message: 'ไม่พบคำร้องนี้ หรือยังไม่ได้รับการแก้ไข' })
  })

  it('should return 400 when rating is out of range', async () => {
    const res = mockRes()
    await submitSurvey(makeReq({
      body: { issue_id: 1, rating: 6 },
      user: { id: 1 },
    }), res)

    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith({ message: 'กรุณาให้คะแนน 1-5 ดาว' })
  })

  it('should return 400 when rating is 0', async () => {
    const res = mockRes()
    await submitSurvey(makeReq({
      body: { issue_id: 1, rating: 0 },
      user: { id: 1 },
    }), res)

    expect(res.status).toHaveBeenCalledWith(400)
  })
})

// ══════════════════════════════════════════════════════════════════════════════
// getSurvey
// ══════════════════════════════════════════════════════════════════════════════

describe('getSurvey', () => {
  it('should return survey data when found', async () => {
    const fakeSurvey = { survey_id: 1, issue_id: 1, rating: 4, comment: 'ดีมาก' }
    ;(pool.execute as jest.Mock).mockResolvedValueOnce([[fakeSurvey]])

    const res = mockRes()
    await getSurvey(makeReq({ params: { issue_id: '1' }, user: { id: 1, role: 'samo' } }), res)

    expect(res.json).toHaveBeenCalledWith(fakeSurvey)
  })

  it('should return null when survey not found', async () => {
    ;(pool.execute as jest.Mock).mockResolvedValueOnce([[]])

    const res = mockRes()
    await getSurvey(makeReq({ params: { issue_id: '999' }, user: { id: 1, role: 'samo' } }), res)

    expect(res.json).toHaveBeenCalledWith(null)
  })
})
