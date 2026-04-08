import express from 'express';
import { authenticate } from '../middleware/auth.js';
import * as loyaltyController from '../controllers/loyalty.js';

const router = express.Router();

router.get('/balance', authenticate, loyaltyController.getBalance);
router.get('/transactions', authenticate, loyaltyController.getTransactions);
router.post('/redeem', authenticate, loyaltyController.redeemPoints);

export default router;