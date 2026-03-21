import { Router } from 'express'
import {
  getComplaints,
  getMyComplaints,
  createComplaint,
  updateStatus,
  cancelComplaint,
  getComplaintImages,
} from '../controllers/complaintController'
import { protect } from '../middleware/authMiddleware'
import upload from '../middleware/uploadMiddleware'

const router = Router()

router.get('/', protect, getComplaints)
router.get('/my', protect, getMyComplaints)
router.post('/', protect, upload.array('images', 5), createComplaint)  // รับรูปได้สูงสุด 5 รูป
router.patch('/:id/status', protect, updateStatus)
router.patch('/:id/cancel', protect, cancelComplaint)
router.get('/:id/images', protect, getComplaintImages)

export default router