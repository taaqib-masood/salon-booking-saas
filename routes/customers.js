import express from 'express';
import { getCustomers, getCustomerById, getAppointmentsByCustomerId, updateCustomerProfile, deleteCustomer, getLoyaltyBalance } from '../controllers/customersController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticate);

router.get('/', getCustomers);
router.get('/:id', getCustomerById);
router.get('/:id/appointments', getAppointmentsByCustomerId);
router.put('/:id', updateCustomerProfile);
router.delete('/:id', authorize('owner', 'admin'), deleteCustomer);
router.get('/:id/loyalty', getLoyaltyBalance);

export default router;