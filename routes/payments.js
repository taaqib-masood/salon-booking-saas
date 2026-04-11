import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { supabase } from '../lib/supabase.js';

const router = express.Router();

// POST /payments/intent — create Stripe payment intent for an appointment
router.post('/intent', authenticate, async (req, res) => {
  try {
    const { default: Stripe } = await import('stripe');
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

    const { appointmentId } = req.body;
    const { data: appointment, error } = await supabase
      .from('appointments')
      .select('id, total_amount, tenant_id')
      .eq('id', appointmentId)
      .eq('tenant_id', req.staff.tenant_id)
      .single();

    if (error || !appointment) return res.status(404).json({ error: 'Appointment not found' });

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(appointment.total_amount * 100), // AED to fils
      currency: 'aed',
      metadata: { appointment_id: appointmentId, tenant_id: appointment.tenant_id },
    });

    // Store payment intent id on the appointment
    await supabase
      .from('appointments')
      .update({ stripe_payment_id: paymentIntent.id })
      .eq('id', appointmentId);

    res.json({ clientSecret: paymentIntent.client_secret });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create Payment Intent' });
  }
});

// POST /payments/webhook — Stripe webhook handler
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    const { default: Stripe } = await import('stripe');
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

    const sig = req.headers['stripe-signature'];
    let event;

    try {
      event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
    } catch (err) {
      return res.status(400).json({ error: `Webhook Error: ${err.message}` });
    }

    if (event.type === 'payment_intent.succeeded') {
      const paymentIntentId = event.data.object.id;
      await supabase
        .from('appointments')
        .update({ payment_status: 'paid' })
        .eq('stripe_payment_id', paymentIntentId);
    }

    res.json({ received: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Webhook handling failed' });
  }
});

// POST /payments/refund
router.post('/refund', authenticate, async (req, res) => {
  try {
    const { default: Stripe } = await import('stripe');
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

    const { appointmentId } = req.body;
    const { data: appointment, error } = await supabase
      .from('appointments')
      .select('stripe_payment_id, tenant_id')
      .eq('id', appointmentId)
      .eq('tenant_id', req.staff.tenant_id)
      .single();

    if (error || !appointment) return res.status(404).json({ error: 'Appointment not found' });
    if (!appointment.stripe_payment_id) return res.status(400).json({ error: 'No payment on record' });

    const refund = await stripe.refunds.create({ payment_intent: appointment.stripe_payment_id });

    await supabase
      .from('appointments')
      .update({ payment_status: 'refunded' })
      .eq('id', appointmentId);

    res.json({ refund });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create Refund' });
  }
});

export default router;