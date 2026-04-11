import express from 'express';
import { getBranches, getBranchById, createBranch, updateBranch, deleteBranch, checkAvailability } from '../controllers/branches.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

router.get('/', getBranches);
router.get('/:id', getBranchById);
router.get('/:id/availability', checkAvailability);
router.post('/', authenticate, authorize('owner', 'admin'), createBranch);
router.put('/:id', authenticate, authorize('owner', 'admin', 'manager'), updateBranch);
router.delete('/:id', authenticate, authorize('owner', 'admin'), deleteBranch);

export default router;