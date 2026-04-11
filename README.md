# 🇦🇪 UAE Salon Booking SaaS — Production-Grade Backend

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D20.0.0-brightgreen)](https://nodejs.org/)
[![Built with AI](https://img.shields.io/badge/Built%20with-AI%20Dev%20System-blueviolet)](https://github.com/taaqib-masood/salon-booking-saas)

A comprehensive, multi-tenant SaaS platform designed specifically for the UAE salon industry. This system handles everything from bilingual (EN/AR) service catalogs and real-time appointment scheduling to VAT-compliant invoicing and WhatsApp notifications.

---

## ✨ Key Features

### 🏢 Core Operations
*   **Multi-Tenant Architecture**: Support for multiple salon brands under a single infrastructure using `X-Tenant-ID` header routing.
*   **Multi-Branch Management**: Comprehensive setup for branches with localized working hours and weekend settings (Friday/Saturday).
*   **Staff Scheduling**: Domain-specific roles (Stylist, Receptionist, Manager) with custom schedules and commission tracking.

### 📅 Booking & CRM
*   **Real-time Availability**: Intelligent slot calculation based on service duration, staff schedule, and existing bookings.
*   **Two-Way Notifications**: Automated WhatsApp reminders (via Twilio) and email notifications (via SendGrid).
*   **Loyalty & Referrals**: Built-in loyalty points system (AED 10 = 1 point) and package deal tracking.
*   **Guest & Customer Flow**: Simplified booking for guest users and detailed history/preferences for registered customers.

### 💰 Finance & Compliance
*   **UAE VAT Compliance**: Automatic 5% VAT calculation stored on every transaction.
*   **Integrated Payments**: Stripe integration for online deposits and full payments.
*   **POS Terminal Support**: Square POS integration for physical branches with receipt generation.
*   **Revenue Analytics**: Detailed reporting on top services, staff performance, and tax liabilities.

### 🌍 Localization
*   **Bilingual Support**: Full English/Arabic (EN/AR) support for service names, categories, and notifications.
*   **Regional Formatting**: UAE locale support for currency (AED) and date/time formatting.

---

## 🛠 Tech Stack

| Layer | Technology |
| :--- | :--- |
| **Backend** | Node.js (ESM), Express.js |
| **Primary Database** | MongoDB (via Mongoose) |
| **Auth & Storage** | Supabase (Auth, S3-compatible Storage) |
| **Queue Management** | Redis + BullMQ (Reminders, Reports) |
| **Infrastructure** | Docker, Nginx, Kubernetes, Terraform |
| **CI/CD** | GitHub Actions |
| **Frontend** | React, Vite, TailwindCSS (RTL Support) |

---

## 🚀 Quick Start

### 1. Prerequisites
*   Node.js v20+
*   MongoDB (Atlas or Local)
*   Redis server
*   Supabase Account

### 2. Installation
```bash
# Clone the repository
git clone https://github.com/taaqib-masood/salon-booking-saas.git
cd salon-booking-saas

# Install Backend Dependencies
npm install

# Install Frontend Dependencies
cd frontend
npm install
cd ..
```

### 3. Environment Setup
Copy the example environment file and fill in your credentials:
```bash
cp .env.example .env
```

### 4. Running the Project
**Development Mode:**
```bash
# Start Backend
npm start

# Start Frontend (in a new terminal)
cd frontend
npm run dev
```

**Docker Mode:**
```bash
docker-compose up --build
```

---

## 📂 Project Structure

```text
├── models/          # Mongoose schemas (Tenant, Appointment, Staff, etc.)
├── routes/          # Express API route handlers
├── controllers/     # Business logic & orchestration
├── middleware/      # Auth, Tenant isolation, Validation, Rate-limiting
├── cron/            # Scheduled tasks (Reminders, Loyalty expiry)
├── utils/           # Helpers for VAT, i18n, Receipt generation
├── frontend/        # React + Vite application
├── scripts/         # Maintenance and migration scripts
├── k8s/             # Kubernetes manifests
└── terraform/       # Infrastructure as Code
```

---

## 🔧 Environment Variables

| Variable | Description | Default |
| :--- | :--- | :--- |
| `PORT` | Local server port | `3000` |
| `MONGO_URI` | MongoDB Connection String | `REQUIRED` |
| `SUPABASE_URL` | Supabase Project URL | `REQUIRED` |
| `REDIS_URL` | Redis Connection String | `redis://localhost:6379` |
| `JWT_SECRET` | Secret for token signing | `REQUIRED` |
| `VAT_RATE` | UAE VAT Percentage | `0.05` |

---

## 🛣 API Endpoints (v1)

*   `POST /api/v1/auth/login` - Staff authentication
*   `GET /api/v1/services` - List services (bilingual)
*   `POST /api/v1/appointments` - Book a new slot
*   `GET /api/v1/health` - System health check

---

## 🤝 Contributing
1.  Fork the project
2.  Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3.  Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4.  Push to the Branch (`git push origin feature/AmazingFeature`)
5.  Open a Pull Request

---

## 📄 License
Distributed under the MIT License. See `LICENSE` for more information.

---
*Created with ❤️ for the UAE Salon Community.*
