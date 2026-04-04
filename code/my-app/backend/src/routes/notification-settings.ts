import { Router } from 'express'
import { getSettings, updateSettings, resetSettings } from '../controllers/notificationSettingsController'
import { protect } from '../middleware/authMiddleware'

const router = Router()

router.get('/', protect, getSettings)
router.patch('/', protect, updateSettings)
router.post('/reset', protect, resetSettings)

export default router