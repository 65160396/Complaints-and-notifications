 import { Router } from 'express'
import { submitSurvey, getSurvey } from '../controllers/surveyController'
import { protect } from '../middleware/authMiddleware'

const router = Router()

router.post('/', protect, submitSurvey)
router.get('/:issue_id', protect, getSurvey)

export default router