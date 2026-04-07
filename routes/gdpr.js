```javascript
import express from 'express';
const router = express.Router();
import CustomerModel from '../models/customer.js';
import AppointmentModel from '../models/appointment.js';
import twilioClient from 'twilio'; // Assuming you're using Twilio for WhatsApp

router.get('/gdpr/export', async (req, res) => {
    try {
        const customers = await CustomerModel.find({});
        return res.json(customers);
    } catch (err) {
        console.error(err);
        return res.status(500).send('Server Error');
    }
});

router.delete('/gdpr/delete', async (req, res) => {
    try {
        const customers = await CustomerModel.find({});
        for (const customer of customers) {
            // Anonymize data by setting it to null or a default value
            customer.name = 'Anonymous';
            customer.email = null;
            customer.phoneNumber = null;
            await customer.save();
            
            const appointments = await AppointmentModel.find({customerId: customer._id});
            for (const appointment of appointments) {
                // Keep appointment records for audit purposes
                appointment.isDeleted = true;
                await appointment.save();
            }
        }
        
        // Send confirmation WhatsApp message
        const message = await twilioClient.messages.create({
            body: 'Your data has been deleted',
            from: 'whatsapp:+14155238886',
            to: 'whatsapp:+1234567890' // Replace with actual number
        });
        
        return res.send('Data deleted and confirmation sent');
    } catch (err) {
        console.error(err);
        return res.status(500).send('Server Error');
    }
});

export default router;
```