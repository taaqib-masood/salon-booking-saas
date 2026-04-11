import express from 'express';
import os from 'os';
import { supabase } from '../lib/supabase.js';

const router = express.Router();

router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: Date.now(),
  });
});

router.get('/ready', async (req, res) => {
  try {
    // Ping Supabase instead of Mongoose
    const { error } = await supabase.from('tenants').select('id').limit(1);
    if (error) throw error;
    res.status(200).json({ status: 'ready' });
  } catch (err) {
    console.error('Readiness check failed:', err.message);
    res.status(503).json({ status: 'not ready', error: err.message });
  }
});

router.get('/health/version', async (req, res) => {
  const { createRequire } = await import('module');
  const require = createRequire(import.meta.url);
  const pkg = require('../package.json');
  res.status(200).json({ version: pkg.version });
});

export default router;