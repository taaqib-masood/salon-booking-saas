import express from 'express';
const router = express.Router();
import { registerTerminal, listTerminals, createCharge, handleWebhookEvent, generateReceipt } from '../controllers/posController.js';
import { isAdmin } from '../middleware/authMiddleware.js';

router.post('/terminals', isAdmin, registerTerminal);
router.get('/terminals', listTerminals);
router.post('/charge', createCharge);
router.post('/webhook', handleWebhookEvent);
router.get('/receipt/:appointmentId', generateReceipt);

export default router;