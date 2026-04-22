import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import routes from './routes/index.js';
import logger from './utils/logger.js';
import { requestId, httpLogger } from './middleware/logging.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();

app.set('trust proxy', 1);

// Middleware
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(requestId);   // attach req.requestId before logging
app.use(httpLogger);  // structured HTTP logs → logs/combined-*.log

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Routes
app.use('/api/v1', routes);

// Serve frontend static files
app.use(express.static(join(__dirname, 'public')));

// SPA fallback — all non-API routes serve index.html
app.get('*', (req, res) => {
  res.sendFile(join(__dirname, 'public', 'index.html'));
});

// 404 handler (API only — reached if above SPA route not matched)
app.use((req, res, next) => {
  const error = new Error('Not found');
  error.status = 404;
  next(error);
});

// Error handler
app.use((err, req, res, next) => {
  const status = err.status || 500;
  if (status >= 500) {
    logger.error('Unhandled error', {
      requestId: req.requestId,
      status,
      error: err.message,
      stack: err.stack,
    });
  }
  res.status(status).json({ error: err.message || 'Internal Server Error' });
});

export default app;