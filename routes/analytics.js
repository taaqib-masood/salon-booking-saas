import express from 'express';
import {
  getRevenueAnalytics,
  getAppointmentAnalytics,
  getStaffCommission,
  getTopServices,
  getCustomerSummary,
  getStaffPerformance,
  getGuestConversion,
  getAIPerformance,
} from '../controllers/analyticsController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticate);

router.get('/revenue', getRevenueAnalytics);
router.get('/appointments', getAppointmentAnalytics);
router.get('/staff/commission', authorize('owner', 'admin', 'manager'), getStaffCommission);
router.get('/top-services', getTopServices);
router.get('/customers/summary',    getCustomerSummary);
router.get('/staff/performance',    authorize('owner', 'admin', 'manager'), getStaffPerformance);
router.get('/guest-conversion',     authorize('owner', 'admin', 'manager'), getGuestConversion);
router.get('/ai-performance',       authorize('owner', 'admin', 'manager'), getAIPerformance);

export default router;