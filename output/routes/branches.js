import express from 'express';
import { getBranches, getBranchById, createBranch, updateBranch, deleteBranch, checkAvailability } from '../controllers/branches.js';
import { protect, restrictTo } from '../middlewares/auth.js';

const router = express.Router();

router.get('/', getBranches);
router.post('/', protect, restrictTo('admin'), createBranch);
router.get('/:id', getBranchById);
router.put('/:id', protect, restrictTo('admin', 'manager'), updateBranch);
router.delete('/:id', protect, restrictTo('admin'), deleteBranch);
router.get('/:id/availability', checkAvailability);

export default router;