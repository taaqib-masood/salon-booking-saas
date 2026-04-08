import express from 'express';
const router = express.Router();

// Import your controllers here
import { getPackages, createPackage, updatePackage, purchasePackage, getMyPackages, useSession } from '../controllers/packages.js';

// Middleware for authentication and authorization checks
import { isAuthenticatedCustomer, isAdmin } from '../middlewares/auth.js';

router.get('/', getPackages);
router.post('/', isAdmin, createPackage);
router.put('/:id', isAdmin, updatePackage);
router.post('/:id/purchase', isAuthenticatedCustomer, purchasePackage);
router.get('/my', isAuthenticatedCustomer, getMyPackages);
router.post('/use', isAuthenticatedCustomer, useSession);

export default router;