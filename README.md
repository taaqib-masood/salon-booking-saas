# La Maison — Salon Booking SaaS

[![Node.js](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](https://nodejs.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Deployed on Render](https://img.shields.io/badge/deployed-Render-46E3B7)](https://render.com)

A full-stack, production-ready SaaS platform built for premium salons in the UAE. Covers everything from online booking and staff scheduling to AI-powered WhatsApp lead conversion and UAE PDPL compliance.

---

## Table of Contents

- [Tech Stack](#tech-stack)
- [Features](#features)
- [How It Generates Revenue for Salons](#how-it-generates-revenue-for-salons)
- [Local Setup](#local-setup)
- [Environment Variables](#environment-variables)
- [Project Structure](#project-structure)

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Node.js 18+, Express (ES Modules) |
| Database | Supabase (PostgreSQL + RLS) |
| Frontend | React 17, Vite, Tailwind CSS |
| Queue / Jobs | BullMQ + Upstash Redis |
| AI Concierge | Groq API (`llama-4-scout-17b`) |
| WhatsApp | Twilio Messaging API |
| File Storage | Cloudinary (images), Supabase Storage (backups) |
| Auth | JWT + bcrypt |
| Logging | Winston + DailyRotateFile |
| Deployment | Render.com |

---

## Features

### 1. Multi-Tenant Architecture
Every salon operates in complete isolation. A single deployment serves multiple salon brands — each with their own staff, services, branches, customers, and settings. Tenant-level Row Level Security is enforced at the database layer via Supabase RLS policies.

### 2. Online Booking Flow
Customers browse services with real photos (hosted on Cloudinary), select a stylist from a live staff directory, pick an available time slot, and confirm — all without creating an account. Guest bookings capture name and phone only. Registered customers get a full history and loyalty tracking.

- Dynamic slot generation based on service duration
- Real-time conflict detection (no double-bookings)
- VAT (5% UAE) calculated automatically
- Booking confirmation page with iCal download

### 3. WhatsApp AI Concierge (Leila)
An AI booking agent built on Groq's LLaMA 4 model that handles the full booking conversation over WhatsApp — 24/7, responding in under 1 minute.

- Understands natural language ("I want a facial on Thursday afternoon")
- Checks live staff availability via tool calling
- Creates confirmed appointments directly in the database
- Maintains per-customer conversation history
- Sends booking confirmation with full price breakdown

### 4. Lead Qualification Engine
Every incoming WhatsApp message is classified in real-time using Groq:

- **Intent**: `booking` / `enquiry` / `other`
- **Lead score**: `hot` (ready now) / `warm` (interested) / `cold` (browsing)

Hot leads trigger an instant WhatsApp alert to the salon owner:
```
🔥 HOT LEAD — Likely to book today
Customer: +971...
Message: "I want to book a facial for tomorrow"
Reply within 5 minutes for best chance to convert.
```
All interactions are stored in `lead_interactions` for conversion analysis.

### 5. Automated Follow-Up System
BullMQ-powered follow-up jobs that run without any manual intervention:

- **24h Enquiry Follow-up** — if a customer asked about services but didn't book, Leila follows up 24 hours later
- **No-Show Re-engagement** — 30 minutes after a missed appointment, sends a reschedule offer and marks the appointment `no_show`
- **Anti-spam guards** — 48-hour cooldown per customer, skips if they already replied or booked

### 6. Upsell Engine
After every confirmed booking, a delayed WhatsApp message (3–5 seconds) suggests a complementary add-on:

| Booked | Upsell |
|--------|--------|
| Blowout / Haircut | Beard Trim — AED 50 |
| Facial | Hydrafacial Boost — AED 150 |
| Manicure | Classic Pedicure — AED 80 |
| Balayage / Color | Olaplex Treatment — AED 120 |

Rules live in `config/upsells.js` — add new rules without touching any other file.

### 7. Conversion Tracking
Every booking made through the AI concierge is linked back to its originating lead interaction:

- Which leads converted and which didn't
- Revenue generated directly from AI bookings (in AED)
- Bookings recovered via follow-up (would-have-been-lost)

### 8. AI Performance Dashboard
A client-facing dashboard at `/admin/ai-performance` showing the business impact in money terms:

- **AI Generated Revenue (AED)** — sum of all bookings originating from WhatsApp AI
- **Recovered Bookings** — enquiries converted only after a follow-up
- **Hot Leads Pending** — actionable count with direct WhatsApp link
- **Conversion Rate** — total leads vs confirmed bookings
- **Avg Response Time** — Instant (< 1 min, 24/7)
- 7d / 30d / 90d period toggle

### 9. Staff Management
- Full CRUD with photo upload (Cloudinary)
- Roles: `owner` / `admin` / `manager` / `stylist` / `receptionist`
- Weekly schedule management (per-day open/close times)
- Break management — admin can add breaks for any stylist
- Performance analytics per staff member (revenue, completion rate, commission)

### 10. Service & Category Management
- Services organised by category
- Per-service: name (EN + AR), price, duration, image, description
- Visibility toggle (hide without deleting)
- Images hosted on Cloudinary CDN

### 11. Appointment Management
- Full calendar view in the admin dashboard (react-big-calendar)
- Filter by staff member
- Status workflow: `pending` → `confirmed` → `completed` / `cancelled` / `no_show`
- Appointment notes (internal)
- Inline reschedule and cancellation

### 12. Customer Management & Loyalty
- Customer profiles with full appointment history
- Loyalty points — earn on every visit, redeem against bookings
- Loyalty transaction log per customer
- Guest-to-registered conversion tracking

### 13. POS & Payments
- In-person POS checkout with service + add-on line items
- Discount application (fixed or %)
- VAT calculation (5% UAE) on all transactions
- Payment method recording (cash, card, online)

### 14. Packages & Offers
- Bundle services into packages (e.g. "Bridal Package — 5 services")
- Time-limited promotional offers with discount rules
- Package redemption tracked against bookings

### 15. Analytics & Reporting
- Revenue analytics (gross, net, VAT, avg ticket)
- Appointment analytics (by status, by branch)
- Staff commission reports
- Top services by revenue
- Customer summary (new vs returning, lifetime value)
- Guest conversion funnel
- AI performance metrics (conversion rate, recovered bookings, AED generated)

### 16. Notification System
- WhatsApp appointment reminders (configurable hours before, per tenant)
- Daily summary report to owner at end of business day
- Hot lead alerts in real-time
- BullMQ retry queues with exponential backoff (5 attempts, max ~52 min)
- Dead Letter Queue for permanently failed jobs

### 17. Tenant Settings
Owners configure everything from the dashboard without touching code:

- Salon name, logo, address, contact phone
- Brand colour
- Working hours (per day of week)
- Cancellation policy text
- Reminder timing

### 18. Webhooks
Outbound webhooks on appointment events (`created`, `updated`, `cancelled`), with retry logic built-in.

### 19. Subscriptions
SaaS subscription management — plan tiers, billing status, feature gating per tenant.

### 20. Reviews
Post-appointment review collection and display.

### 21. GDPR / UAE PDPL Compliance
- AES-256-GCM encryption on all customer PII (name, phone, email) at rest
- Deterministic encryption for searchable fields (phone, email)
- GDPR data export endpoint
- Right-to-erasure via customer anonymisation
- Privacy policy API endpoint
- Data residency verification: `node scripts/verify-data-residency.js`
- 7-day automated backup to Supabase Storage with auto-pruning

### 22. Security
- Helmet.js security headers
- Rate limiting (express-rate-limit + Redis store)
- JWT with role-based authorisation
- Input validation via express-validator
- Request ID tracing (`X-Request-Id` header)
- Phone numbers masked in all log output

### 23. Logging & Observability
- Winston structured logging, daily rotation (30-day retention, 20MB max)
- Per-module child loggers
- Prometheus metrics at `/api/v1/metrics`
- Health check at `/api/v1/health`

### 24. Automated Backups
Daily backup job at 2AM Dubai time exports all tables to Supabase Storage:

- Folder: `backups/YYYY-MM-DD/table.json`
- Manifest file per backup
- Auto-prunes backups older than 7 days
- Manual trigger: `node cron/backup.js`

---

## How It Generates Revenue for Salons

### Direct Revenue Uplift

| Feature | Revenue Mechanism |
|---------|------------------|
| **AI Concierge (24/7)** | Captures bookings at 2AM when the salon is closed. Zero missed leads. |
| **Lead Follow-up** | Converts enquiries that would have been forgotten. 8–15% of cold enquiries convert on follow-up. |
| **Upsell Engine** | Adds AED 50–150 per booking on average via post-confirmation WhatsApp suggestions. |
| **No-Show Re-engagement** | Reschedules missed appointments instead of losing them permanently. |
| **Hot Lead Alerts** | Owner responds within 5 minutes to highest-intent customers — significantly higher close rate than delayed response. |

### Operational Cost Reduction

| Feature | Cost Saving |
|---------|------------|
| **24/7 AI receptionist** | Eliminates the need for dedicated booking staff on evenings and weekends. |
| **Automated reminders** | Reduces no-shows by 20–40% (industry average). Each recovered slot is direct revenue. |
| **Online booking** | Cuts phone booking overhead. Staff focus on in-salon service, not admin. |
| **Automated daily summary** | Owner stays informed without manual reporting time. |

### Retention & Lifetime Value

| Feature | Retention Mechanism |
|---------|-------------------|
| **Loyalty programme** | Points incentivise repeat visits and increase visit frequency. |
| **Personalised follow-ups** | Customers feel remembered — higher rebooking rate. |
| **Review collection** | Social proof drives new customer acquisition. |

### SaaS Revenue (for the platform owner)

- Multi-tenant subscription model — each salon pays monthly
- Tiered plans can gate features (e.g. AI concierge on premium plan only)
- Low marginal cost per new tenant on shared infrastructure

---

## Local Setup

### Prerequisites

- Node.js 18+
- npm 9+
- Supabase project (free tier works)
- Twilio account with WhatsApp sandbox
- Upstash Redis instance (free tier, Mumbai region recommended)
- Groq API key (free tier)

### Step 1 — Clone and install backend dependencies

```bash
git clone https://github.com/taaqib-masood/salon-booking-saas.git
cd salon-booking-saas
npm install
```

### Step 2 — Configure environment variables

```bash
cp .env.example .env
# Fill in your credentials — see Environment Variables section below
```

### Step 3 — Start the backend

```bash
node server.js
```

You should see:
```
[Redis] Connected
[Server] Running on port 3000
[Cron] Reminder job started
[Cron] Daily summary job started
[Cron] Backup job started (2AM Dubai time)
```

### Step 4 — Start the frontend

Open a second terminal:

```bash
cd frontend
npm install
npm run dev
```

Vite starts at `http://localhost:5173`

### Step 5 — Open the app

| URL | Page |
|-----|------|
| `http://localhost:5173` | Public booking page |
| `http://localhost:5173/login` | Staff / admin login |
| `http://localhost:5173/admin` | Admin dashboard |
| `http://localhost:5173/admin/ai-performance` | AI performance dashboard |

### Step 6 — Verify PII encryption and data residency (optional)

```bash
node scripts/verify-data-residency.js
```

### Step 7 — Run a manual backup (optional)

```bash
node cron/backup.js
```

---

## Environment Variables

```env
# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_ANON_KEY=your-anon-key

# Auth
JWT_SECRET=your-jwt-secret-min-32-chars
JWT_EXPIRES_IN=7d

# Server
PORT=3000
NODE_ENV=development

# Redis (Upstash)
REDIS_URL=rediss://default:password@host.upstash.io:6379

# Twilio WhatsApp
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your-auth-token
TWILIO_WHATSAPP_FROM=whatsapp:+14155238886

# Groq (AI concierge)
GROQ_API_KEY=gsk_xxxxxxxxxxxxxxxxxxxx

# Cloudinary (service images)
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# PII Encryption — AES-256-GCM
# Generate: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
# WARNING: never change this after data has been encrypted
ENCRYPTION_KEY=64-char-hex-string

# App
APP_URL=http://localhost:3000
PRIVACY_CONTACT_EMAIL=privacy@yoursalon.ae
VAT_RATE=0.05
```

---

## Project Structure

```
salon-booking-saas/
├── controllers/          # Route handlers
├── cron/                 # Scheduled jobs (reminders, daily summary, backup)
├── config/               # Static config (upsell rules)
├── frontend/             # React + Vite frontend
│   └── src/
│       ├── pages/        # AdminDashboard, BookingFlow, AIPerformancePage, ...
│       ├── services/     # Axios API client
│       └── contexts/     # Auth, Lang
├── lib/                  # Supabase client, tenant defaults
├── middleware/           # Auth, logging, rate limiting
├── routes/               # Express routers
├── scripts/              # One-time migration and utility scripts
├── services/             # Business logic (customer PII, lead qualification)
├── utils/                # Logger, Redis, BullMQ queues, encryption
└── workers/              # BullMQ workers (WhatsApp, follow-up, dead letter)
```
