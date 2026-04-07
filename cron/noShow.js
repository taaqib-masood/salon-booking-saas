import cron from 'node-cron';
import AppointmentModel from '../models/Appointment.js';
import NotificationModel from '../models/Notification.js';

const startNoShowJob = () => {
  cron.schedule('0 23 * * *', async () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const appointments = await AppointmentModel.find({
      date: { $lt: today },
      status: { $in: ['confirmed', 'pending'] }
    });

    for (const appointment of appointments) {
      appointment.status = 'no_show';
      await appointment.save();
      
      const notification = new NotificationModel({
        userId: appointment.userId,
        message: `Your appointment on ${appointment.date} has been marked as no show`
      });
      await notification.save();
    }
  });
};

export default startNoShowJob;