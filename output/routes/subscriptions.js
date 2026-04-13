import express from 'express';
import stripe from 'stripe';
import { TenantSubscription } from '../models/tenantSubscription.js';
import { Plan } from '../models/plan.js';

const router = express.Router();

router.post('/upgrade', async (req, res) => {
  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: { name: req.body.planName },
          unit_amount: req.body.price * 100, // convert to cents
        },
        quantity: 1,
      }],
      mode: 'subscription',
      success_url: `${req.headers.origin}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.origin}/canceled`,
    });

    res.json({ checkoutUrl: session.url });
  } catch (error) {
    console.log(error);
    res.status(500).send('Server Error');
  }
});

router.post('/webhook', async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    res.status(400).send(`Webhook Error: ${err.message}`);
    return;
  }

  switch (event.type) {
    case 'customer.subscription.updated':
      // update TenantSubscription accordingly
      break;
    case 'customer.subscription.deleted':
      // update TenantSubscription accordingly
      break;
    case 'invoice.paid':
      // update TenantSubscription accordingly
      break;
    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  res.json({ received: true });
});

router.get('/plans', async (req, res) => {
  try {
    const plans = await Plan.find();
    res.json(plans);
  } catch (error) {
    console.log(error);
    res.status(500).send('Server Error');
  }
});

export default router;