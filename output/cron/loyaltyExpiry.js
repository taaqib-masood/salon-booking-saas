import cron from 'node-cron';
import mongoose from 'mongoose';
import CustomerModel from '../models/customer.js';
import LoyaltyTransactionModel from '../models/loyaltyTransaction.js';

const startLoyaltyExpiryJob = () => {
  cron.schedule('0 0 1 * *', async () => {
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

    const customers = await CustomerModel.find({
      loyaltyPoints: { $gt: 0 },
      'loyaltyTransactions.date': { $lt: oneYearAgo }
    });

    for (const customer of customers) {
      const lastEarnTransaction = customer.loyaltyTransactions.reduce((max, loyaltyTransaction) =>
        loyaltyTransaction.type === 'earn' && (!max || max.date < loyaltyTransaction.date ? loyaltyTransaction : max), null);

      if (lastEarnTransaction && lastEarnTransaction.date < oneYearAgo) {
        customer.loyaltyPoints = 0;
        await customer.save();

        const expireTransaction = new LoyaltyTransactionModel({
          type: 'expire',
          date: new Date(),
          points: customer.loyaltyPoints,
          customerId: customer._id
        });

        await expireTransaction.save();
      }
    }
  }, {
    scheduled: false
  });
};

export default startLoyaltyExpiryJob;