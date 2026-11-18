import express from 'express';
import rateLimit from 'express-rate-limit';
const router = express.Router();

// Import your controllers here
import { createAppointment, publicCreateAppointment, getAllAppointments, getOneAppointment, updateStatus, rescheduleAppointment, cancelAppointment, getMyAppointments } from '../controllers/appointmentsController.js';
import { authenticate, authenticateCustomer } from '../middleware/auth.js';
import notesRouter from './appointmentNotes.js';

// Public: customer-facing booking (no staff auth required)
const bookLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many booking attempts, please try again later.' },
});
router.post('/book', bookLimiter, (req, res, next) => req.body.customer_id
  ? authenticateCustomer(req, res, next) : next(), publicCreateAppointment);

// Customer-facing: own appointments (must be before /:id)
router.get('/my', authenticateCustomer, getMyAppointments);

router.post('/', authenticate, createAppointment);
router.get('/', authenticate, getAllAppointments);
router.get('/:id', authenticate, getOneAppointment);
router.patch('/:id/status', authenticate, updateStatus);
router.post('/:id/reschedule', authenticate, rescheduleAppointment);
router.delete('/:id', authenticate, cancelAppointment);

// Nested: appointment notes
router.use('/:id/notes', notesRouter);

export default router;