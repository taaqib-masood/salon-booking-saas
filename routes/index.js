import express from 'express';

import authRouter from './auth.js';
import appointmentsRouter from './appointments.js';
import branchesRouter from './branches.js';
import staffRouter from './staff.js';
import servicesRouter from './services.js';
import customersRouter from './customers.js';
import analyticsRouter from './analytics.js';
import offersRouter from './offers.js';
import loyaltyRouter from './loyalty.js';
import packagesRouter from './packages.js';
import paymentsRouter from './payments.js';
import tenantsRouter from './tenants.js';
import healthRouter from './health.js';
import metricsRouter from './metrics.js';
import reportsRouter from './reports.js';
import notificationsRouter from './notifications.js';
import reviewsRouter from './reviews.js';
import posRouter from './pos.js';
import webhooksRouter from './webhooks.js';
import subscriptionsRouter from './subscriptions.js';
import gdprRouter from './gdpr.js';
import privacyRouter from './privacy.js';
import categoriesRouter from './categories.js';
import twilioRouter from './twilio.js';
import calendarRouter from './calendar.js';
import availabilityRouter from './availability.js';
import staffSchedulesRouter from './staffSchedules.js';
import staffBreaksRouter from './staffBreaks.js';

const router = express.Router();

// Public
router.use('/auth', authRouter);
router.use('/', healthRouter);
router.use('/twilio', twilioRouter);

// Core operations
router.use('/branches', branchesRouter);
router.use('/staff', staffRouter);
router.use('/services', servicesRouter);
router.use('/categories', categoriesRouter);
router.use('/appointments', appointmentsRouter);
router.use('/customers', customersRouter);
router.use('/calendar', calendarRouter);
router.use('/availability', availabilityRouter);
router.use('/staff-schedules', staffSchedulesRouter);
router.use('/staff-breaks', staffBreaksRouter);

// Business features
router.use('/offers', offersRouter);
router.use('/loyalty', loyaltyRouter);
router.use('/packages', packagesRouter);
router.use('/pos', posRouter);
router.use('/reviews', reviewsRouter);

// Finance & reporting
router.use('/payments', paymentsRouter);
router.use('/subscriptions', subscriptionsRouter);
router.use('/analytics', analyticsRouter);
router.use('/reports', reportsRouter);
router.use('/notifications', notificationsRouter);

// SaaS management
router.use('/tenants', tenantsRouter);
router.use('/webhooks', webhooksRouter);
router.use('/metrics', metricsRouter);
router.use('/gdpr', gdprRouter);
router.use('/privacy', privacyRouter);

export default router;
