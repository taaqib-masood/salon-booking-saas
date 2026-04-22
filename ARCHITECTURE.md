# La Maison Salon SaaS — System Architecture

## High-Level Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                         CLIENT TOUCHPOINTS                          │
├──────────────┬──────────────────┬──────────────┬────────────────────┤
│   WhatsApp   │  Booking Website │  Front Desk  │   Staff Mobile     │
│  (Customer)  │  (Public Page)   │  (POS/Admin) │   (Calendar)       │
└──────┬───────┴────────┬─────────┴──────┬───────┴────────┬───────────┘
       │                │                │                │
       ▼                ▼                ▼                ▼
┌─────────────────────────────────────────────────────────────────────┐
│                        EXPRESS API SERVER                           │
│                     Node.js  ·  Port 3000                           │
│                                                                     │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────────┐   │
│  │  /twilio │  │  /appts  │  │  /auth   │  │  /analytics      │   │
│  │  /health │  │  /staff  │  │  /cust.  │  │  /loyalty        │   │
│  │  /cal    │  │  /svcs   │  │  /gdpr   │  │  /packages       │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────────────┘   │
│                                                                     │
│  Middleware Stack:                                                  │
│  helmet → cors → rate-limit → morgan → auth → tenant → routes      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Booking Flow — WhatsApp (AI Concierge)

```
Customer WhatsApp
      │
      │  "Hi I want a facial"
      ▼
┌─────────────┐     POST /api/v1/twilio/whatsapp
│   Twilio    │────────────────────────────────────►┐
│  Sandbox    │◄───────────────────────────────────┐│
└─────────────┘     TwiML XML response             ││
                                                   ││
                              ┌────────────────────┼┘
                              │   routes/twilio.js  │
                              │                     │
                              │  conversationState  │ (in-memory per phone)
                              │         │           │
                              │         ▼           │
                              │  ┌─────────────┐   │
                              │  │  Groq API   │   │
                              │  │ llama-3.1   │   │
                              │  │ -8b-instant │   │
                              │  └──────┬──────┘   │
                              │         │           │
                              │  Tool calls?        │
                              │    ┌────┴────┐      │
                              │    │  YES    │      │
                              │    ▼         ▼      │
                              │ check_    create_   │
                              │ staff_    appoint   │
                              │ avail.    ment      │
                              │    │         │      │
                              │    ▼         ▼      │
                              │      Supabase DB    │
                              │   (appointments     │
                              │    + staff tables)  │
                              └─────────────────────┘

Leila's conversation flow:
  1. Greet customer
  2. Ask: what service?
  3. Ask: which staff / suggest one
  4. Call check_staff_availability → Supabase
  5. Confirm slot is free
  6. Ask: customer name
  7. Confirm all details back
  8. Customer says yes → call create_appointment → Supabase insert
  9. Reply with booking ID + total
```

---

## Booking Flow — Website / API

```
Customer / Staff
      │
      │  POST /appointments/book  (no auth required)
      │  { service_id, date, time_slot, name, phone }
      ▼
┌─────────────────────────────────────────┐
│     publicCreateAppointment()           │
│     controllers/appointmentsController  │
│                                         │
│  1. Validate required fields            │
│  2. Fetch service → get price+duration  │
│  3. Calculate end_time                  │
│  4. Calculate VAT (5%)                  │
│  5. Insert into appointments table      │
│     { status: 'confirmed',              │
│       is_guest: true,                   │
│       guest: { name, phone, email } }   │
└──────────────────┬──────────────────────┘
                   │
                   ▼
            Supabase DB
         appointments table
                   │
          ┌────────┴────────┐
          │                 │
          ▼                 ▼
   Calendar Feed       Reminder Cron
   (.ics auto-sync)    (fires 2h before)
```

---

## Automated Reminder Flow

```
┌─────────────────────────────────────────────────────┐
│              node-cron (every 15 min)               │
│              cron/reminders.js                      │
│                                                     │
│  1. Get current time + 2h window                   │
│  2. Query Supabase:                                 │
│     appointments WHERE                              │
│       date = today                                  │
│       AND time_slot BETWEEN now AND now+2h          │
│       AND status = 'confirmed'                      │
│       AND reminder_sent = false                     │
│                                                     │
│  3. For each appointment:                           │
│     a. Get customer phone (guest or registered)    │
│     b. Call sendReminder(phone, details)            │
│     c. UPDATE reminder_sent = true                  │
└──────────────────────┬──────────────────────────────┘
                       │
                       ▼
            utils/whatsapp.js
                       │
                       ▼
            Twilio WhatsApp API
                       │
                       ▼
         "Hi Sarah, reminder for your
          Caviar Facial at 3 PM today! 💅"
```

---

## Data Architecture (Supabase / PostgreSQL)

