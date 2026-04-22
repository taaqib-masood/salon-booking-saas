import express from 'express';
import { getServices, getServiceById, createService, updateService, deleteService } from '../controllers/serviceController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

router.get('/', getServices);
router.get('/:id', getServiceById);
router.post('/', authenticate, authorize('owner', 'admin', 'manager'), createService);
router.put('/:id', authenticate, authorize('owner', 'admin', 'manager'), updateService);
router.delete('/:id', authenticate, authorize('owner', 'admin'), deleteService);

export default router;