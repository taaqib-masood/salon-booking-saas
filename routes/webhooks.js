import express from 'express';
import { getWebhooks, createWebhook, updateWebhook, deleteWebhook, getWebhookDeliveries } from '../controllers/webhookController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticate);

router.get('/',                       getWebhooks);
router.post('/',                      authorize('owner', 'admin'), createWebhook);
router.put('/:id',                    authorize('owner', 'admin'), updateWebhook);
router.delete('/:id',                 authorize('owner', 'admin'), deleteWebhook);
router.get('/:id/deliveries',         getWebhookDeliveries);

export default router;