import express from 'express';
import { supabase } from '../lib/supabase.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

const PLANS = [
  { id: 'free',       name: 'Free',       price: 0,   branches: 1,  staff: 5,   features: ['Basic booking', 'WhatsApp alerts'] },
  { id: 'growth',     name: 'Growth',     price: 99,  branches: 3,  staff: 20,  features: ['Everything in Free', 'Analytics', 'Loyalty'], stripePriceEnv: 'STRIPE_PRICE_GROWTH' },
  { id: 'enterprise', name: 'Enterprise', price: 299, branches: 999, staff: 999, features: ['Everything in Growth', 'Custom domain', 'Priority support'], stripePriceEnv: 'STRIPE_PRICE_ENTERPRISE' },
];

const stripePriceFor = (plan) => plan?.stripePriceEnv && process.env[plan.stripePriceEnv];
const planForStripePrice = (priceId) => priceId && PLANS.find(p => stripePriceFor(p) === priceId);

// POST /subscriptions/upgrade — create Stripe checkout session for plan upgrade
router.post('/upgrade', authenticate, authorize('owner', 'admin'), async (req, res) => {
  try {
    const plan = PLANS.find(p => p.id === req.body?.planId);
    const priceId = stripePriceFor(plan);
    if (!priceId) return res.status(400).json({ error: 'Unknown or unavailable plan' });
    if (!process.env.APP_URL) return res.status(500).json({ error: 'APP_URL is not configured' });

    const { default: Stripe } = await import('stripe');
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    const metadata = { tenant_id: req.staff.tenant_id, plan_id: plan.id };
    const appUrl = process.env.APP_URL.replace(/\/+$/, '');

    const session = await stripe.checkout.sessions.create({
      line_items: [{ price: priceId, quantity: 1 }],
      mode: 'subscription',
      success_url: `${appUrl}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/canceled`,
      metadata,
      subscription_data: { metadata },
    });

    res.json({ checkoutUrl: session.url });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error creating checkout session' });
  }
});

// POST /subscriptions/webhook — Stripe webhook for subscription events
// Raw body is parsed in app.js before express.json() so the signature can be verified.
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

    // Subscription events carry the server-set metadata and the price actually subscribed to.
    const subscription = event.data.object;
    const tenantId = subscription?.metadata?.tenant_id;
    const latestSubscription = (update) => supabase
      .from('tenant_subscriptions')
      .update(update)
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })
      .limit(1);

    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const plan = planForStripePrice(subscription.items?.data?.[0]?.price?.id);
        if (!tenantId || !plan) {
          console.warn(`Ignoring ${event.type}: unknown tenant or price`);
          break;
        }
        if (subscription.status === 'active' || subscription.status === 'trialing') {
          await latestSubscription({ plan: plan.id, status: subscription.status });
        }
        break;
      }
      case 'customer.subscription.deleted':
        if (tenantId) await latestSubscription({ status: 'cancelled' });
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
  res.json(PLANS.map(({ stripePriceEnv, ...plan }) => plan));
});

export default router;