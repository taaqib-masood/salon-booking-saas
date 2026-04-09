import express from 'express';
import {
  getOffers,
  createOffer,
  updateOffer,
  deleteOffer,
  validateOffer,
} from '../controllers/offersController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

router.post('/validate', authenticate, validateOffer);

router.use(authenticate);
router.get('/', getOffers);
router.post('/', authorize('owner', 'admin'), createOffer);
router.put('/:id', authorize('owner', 'admin'), updateOffer);
router.delete('/:id', authorize('owner', 'admin'), deleteOffer);

export default router;
