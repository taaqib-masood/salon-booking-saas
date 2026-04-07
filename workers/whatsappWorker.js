```javascript
import Queue from 'bull';
import { setQueues } from 'bull-board';
import { sendConfirmation, sendReminder, sendCancellation } from '../utils/whatsapp.js';
import NotificationModel from '../models/Notification.js';
import mongoose from 'mongoose';

const whatsappQueue = new Queue('WhatsApp', {
  redis: process.env.REDIS_URL,
});
setQueues([whatsappQueue]);

whatsappQueue.process(3, async (job) => {
  const notificationId = job.data.notificationId;
  let result;
  
  try {
    mongoose.connect(process.env.MONGO_URL);
    
    switch (job.name) {
      case 'send_confirmation':
        result = await sendConfirmation(job.data.phoneNumber, job.data.message);
        break;
      case 'send_reminder':
        result = await sendReminder(job.data.phoneNumber, job.data.message);
        break;
      case 'send_cancellation':
        result = await sendCancellation(job.data.phoneNumber, job.data.message);
        break;
    }
    
    if (result) {
      const notification = await NotificationModel.findByIdAndUpdate(notificationId, { status: 'sent' }, { new: true });
      
      if (!notification) throw new Error('Notification not found');
      
      return result;
    } else {
      throw new Error('Failed to send WhatsApp message');
    }
  } catch (error) {
    console.log(`Error processing job ${job.id}: ${error}`);
    
    const notification = await NotificationModel.findByIdAndUpdate(notificationId, { status: 'failed' }, { new: true });
    
    if (!notification) throw error;
  } finally {
    mongoose.connection.close();
  }
});
```