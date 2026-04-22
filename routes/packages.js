import express from 'express';
import { getPackages, createPackage, updatePackage, purchasePackage, getMyPackages, useSession } from '../controllers/packages.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

router.get('/', authenticate, getPackages);
router.post('/', authenticate, authorize('owner', 'admin'), createPackage);
router.put('/:id', authenticate, authorize('owner', 'admin'), updatePackage);
router.post('/:id/purchase', authenticate, purchasePackage);
router.get('/my', authenticate, getMyPackages);
router.post('/use', authenticate, useSession);

export default router;