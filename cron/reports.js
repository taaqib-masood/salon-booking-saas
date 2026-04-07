```javascript
import cron from 'node-cron';
import { MongoClient } from 'mongodb';
import axios from 'axios';

const timeZone = 'Asia/Dubai';

// Initialize MongoDB client
let db;
MongoClient.connect('mongodb://localhost:27017', { useUnifiedTopology: true }, (err, client) => {
  if(err){
    console.error("Error occurred while connecting to database", err);
    return;
  }
  db = client.db('mydatabase'); // Replace 'mydatabase' with your actual database name
});

// Daily sales report at 11:30 PM
cron.schedule('30 23 * * *', async () => {
  const collection = db.collection('sales');
  const dailySalesReport = await collection.aggregate([
    // Define your aggregation pipeline here to generate the report
  ]).toArray();
  
  // Send report via WhatsApp reminder
  axios.post('https://api.whatsapp.com/send', {
    phone: '+1234567890', // Replace with actual recipient's number
    message: `Daily sales report: ${JSON.stringify(dailySalesReport)}`,
  });
}, { timezone: timeZone });

// Weekly staff performance report on Sunday at 11 PM
cron.schedule('0 23 * * 0', async () => {
  const collection = db.collection('staff');
  const weeklyStaffPerformanceReport = await collection.aggregate([
    // Define your aggregation pipeline here to generate the report
  ]).toArray();
  
  axios.post('https://api.whatsapp.com/send', {
    phone: '+1234567890', // Replace with actual recipient's number
    message: `Weekly staff performance report: ${JSON.stringify(weeklyStaffPerformanceReport)}`,
  });
}, { timezone: timeZone });

// Monthly VAT summary on the first day of each month at 1 AM
cron.schedule('0 1 1 * *', async () => {
  const collection = db.collection('vat');
  const monthlyVATSummaryReport = await collection.aggregate([
    // Define your aggregation pipeline here to generate the report
  ]).toArray();
  
  axios.post('https://api.whatsapp.com/send', {
    phone: '+1234567890', // Replace with actual recipient's number
    message: `Monthly VAT summary report: ${JSON.stringify(monthlyVATSummaryReport)}`,
  });
}, { timezone: timeZone });
```