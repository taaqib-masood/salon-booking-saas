# La Maison Salon — 10-Minute Client Demo Script

**Setup before client arrives:**
- `node server.js` running in terminal
- Postman open with La Maison collection loaded
- WhatsApp open on your phone
- Supabase dashboard open (Table Editor → appointments)
- Browser open at `http://localhost:3000`

---

## MINUTE 0–1 — Opening Hook

**Say:**
> "Let me show you what happens when a customer messages your salon on WhatsApp right now."

**Do:** Pick up your phone and send to +1 415 523 8886:
> "Hi, I'd like to book a facial"

**Wait for Leila to reply. Show the client the response.**

**Say:**
> "That's your AI concierge — her name is Leila. She's available 24/7, speaks to every customer like a personal assistant, and she can actually complete the booking. Watch."

**Do:** Continue the WhatsApp conversation until Leila books the appointment.

**Say:**
> "The booking just went live into your system. Let me show you."

---

## MINUTE 1–2 — Live Booking Confirmation

**Do:** Switch to Supabase → Table Editor → appointments table. Refresh.

**Say:**
> "See this row? That's the appointment Leila just created — date, time, service, customer phone, total amount including VAT. All automatic. Zero staff involved."

**Do:** Open Postman → Run **Get All Appointments**

**Say:**
> "Your front desk can see every booking here in real time. Now let me show you the full booking system."

---

## MINUTE 2–4 — Core Booking Flow

**Do:** Run **Public Booking** in Postman (or show the frontend booking page)

**Say:**
> "Customers can also book directly from your website. No login required — they just pick a service, time, and staff."

**Do:** Show the response — `status: confirmed`, booking ID, total amount with VAT.

**Say:**
> "Every booking automatically calculates VAT at 5% for UAE compliance. The customer gets a WhatsApp confirmation instantly."

**Do:** Run **Reschedule Appointment**

**Say:**
> "Your team can reschedule with one click — customer gets notified on WhatsApp automatically."

---

## MINUTE 4–5 — Staff & Calendar

**Do:** Run **Get Staff** in Postman

**Say:**
> "Every staff member has their own profile — specialties, commission rate, working days. The system tracks who does what."

**Do:** Open browser and go to:
```
http://localhost:3000/api/v1/calendar/feed.ics?tenant_id=5103813d-5a3b-4ebd-88f3-d1277e600a06
```

**Say:**
> "This is a live calendar feed. Your staff open Google Calendar, paste this URL once, and from that moment every booking appears on their calendar automatically — synced every 15 minutes. No app to install, no manual updates."

---

## MINUTE 5–6 — Automated Reminders

**Say:**
> "Here's something your competitors definitely don't have."

**Do:** Show `server.js` log output — point to `Reminder cron started`

**Say:**
> "Every 15 minutes, the system checks for appointments in the next 2 hours. If a customer hasn't been reminded, it WhatsApps them automatically. No-shows drop significantly. This runs by itself — you don't touch it."

---

## MINUTE 6–7 — Analytics & Business Intelligence

**Do:** Run **Analytics Revenue** in Postman

**Say:**
> "You get a live revenue dashboard — gross revenue, VAT collected, discounts applied, net revenue, average ticket size. All filterable by date range or branch."

**Do:** Run **Top Services**

**Say:**
> "This shows your best-performing services by bookings and revenue. You know exactly what to promote and what to cut."

**Do:** Run **Staff Commission**

**Say:**
> "Staff commissions are calculated automatically based on their rate. No manual spreadsheets."

---

## MINUTE 7–8 — Loyalty, Offers & Packages

**Do:** Run **Loyalty Balance**, then **Offers List**

**Say:**
> "Customers earn loyalty points on every visit. You create promo codes — SAVE10, VIPFREE — they validate at checkout. Takes 30 seconds to set up a campaign."

**Do:** Run **Get Packages**

**Say:**
> "You can sell service bundles — buy 5 facials, get the 6th free. The system tracks remaining sessions per customer. Huge for retention."

---

## MINUTE 8–9 — Multi-Tenancy & Compliance

**Do:** Run **Tenant Info**

**Say:**
> "This platform is built as a SaaS — meaning you can run multiple salon branches under one account. Each branch has separate staff, bookings, and analytics, but you see everything from one dashboard."

**Do:** Run **GDPR Export**

**Say:**
> "For compliance — any customer can request their data and you export it instantly. Or if they want to be forgotten, you delete everything with one API call. That's UAE PDPL and GDPR ready out of the box."

---

## MINUTE 9–10 — Closing & Vision

**Do:** Run **Webhooks**

**Say:**
> "The system can push real-time events to any third-party tool — your CRM, accounting software, email platform. Booking confirmed, cancelled, rescheduled — it fires a webhook. Fully automatable."

**Final pitch:**
> "What you're looking at is a complete salon operating system. Bookings from WhatsApp, website, or front desk. Automated reminders. Live staff calendars. Revenue analytics. Loyalty programs. Multi-branch. GDPR compliant. All running on one platform. The AI concierge alone saves you a receptionist salary. What questions do you have?"

---

## Backup Answers for Client Questions

| Question | Answer |
|----------|--------|
| "Can we use our own WhatsApp number?" | Yes — requires WhatsApp Business API approval (~1 week). Currently on sandbox for demo. |
| "What language does Leila speak?" | English by default, can be configured for Arabic in the system prompt. |
| "Can we add more services?" | Yes — POST /services. Takes 10 seconds. |
| "How many branches can we have?" | Unlimited on the SaaS plan. |
| "Is customer data secure?" | Supabase (PostgreSQL) with row-level security. All data isolated per tenant. |
| "What happens if the AI says something wrong?" | You can review and override any response. Leila only books when the customer explicitly confirms. |
| "How much does it cost to run?" | Supabase free tier + Groq free tier + Render free tier = ~$0/month to start. |
