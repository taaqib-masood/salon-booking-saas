import cron from 'node-cron';
import { Appointment } from '../models/Appointment.js';
import { sendReminder } from '../utils/whatsapp.js';
import { Notification } from '../models/Notification.js';

export const startReminderJob = () => {
  cron.schedule('*/15 * * * *', async () => {
    console.log('Running reminder job');
    
    // Calculate the date for next 2 hours
    let now = new Date();
    let twoHoursFromNow = new Date(now.getTime() + 2 * 60 * 60 * 1000);

    try {
      const appointments = await Appointment.find({
        date: { $gte: now, $lte: twoHoursFromNow },
        reminderSent: false,
        status: 'confirmed'
      });
      
      for (let appointment of appointments) {
        try {
          await sendReminder(appointment);
          
          // Update the appointment document
          appointment.reminderSent = true;
          await appointment.save();

          // Create a new notification document
          const notification = new Notification({
            user: appointment.user,
            message: 'Appointment reminder sent',
            date: new Date()
          });
          
          await notification.save();
        } catch (error) {
          console.log('Error sending reminder for appointment', appointment._id);
        }
      }
    } catch (error) {
      console.log('Error fetching appointments');
    }
  });
};