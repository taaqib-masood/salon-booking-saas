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

<br><br>

---

## 👨‍💻 About the Author

<div align="center">

# <img src="https://readme-typing-svg.herokuapp.com?font=Inter&weight=600&size=30&pause=1000&color=F43F5E&center=true&vCenter=true&width=500&lines=Multi-Tenant+SaaS;Payment+Gateways;Robust+Backends" alt="Typing SVG" />

<img src="https://capsule-render.vercel.app/api?type=waving&color=F43F5E&height=200&section=header&text=Taaqib%20Masood&fontSize=50&fontColor=ffffff&animation=fadeIn&fontAlignY=38&desc=Scalable%20Cloud%20Architecture&descAlignY=55&descAlign=50" />

<p align="center">
  <img src="https://img.shields.io/badge/Location-Global-F43F5E?style=for-the-badge&logo=google-maps&logoColor=white" />
  <img src="https://img.shields.io/badge/Education-B.S.%20Computer%20Science-000000?style=for-the-badge&logo=academia&logoColor=white" />
</p>

<p align="center">
  <a href="https://taaqib-portfolio.vercel.app/"><img src="https://img.shields.io/badge/Portfolio-F43F5E?style=for-the-badge&logo=vercel&logoColor=white" /></a>
  <a href="https://www.linkedin.com/in/taaqib-masood/"><img src="https://img.shields.io/badge/LinkedIn-000000?style=for-the-badge&logo=linkedin&logoColor=white" /></a>
  <a href="mailto:taaqibmasood@gmail.com"><img src="https://img.shields.io/badge/Email-F43F5E?style=for-the-badge&logo=gmail&logoColor=white" /></a>
  <a href="https://github.com/taaqib-masood"><img src="https://img.shields.io/badge/GitHub-000000?style=for-the-badge&logo=github&logoColor=white" /></a>
</p>

</div>

---

<details>
<summary><b><kbd>▶ REVEAL: ABOUT ME (GARAGE DOOR EFFECT)</kbd></b></summary>
<br>

> I am a Software Engineer with a profound focus on AI/ML systems and Full Stack Development. I specialize in building enterprise-grade applications, robust distributed systems, and implementing scalable machine learning solutions in production environments. My engineering philosophy revolves around a strong product mindset, ensuring that the technology not only meets rigorous technical standards but also delivers exceptional user experiences. 
> 
> **Open To:** Senior Software Engineering roles, AI Engineer positions, and high-impact open-source contributions.

</details>

<details>
<summary><b><kbd>▶ TOGGLE: TECH STACK SPEC-SHEET</kbd></b></summary>
<br>

### Languages
<p align="left">
  <a href="https://skillicons.dev"><img src="https://skillicons.dev/icons?i=py,ts,js,java,cpp,go,rust&theme=dark" /></a>
</p>

### Frontend & Backend
<p align="left">
  <a href="https://skillicons.dev"><img src="https://skillicons.dev/icons?i=react,nextjs,tailwind,nodejs,postgres,mongodb,redis&theme=dark" /></a>
</p>

### Cloud & DevOps
<p align="left">
  <a href="https://skillicons.dev"><img src="https://skillicons.dev/icons?i=aws,gcp,docker,kubernetes,githubactions&theme=dark" /></a>
</p>

</details>

<details>
<summary><b><kbd>▶ TOGGLE: AI / ML EXPERTISE (SPEC-SHEET TOOLTIPS)</kbd></b></summary>
<br>

| Domain | Proficiency | Spec-Sheet (Hover) |
| :--- | :---: | :--- |
| **Large Language Models (LLMs)** | Advanced | <abbr title="Prompt Engineering, RAG Architectures, Agentic Systems, MCP">Hover for details</abbr> |
| **Machine Learning** | Advanced | <abbr title="Predictive Modeling, Classification, Regression, Ensemble Methods">Hover for details</abbr> |
| **Deep Learning** | Intermediate | <abbr title="Neural Networks, CNNs, NLP, PyTorch, TensorFlow">Hover for details</abbr> |
| **MLOps** | Intermediate | <abbr title="Model Deployment, Monitoring, CI/CD for ML, Data Pipelines">Hover for details</abbr> |

</details>

<details>
<summary><b><kbd>▶ REVEAL: FEATURED PROJECTS</kbd></b></summary>
<br>

- **[Taaqib Portfolio](https://github.com/taaqib-masood/Taaqib-Portfolio)**: Global Edge Delivery, 99+ Lighthouse Score.
- **[Predictive Maintenance](https://github.com/taaqib-masood/predictive-maintenance-industrial-machinery)**: High accuracy failure prediction on real-time sensor data.
- **[Salon Booking SaaS](https://github.com/taaqib-masood/salon-booking-saas)**: Multi-tenant architecture with secure Stripe payments.
- **[Majestic Constructions](https://github.com/taaqib-masood/majestic-constructions)**: High-traffic enterprise site with fast server-side rendering.

</details>

---

<div align="center">
  <h3> 📊 GitHub Analytics & Snake </h3>
</div>

<p align="center">
  <img src="https://github-readme-stats.vercel.app/api?username=taaqib-masood&show_icons=true&theme=tokyonight&hide_border=true&bg_color=0D1117&title_color=F43F5E&icon_color=ffffff" alt="GitHub Stats" />
  <img src="https://github-readme-streak-stats.herokuapp.com/?user=taaqib-masood&theme=tokyonight&hide_border=true&background=0D1117&ring=F43F5E&fire=ffffff&currStreakLabel=F43F5E" alt="GitHub Streak" />
</p>

<p align="center">
  <img src="https://raw.githubusercontent.com/taaqib-masood/taaqib-masood/output/github-contribution-grid-snake-dark.svg" alt="Contribution Snake" />
</p>

<div align="center">
  <img src="https://capsule-render.vercel.app/api?type=waving&color=F43F5E&height=100&section=footer" />
</div>
