import cron from 'node-cron';
import { Offer } from '../models/offerModel.js';

export const startOfferExpiryJob = () => {
  cron.schedule('0 0 * * *', async () => {
    try {
      await Offer.updateMany(
        { validTo: { $lt: new Date() }, isActive: true },
        { $set: { isActive: false } }
      );
    } catch (error) {
      console.log('Error in offer expiry job', error);
    }
  });
};