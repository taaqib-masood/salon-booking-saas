import express from 'express';
const router = express.Router();

// Import the notification controller
import * as notificationsController from '../controllers/notifications.js';

router.post('/send', notificationsController.sendNotification);

router.get('/', notificationsController.listNotifications);

router.post('/reminder-batch', notificationsController.sendReminders);

export default router;