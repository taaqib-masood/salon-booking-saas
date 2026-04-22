import express from 'express';
import {
  getStaff,
  getStaffById,
  createStaff,
  updateStaff,
  deleteStaff,
  getStaffSchedule,
  getPublicStaff,
} from '../controllers/staffController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

// Public — no auth required
router.get('/public', getPublicStaff);

router.use(authenticate);

router.get('/', getStaff);
router.get('/:id', getStaffById);
router.post('/', authorize('owner', 'admin'), createStaff);
router.put('/:id', authorize('owner', 'admin'), updateStaff);
router.delete('/:id', authorize('owner', 'admin'), deleteStaff);
router.get('/:id/schedule', getStaffSchedule);

export default router;