```
┌──────────┐    ┌──────────────┐    ┌──────────┐
│ tenants  │───►│    staff     │    │ branches │
│          │    │              │    │          │
│ id (PK)  │    │ id (PK)      │◄───│tenant_id │
│ name     │    │ tenant_id    │    │ name     │
│ plan     │    │ role         │    │ address  │
│ settings │    │ password_hash│    └──────────┘
└──────────┘    └──────────────┘
     │                │
     │         ┌──────┴───────────────────────────┐
     │         ▼                                  ▼
     │   ┌───────────────┐              ┌──────────────┐
     │   │  appointments │              │  customers   │
     │   │               │              │              │
     │   │ id (PK)       │              │ id (PK)      │
     │   │ tenant_id     │◄─────────────│ tenant_id    │
     │   │ customer_id   │              │ name         │
     │   │ staff_id      │              │ phone        │
     │   │ service_id    │              │ loyalty_pts  │
     │   │ date          │              │ total_spent  │
     │   │ time_slot     │              └──────────────┘
     │   │ end_time      │
     │   │ status        │     ┌──────────────┐
     │   │ total_amount  │     │   services   │
     │   │ vat_amount    │◄────│              │
     │   │ is_guest      │     │ id (PK)      │
     │   │ guest (JSONB) │     │ tenant_id    │
     │   │ reminder_sent │     │ name_en      │
     │   └───────────────┘     │ price        │
     │                         │ duration     │
     │                         └──────────────┘
     │
     ├──► notifications  (WhatsApp job queue status)
     ├──► loyalty_txns   (points earned/redeemed)
     ├──► offers         (promo codes)
     ├──► packages       (service bundles)
     ├──► reviews        (customer ratings)
     └──► webhooks       (outbound event config)
```

---

## Queue Architecture (BullMQ + Redis)

```
Booking Event
     │
     │  (e.g. appointment confirmed)
     ▼
┌────────────────────┐
│  WhatsApp Queue    │  (BullMQ on Redis)
│  workers/          │
│  whatsappWorker.js │
│                    │
│  Jobs:             │
│  - send_confirm    │
│  - send_reminder   │
│  - send_cancel     │
│                    │
│  Concurrency: 3    │
│  Retries: auto     │
└────────┬───────────┘
         │
         ▼
  utils/whatsapp.js
  Twilio API → Customer WhatsApp
         │
         ▼
  Update notifications
  table → status: sent/failed
```

---

## Auth Flow

```
POST /auth/staff/login
{ email, password }
         │
         ▼
   Lookup staff in
   Supabase by email
         │
         ▼
   bcrypt.compare(
     password,
     staff.password_hash
   )
         │
    ┌────┴─────┐
    │  Valid?  │
    └────┬─────┘
    YES  │  NO → 401
         ▼
   jwt.sign({
     id, tenant_id, role
   }, JWT_SECRET, 7d)
         │
         ▼
   Return token to client

─────────────────────────────

Protected Route Request:
Authorization: Bearer <token>
         │
         ▼
   authenticate middleware
   jwt.verify(token)
         │
         ▼
   Lookup staff by id
   in Supabase
         │
         ▼
   req.staff = staff
   (carries tenant_id
    for all DB queries)
         │
         ▼
   Route handler runs
   with tenant isolation
```

---

## Multi-Tenancy Model

```
                  La Maison Tenant
                  (tenant_id: 5103...)
                       │
          ┌────────────┼────────────┐
          ▼            ▼            ▼
       Staff       Services    Appointments
    (6 members)   (28 items)   (all bookings)

                  Another Salon Tenant
                  (tenant_id: 24f28...)
                       │
          ┌────────────┼────────────┐
          ▼            ▼            ▼
       Staff       Services    Appointments
    (different)   (different)  (isolated)

Every Supabase query includes:
  .eq('tenant_id', req.staff.tenant_id)

→ Complete data isolation between salons
→ Same codebase serves unlimited tenants
```

---

## Deployment Architecture (Render)

```
┌──────────────────────────────────────────────┐
│              render.yaml                     │
│                                              │
│  ┌─────────────────────┐  ┌───────────────┐ │
│  │  Web Service        │  │  Redis        │ │
│  │  salon-booking-api  │  │  salon-redis  │ │
│  │  node server.js     │  │  (BullMQ)     │ │
│  │  Port 3000          │◄─│  allkeys-lru  │ │
│  │  Free tier          │  │  Free tier    │ │
│  └──────────┬──────────┘  └───────────────┘ │
│             │                                │
└─────────────┼────────────────────────────────┘
              │
              ▼
    External Services:
    ┌──────────────┐  ┌──────────┐  ┌────────┐
    │   Supabase   │  │  Twilio  │  │  Groq  │
    │  PostgreSQL  │  │ WhatsApp │  │  LLM   │
    │  Free tier   │  │ Sandbox  │  │  Free  │
    └──────────────┘  └──────────┘  └────────┘

Monthly cost to run: ~$0
```

---

## Request Lifecycle (Every API Call)

```
Client Request
     │
     ▼
helmet()          → Security headers (XSS, HSTS, etc.)
     │
     ▼
cors()            → Allow frontend origin
     │
     ▼
express.json()    → Parse request body
     │
     ▼
morgan()          → Log request to console
     │
     ▼
rateLimit()       → 100 req/15min per IP (trust proxy=1 for ngrok/Render)
     │
     ▼
router.use()      → Match route
     │
     ▼
authenticate()    → Verify JWT → set req.staff
     │
     ▼
authorize()       → Check role (owner/admin/manager/stylist)
     │
     ▼
Controller        → Business logic + Supabase query
     │
     ▼
res.json()        → Response to client
```
