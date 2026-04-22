import express from 'express';
import { supabase } from '../lib/supabase.js';

const router = express.Router();

// GET /privacy — UAE PDPL compliant privacy policy
router.get('/', (req, res) => {
  res.json({
    policy: {
      last_updated:    '2026-04-01',
      jurisdiction:    'UAE — Federal Decree-Law No. 45 of 2021 (PDPL)',
      data_controller: 'La Maison Salon',
      contact_email:   process.env.PRIVACY_CONTACT_EMAIL || 'privacy@lamaison.ae',

      data_collected: [
        'Full name',
        'Phone number (WhatsApp-capable)',
        'Email address',
        'Appointment history',
        'Service preferences',
        'Loyalty points balance',
      ],

      purpose: [
        'Booking management and confirmation',
        'Appointment reminders via WhatsApp',
        'Loyalty rewards tracking',
        'Service personalization',
      ],

      retention: {
        active_customers:   'Duration of relationship + 3 years',
        appointment_records:'7 years (UAE commercial law requirement)',
        deleted_customers:  'Anonymized immediately upon deletion request',
      },

      data_residency: {
        primary:  'Supabase (managed PostgreSQL)',
        region:   process.env.SUPABASE_REGION || 'Middle East / Europe — verify at dashboard.supabase.com',
        transfers:'No cross-border transfers without explicit consent',
      },

      subject_rights: {
        access:     'POST /api/v1/gdpr/export',
        deletion:   'DELETE /api/v1/gdpr/delete',
        correction: 'PUT /api/v1/customers/:id',
        portability:'Data exported as JSON on request',
      },

      security_measures: [
        'HTTPS/TLS 1.3 in transit (Render auto-SSL)',
        'AES-256-GCM encryption at rest for PII fields',
        'JWT authentication on all staff endpoints',
        'Role-based access control (owner/admin/manager/stylist)',
        'Automated daily backups with 7-day retention',
        'Phone numbers masked in application logs',
      ],

      cookies: 'No tracking cookies. Session tokens stored in localStorage.',
    },
  });
});

// GET /privacy/data-residency — verify where data is stored
router.get('/data-residency', async (req, res) => {
  try {
    const url = process.env.SUPABASE_URL || '';
    // Supabase project refs encode region info
    const projectRef = url.replace('https://', '').split('.')[0];

    res.json({
      supabase_project: projectRef,
      supabase_url:     url,
      upstash_redis:    (process.env.REDIS_URL || '').includes('upstash.io')
        ? 'Upstash — ' + (process.env.REDIS_URL?.match(/@(.+?)\.upstash/)?.[1] || 'unknown host')
        : 'localhost (development)',
      render_region:    process.env.RENDER_REGION || 'Check Render dashboard → Service settings → Region',
      compliance_note:  'Verify Supabase project region at: https://supabase.com/dashboard/project/' + projectRef + '/settings/general',
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
