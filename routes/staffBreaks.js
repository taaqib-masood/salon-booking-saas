import express from 'express';
import { getMyBreaks, getBreaksByStaff, createBreak, deleteBreak } from '../controllers/staffBreaksController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();
router.use(authenticate);

router.get('/', getMyBreaks);
router.get('/:staff_id', authorize('owner', 'admin', 'manager'), getBreaksByStaff);
router.post('/', createBreak);
router.delete('/:id', deleteBreak);

export default router;
