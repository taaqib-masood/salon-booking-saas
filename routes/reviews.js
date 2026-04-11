import express from 'express';
import ReviewController from '../controllers/reviewController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

router.post('/reviews', authenticate, ReviewController.createReview);
router.get('/reviews', ReviewController.getReviews);
router.get('/reviews/:id', ReviewController.getReviewById);
router.delete('/reviews/:id', authenticate, authorize('owner', 'admin'), ReviewController.unpublishReview);

export default router;