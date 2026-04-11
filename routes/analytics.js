import express from 'express';
import {
  getRevenueAnalytics,
  getAppointmentAnalytics,
  getStaffCommission,
  getTopServices,
  getCustomerSummary,
} from '../controllers/analyticsController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticate);

router.get('/revenue', getRevenueAnalytics);
router.get('/appointments', getAppointmentAnalytics);
router.get('/staff/commission', authorize('owner', 'admin', 'manager'), getStaffCommission);
router.get('/top-services', getTopServices);
router.get('/customers/summary', getCustomerSummary);

export default router;