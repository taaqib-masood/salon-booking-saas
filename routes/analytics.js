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

router.use(authenticate, authorize('owner', 'admin', 'manager'));

router.get('/revenue', getRevenueAnalytics);
router.get('/appointments', getAppointmentAnalytics);
router.get('/staff/commission', getStaffCommission);
router.get('/top-services', getTopServices);
router.get('/customers/summary', getCustomerSummary);
router.get('/staff/performance', getStaffPerformance);
router.get('/guest-conversion', getGuestConversion);
router.get('/ai-performance', getAIPerformance);

export default router;