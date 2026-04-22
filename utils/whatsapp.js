import twilio from 'twilio';

const accountSid = process.env.TWILIO_ACCOUNT_SID; 
const authToken = process.env.TWILIO_AUTH_TOKEN; 

const client = twilio(accountSid, authToken); 

export async function sendBookingConfirmation(phone, {customerName, serviceName, staffName, date, timeSlot, totalAmount, branch}) {
    try {
        const message = `Dear ${customerName},\nYour booking for ${serviceName} with ${staffName} on ${date} at ${timeSlot} has been confirmed. Total amount: $${totalAmount}. Branch: ${branch}.\nThank you for choosing our service.`;
        await client.messages.create({ 
            from: 'whatsapp:+14155238886',       
            body: message,
            to: `whatsapp:${phone}`
        });
    } catch (error) {
        console.log(error);
    }
}

export async function sendReminder(phone, {customerName, serviceName, date, timeSlot}) {
    try {
        const message = `Dear ${customerName},\nThis is a reminder for your booking of ${serviceName} on ${date} at ${timeSlot}.\nThank you.`;
        await client.messages.create({ 
            from: 'whatsapp:+14155238886',       
            body: message,
            to: `whatsapp:${phone}`
        });
    } catch (error) {
        console.log(error);
    }
}

export async function sendCancellation(phone, {customerName, serviceName, date, refundAmount}) {
    try {
        const message = `Dear ${customerName},\nYour booking for ${serviceName} on ${date} has been cancelled. Refund amount: $${refundAmount}.\nThank you.`;
        await client.messages.create({
            from: 'whatsapp:+14155238886',
            body: message,
            to: `whatsapp:${phone}`
        });
    } catch (error) {
        console.log(error);
    }
}

export async function sendStaffCancellation(phone, { customerName, serviceName, date, timeSlot }) {
    try {
        const message = `Dear ${customerName},\n\nWe regret to inform you that your *${serviceName}* appointment on *${date}* at *${timeSlot}* has been cancelled by our team.\n\nPlease contact us to reschedule at your earliest convenience.\n\n— La Maison Salon 💛`;
        await client.messages.create({
            from: 'whatsapp:+14155238886',
            body: message,
            to: `whatsapp:${phone}`,
        });
    } catch (error) {
        console.error('[WhatsApp] sendStaffCancellation failed:', error.message);
    }
}