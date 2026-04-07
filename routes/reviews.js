import express from 'express';
import { authenticateCustomer } from '../middleware/authMiddleware.js';
import { isAdmin } from '../middleware/roleMiddleware.js';
import ReviewController from '../controllers/reviewController.js';

const router = express.Router();

router.post('/reviews', authenticateCustomer, ReviewController.createReview);

router.get('/reviews', ReviewController.getReviews);

router.get('/reviews/:id', ReviewController.getReviewById);

router.delete('/reviews/:id', isAdmin, ReviewController.unpublishReview);

export default router;