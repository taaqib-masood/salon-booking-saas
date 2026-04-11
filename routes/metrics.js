import express from 'express';
import { getMetrics } from '../controllers/metricsController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// GET /metrics — protected by METRICS_TOKEN or staff auth
router.get('/', authenticate, getMetrics);

export default router;