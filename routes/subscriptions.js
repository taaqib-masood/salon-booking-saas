import express from 'express';
import { supabase } from '../lib/supabase.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

// POST /subscriptions/upgrade — create Stripe checkout session for plan upgrade
router.post('/upgrade', authenticate, authorize('owner', 'admin'), async (req, res) => {
  try {
    const { default: Stripe } = await import('stripe');
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

    const { planName, price } = req.body;

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: { name: planName },
          unit_amount: price * 100,
        },
        quantity: 1,
      }],
      mode: 'subscription',
      success_url: `${req.headers.origin}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.origin}/canceled`,
      metadata: { tenant_id: req.staff.tenant_id },
    });

    res.json({ checkoutUrl: session.url });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error creating checkout session' });
  }
});

// POST /subscriptions/webhook — Stripe webhook for subscription events
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

    const tenantId = event.data.object?.metadata?.tenant_id;

    switch (event.type) {
      case 'customer.subscription.updated':
      case 'invoice.paid':
        if (tenantId) {
          await supabase
            .from('tenant_subscriptions')
            .update({ status: 'active' })
            .eq('tenant_id', tenantId)
            .order('created_at', { ascending: false })
            .limit(1);
        }
        break;
      case 'customer.subscription.deleted':
        if (tenantId) {
          await supabase
            .from('tenant_subscriptions')
            .update({ status: 'cancelled' })
            .eq('tenant_id', tenantId)
            .order('created_at', { ascending: false })
            .limit(1);
        }
        break;
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Webhook handling failed' });
  }
});

// GET /subscriptions/plans — list available plans (static for now)
router.get('/plans', (req, res) => {
  res.json([
    { id: 'free',       name: 'Free',       price: 0,   branches: 1,  staff: 5,   features: ['Basic booking', 'WhatsApp alerts'] },
    { id: 'growth',     name: 'Growth',     price: 99,  branches: 3,  staff: 20,  features: ['Everything in Free', 'Analytics', 'Loyalty'] },
    { id: 'enterprise', name: 'Enterprise', price: 299, branches: 999, staff: 999, features: ['Everything in Growth', 'Custom domain', 'Priority support'] },
  ]);
});

export default router;