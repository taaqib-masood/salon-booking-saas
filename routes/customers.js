import express from 'express';
import { getCustomers, getCustomerById, getAppointmentsByCustomerId, updateCustomerProfile, deleteCustomer, getLoyaltyBalance } from '../controllers/customersController.js';

const router = express.Router();

router.get('/', getCustomers);
router.get('/:id', getCustomerById);
router.get('/:id/appointments', getAppointmentsByCustomerId);
router.put('/:id', updateCustomerProfile);
router.delete('/:id', deleteCustomer);
router.get('/:id/loyalty', getLoyaltyBalance);

export default router;