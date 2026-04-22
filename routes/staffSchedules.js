import express from 'express';
import { getStaffSchedule, upsertStaffSchedule, getAllSchedules, getMySchedule, updateMySchedule } from '../controllers/staffSchedulesController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticate);

router.get('/me',        getMySchedule);
router.put('/me',        updateMySchedule);
router.get('/',          authorize('owner', 'admin', 'manager'), getAllSchedules);
router.get('/:staff_id', getStaffSchedule);
router.put('/:staff_id', authorize('owner', 'admin', 'manager'), upsertStaffSchedule);

export default router;
