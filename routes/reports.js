import express from 'express';
import { createReport, getReports, getReportById, updateReportStatus } from '../controllers/reports.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticate);

router.post('/',    authorize('owner', 'admin', 'manager'), createReport);
router.get('/',     getReports);
router.get('/:id',  getReportById);
router.patch('/:id/status', authorize('owner', 'admin'), updateReportStatus);

export default router;