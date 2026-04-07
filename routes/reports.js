```javascript
import express from 'express';
const router = express.Router();

// Import your controllers here
import { createReportController, listReportsController, getReportStatusController, downloadReportController, deleteReportController, scheduleAutoEmailsController } from '../controllers/reports.js';

router.post('/', createReportController);

router.get('/', listReportsController);

router.get('/:id', getReportStatusController);

router.get('/:id/download', downloadReportController);

router.delete('/:id', deleteReportController);

router.post('/schedule', scheduleAutoEmailsController);

export default router;
```