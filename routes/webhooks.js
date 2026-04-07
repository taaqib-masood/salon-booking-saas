```javascript
import express from 'express';
const router = express.Router();

// Import your webhook controller here
import { getWebhooks, registerWebhook, updateWebhook, regenerateSecret, deleteWebhook, getDeliveries, testWebhook } from '../controllers/webhookController.js';

router.get('/', getWebhooks);
router.post('/register', registerWebhook);
router.put('/:id', updateWebhook);
router.post('/:id/regenerate-secret', regenerateSecret);
router.delete('/:id', deleteWebhook);
router.get('/:id/deliveries', getDeliveries);
router.post('/:id/test', testWebhook);

export default router;
```