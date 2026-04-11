import express from 'express';
import { getTerminals, createTerminal, updateTerminal, deleteTerminal } from '../controllers/posController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticate);

router.get('/terminals',          getTerminals);
router.post('/terminals',         authorize('owner', 'admin'), createTerminal);
router.put('/terminals/:id',      authorize('owner', 'admin'), updateTerminal);
router.delete('/terminals/:id',   authorize('owner', 'admin'), deleteTerminal);

export default router;