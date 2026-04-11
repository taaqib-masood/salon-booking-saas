import express from 'express';
import { getNotifications, createNotification, markSent } from '../controllers/notifications.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticate);

router.get('/',       getNotifications);
router.post('/',      createNotification);
router.patch('/:id/sent', markSent);

export default router;