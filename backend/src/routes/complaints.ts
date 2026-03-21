import { Router } from 'express'
import { getComplaints, getMyComplaints, createComplaint, updateStatus, cancelComplaint } from '../controllers/complaintController'
import { protect } from '../middleware/authMiddleware'

const router = Router()
router.get('/', protect, getComplaints)
router.get('/my', protect, getMyComplaints)
router.post('/', protect, createComplaint)
router.patch('/:id/status', protect, updateStatus)
router.patch('/:id/cancel', protect, cancelComplaint)  // US10/D10

export default router