import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { stripe, webhookSecret } from '../config/stripe.js';
import Appointment from '../models/Appointment.js';
import crypto from 'crypto';

const router = express.Router();

router.post('/payments/intent', authenticate, async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.body.appointmentId);
    
    if (!appointment) return res.status(404).send({ error: 'Appointment not found' });
  
    const paymentIntent = await stripe.paymentIntents.create({
      amount: appointment.price * 100, // Convert to cents
      currency: 'aed',
      metadata: { integration_check: 'accept_a_payment' },
    });
  
    res.send({ clientSecret: paymentIntent.client_secret });
  } catch (error) {
    console.log(error);
    res.status(500).send({ error: 'Failed to create Payment Intent' });
  }
});

router.post('/payments/webhook', express.raw({ type: 'application/json' }), (req, res) => {
  const sig = req.headers['stripe-signature'];
  
  let event;
  
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err) {
    res.status(400).send({ error: `Webhook Error: ${err.message}` });
    return;
  }
  
  if (event.type === 'payment_intent.succeeded') {
    const appointment = await Appointment.findOneAndUpdate(
      { stripePaymentId: event.data.object.id },
      { paymentStatus: 'paid' },
      { new: true }
    );
    
    if (!appointment) return res.status(404).send({ error: 'Appointment not found' });
  }
  
  res.json({ received: true });
});

router.post('/payments/refund', authenticate, async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.body.appointmentId);
    
    if (!appointment) return res.status(404).send({ error: 'Appointment not found' });
  
    const refund = await stripe.refunds.create({
      charge: appointment.stripePaymentId,
    });
  
    res.send({ refund });
  } catch (error) {
    console.log(error);
    res.status(500).send({ error: 'Failed to create Refund' });
  }
});

export default router;