import { Router } from 'express'
import { getProfile, updateProfile, changePassword } from '../controllers/profileController'
import { protect } from '../middleware/authMiddleware'

const router = Router()

router.get('/', protect, getProfile)
router.patch('/', protect, updateProfile)
router.patch('/change-password', protect, changePassword)

export default router