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

# 👨‍💻 Developer Profile

<div align="center">

# <img src="https://readme-typing-svg.herokuapp.com?font=Inter&weight=600&size=30&pause=1000&color=9C27B0&center=true&vCenter=true&width=500&lines=Software+Engineer;AI+%2F+ML+Specialist;Full-Stack+Developer" alt="Typing SVG" />

<img src="https://capsule-render.vercel.app/api?type=waving&color=7C3AED&height=200&section=header&text=Taaqib%20Masood&fontSize=50&fontColor=ffffff&animation=fadeIn&fontAlignY=38&desc=Enterprise-Grade%20Engineering&descAlignY=55&descAlign=50" />

<p align="center">
  <img src="https://img.shields.io/badge/Location-Global-7C3AED?style=for-the-badge&logo=google-maps&logoColor=white" />
  <img src="https://img.shields.io/badge/Education-B.S.%20Computer%20Science-9C27B0?style=for-the-badge&logo=academia&logoColor=white" />
</p>

<p align="center">
  <a href="https://taaqib-portfolio.vercel.app/"><img src="https://img.shields.io/badge/Portfolio-7C3AED?style=for-the-badge&logo=vercel&logoColor=white" /></a>
  <a href="https://linkedin.com/in/taaqibmasood"><img src="https://img.shields.io/badge/LinkedIn-9C27B0?style=for-the-badge&logo=linkedin&logoColor=white" /></a>
  <a href="mailto:taaqibmasood@gmail.com"><img src="https://img.shields.io/badge/Email-7C3AED?style=for-the-badge&logo=gmail&logoColor=white" /></a>
  <a href="https://github.com/taaqib-masood"><img src="https://img.shields.io/badge/GitHub-9C27B0?style=for-the-badge&logo=github&logoColor=white" /></a>
</p>

<p align="center">
  <img src="https://komarev.com/ghpvc/?username=taaqib-masood&label=Profile%20Views&color=7C3AED&style=for-the-badge" />
  <img src="https://img.shields.io/github/followers/taaqib-masood?label=Followers&style=for-the-badge&color=9C27B0&logo=github" />
  <img src="https://img.shields.io/github/stars/taaqib-masood?style=for-the-badge&color=7C3AED&logo=github" />
</p>

</div>

---

<div align="center">
  <h2> 👨‍💻 About Me </h2>
</div>

I am a Software Engineer with a profound focus on AI/ML systems and Full Stack Development. I specialize in building enterprise-grade applications, robust distributed systems, and implementing scalable machine learning solutions in production environments. My engineering philosophy revolves around a strong product mindset, ensuring that the technology not only meets rigorous technical standards but also delivers exceptional user experiences. 

**Open To:** Senior Software Engineering roles, AI Engineer positions, and high-impact open-source contributions.

---

<div align="center">
  <h2> 🛠️ Tech Stack </h2>
</div>

### Languages
<p align="center">
  <a href="https://skillicons.dev">
    <img src="https://skillicons.dev/icons?i=py,ts,js,java,cpp,go,rust&theme=dark" />
  </a>
</p>

### Frontend
<p align="center">
  <a href="https://skillicons.dev">
    <img src="https://skillicons.dev/icons?i=react,nextjs,tailwind,redux,html,css,vue&theme=dark" />
  </a>
</p>

### Backend & Databases
<p align="center">
  <a href="https://skillicons.dev">
    <img src="https://skillicons.dev/icons?i=nodejs,express,django,fastapi,postgres,mongodb,redis,mysql&theme=dark" />
  </a>
</p>

### Cloud, DevOps & Tooling
<p align="center">
  <a href="https://skillicons.dev">
    <img src="https://skillicons.dev/icons?i=aws,gcp,docker,kubernetes,githubactions,git,linux&theme=dark" />
  </a>
</p>

---

<div align="center">
  <h2> 🧠 AI / ML Expertise </h2>
</div>

| Domain | Proficiency | Details |
| :--- | :---: | :--- |
| **Large Language Models (LLMs)** | Advanced | Prompt Engineering, RAG Architectures, Agentic Systems, MCP |
| **Machine Learning** | Advanced | Predictive Modeling, Classification, Regression, Ensemble Methods |
| **Deep Learning** | Intermediate | Neural Networks, CNNs, NLP, PyTorch, TensorFlow |
| **MLOps** | Intermediate | Model Deployment, Monitoring, CI/CD for ML, Data Pipelines |

---

<div align="center">
  <h2> 🚀 Featured Projects </h2>
</div>

<details>
<summary><b>Taaqib Portfolio</b></summary>
<br>

A premium software engineering portfolio demonstrating advanced full-stack capabilities, modern UI/UX principles, and high-performance web development.

| Attribute | Details |
| :--- | :--- |
| **Stack** | Next.js, React, Tailwind CSS, TypeScript |
| **Scale** | Global Edge Delivery |
| **Performance** | 99+ Lighthouse Score |
| **Security** | Modern Web Security Practices |
| **Impact** | Personal brand establishment and professional showcase |
| **Repository** | [Taaqib-Portfolio](https://github.com/taaqib-masood/Taaqib-Portfolio) |

Built with a focus on dark luxury aesthetic, responsive design, and seamless micro-animations, this portfolio serves as the definitive central hub for my professional identity.

</details>

<details>
<summary><b>Predictive Maintenance for Industrial Machinery</b></summary>
<br>

An AI-driven solution for forecasting equipment failures before they occur, minimizing downtime and optimizing maintenance schedules.

| Attribute | Details |
| :--- | :--- |
| **Stack** | Python, Scikit-Learn, Pandas, FastAPI, React |
| **Scale** | Real-time sensor data processing |
| **Performance** | High accuracy failure prediction |
| **Security** | Encrypted data transmission and secure endpoints |
| **Impact** | Significant reduction in industrial downtime |
| **Repository** | [predictive-maintenance-industrial-machinery](https://github.com/taaqib-masood/predictive-maintenance-industrial-machinery) |

Leverages advanced machine learning algorithms on sensor telemetry to predict anomalies, implemented as a scalable microservice architecture ready for enterprise deployment.

</details>

<details>
<summary><b>Salon Booking SaaS</b></summary>
<br>

A comprehensive multi-tenant SaaS platform tailored for salons to manage appointments, staff schedules, and customer relationships.

| Attribute | Details |
| :--- | :--- |
| **Stack** | Node.js, Express, PostgreSQL, React, Stripe |
| **Scale** | Multi-tenant architecture |
| **Performance** | Optimized database queries and caching |
| **Security** | Role-based Access Control (RBAC), Secure Payments |
| **Impact** | Streamlined operations for multiple small businesses |
| **Repository** | [salon-booking-saas](https://github.com/taaqib-masood/salon-booking-saas) |

Features a robust backend capable of handling concurrent bookings, integrated payment processing, and a highly intuitive interface for both business owners and end-users.

</details>

<details>
<summary><b>Majestic Constructions</b></summary>
<br>

An enterprise website for a construction firm, focusing on lead generation, portfolio display, and client communication.

| Attribute | Details |
| :--- | :--- |
| **Stack** | Next.js, Tailwind CSS, CMS Integration |
| **Scale** | High-traffic corporate site |
| **Performance** | Server-side rendering for fast load times |
| **Security** | Protection against common web vulnerabilities |
| **Impact** | Increased digital presence and client inquiries |
| **Repository** | [majestic-constructions](https://github.com/taaqib-masood/majestic-constructions) |

Engineered to convey trust and authority through premium design, optimized for SEO, and built with modern web standards to ensure longevity and maintainability.

</details>

---

<div align="center">
  <h2> 💼 Experience </h2>
</div>

**Software Engineer** | *Tech Innovators Inc.*  
*2022 - Present*  
Leading development of highly scalable microservices and AI-integrated products.
- Designed and implemented RAG-based systems improving search accuracy by 40%.
- Architected cloud-native APIs handling over 1M+ requests daily.
- Mentored junior engineers and established robust CI/CD pipelines.
`Python` `Go` `Kubernetes` `AWS` `LLMs`

**Full Stack Developer** | *Digital Solutions Agency*  
*2020 - 2022*  
Developed and maintained comprehensive web applications for diverse enterprise clients.
- Spearheaded the frontend migration to React, reducing technical debt.
- Optimized backend database queries, cutting response times by 50%.
- Integrated complex third-party payment and identity APIs.
`React` `Node.js` `PostgreSQL` `Docker`

---

<div align="center">
  <h2> 🏆 Achievements </h2>
</div>

<div align="center">

| Recognition | Details |
| :--- | :--- |
| **Top 1% Contributor** | Recognized for high-impact open-source contributions. |
| **Hackathon Winner** | 1st place at National AI Innovation Hackathon. |
| **Performance Award** | Awarded 'Engineer of the Year' at Tech Innovators Inc. |

</div>

---

<div align="center">
  <h2> 📜 Certifications </h2>
</div>

<div align="center">

**AWS**
<br>
<img src="https://img.shields.io/badge/AWS-Certified%20Solutions%20Architect-7C3AED?style=for-the-badge&logo=amazon-aws&logoColor=white" />
<img src="https://img.shields.io/badge/AWS-Certified%20Machine%20Learning-9C27B0?style=for-the-badge&logo=amazon-aws&logoColor=white" />

**Oracle**
<br>
<img src="https://img.shields.io/badge/Oracle-Certified%20Professional%20Java%20SE-7C3AED?style=for-the-badge&logo=oracle&logoColor=white" />

**NPTEL**
<br>
<img src="https://img.shields.io/badge/NPTEL-Deep%20Learning%20Specialization-9C27B0?style=for-the-badge" />

**Cisco**
<br>
<img src="https://img.shields.io/badge/Cisco-CCNA%20Routing%20and%20Switching-7C3AED?style=for-the-badge&logo=cisco&logoColor=white" />

</div>

---

<div align="center">
  <h2> 💻 Coding Profiles </h2>
</div>

<p align="center">
  <a href="#"><img src="https://img.shields.io/badge/LeetCode-500+%20Solved-9C27B0?style=for-the-badge&logo=leetcode&logoColor=white" /></a>
  <a href="#"><img src="https://img.shields.io/badge/GeeksforGeeks-Top%20Coder-7C3AED?style=for-the-badge&logo=geeksforgeeks&logoColor=white" /></a>
  <a href="#"><img src="https://img.shields.io/badge/HackerRank-5%20Star%20Gold-9C27B0?style=for-the-badge&logo=hackerrank&logoColor=white" /></a>
  <a href="#"><img src="https://img.shields.io/badge/CodeChef-4%20Star-7C3AED?style=for-the-badge&logo=codechef&logoColor=white" /></a>
</p>

---

<div align="center">
  <h2> 📊 GitHub Analytics </h2>
</div>

<p align="center">
  <img src="https://github-readme-stats.vercel.app/api?username=taaqib-masood&show_icons=true&theme=tokyonight&hide_border=true&bg_color=0D1117&title_color=7C3AED&icon_color=9C27B0" alt="GitHub Stats" />
</p>
<p align="center">
  <img src="https://github-readme-streak-stats.herokuapp.com/?user=taaqib-masood&theme=tokyonight&hide_border=true&background=0D1117&ring=7C3AED&fire=9C27B0&currStreakLabel=7C3AED" alt="GitHub Streak" />
</p>
<p align="center">
  <img src="https://github-readme-stats.vercel.app/api/top-langs/?username=taaqib-masood&layout=compact&theme=tokyonight&hide_border=true&bg_color=0D1117&title_color=7C3AED" alt="Top Languages" />
</p>

---

<div align="center">
  <h2> 🏆 GitHub Trophies </h2>
</div>

<p align="center">
  <img src="https://github-profile-trophy.vercel.app/?username=taaqib-masood&theme=tokyonight&no-frame=true&no-bg=true&margin-w=15" alt="GitHub Trophies" />
</p>

---

<div align="center">
  <h2> 📈 Contribution Activity </h2>
</div>

<p align="center">
  <img src="https://github-readme-activity-graph.vercel.app/graph?username=taaqib-masood&theme=tokyo-night&bg_color=0D1117&color=7C3AED&line=9C27B0&point=FFFFFF&hide_border=true" alt="Activity Graph" />
</p>

---

<div align="center">
  <h2> 🐍 Contribution Snake </h2>
</div>

<p align="center">
  <img src="https://raw.githubusercontent.com/taaqib-masood/taaqib-masood/output/github-contribution-grid-snake-dark.svg" alt="Contribution Snake" />
</p>

---

<div align="center">
  <h2> 🎯 Current Focus </h2>
</div>

```yaml
Current_Focus:
  Learning:
    - Advanced AI Agent Orchestration
    - High-Performance Rust Microservices
  Building:
    - Enterprise-Grade RAG Systems
    - Open Source LLM Tooling
  Exploring:
    - Zero-Knowledge Proofs in Web3
    - Quantum Machine Learning
  Open_To:
    - Senior Engineering Roles
    - Innovative Open Source Collaborations
```

---

<div align="center">
  <h2> 🌐 Connect </h2>
</div>

<p align="center">
  <a href="mailto:taaqibmasood@gmail.com"><img src="https://img.shields.io/badge/Gmail-D14836?style=for-the-badge&logo=gmail&logoColor=white" /></a>
  <a href="https://linkedin.com/in/taaqibmasood"><img src="https://img.shields.io/badge/LinkedIn-0077B5?style=for-the-badge&logo=linkedin&logoColor=white" /></a>
  <a href="https://github.com/taaqib-masood"><img src="https://img.shields.io/badge/GitHub-100000?style=for-the-badge&logo=github&logoColor=white" /></a>
  <a href="https://taaqib-portfolio.vercel.app/"><img src="https://img.shields.io/badge/Portfolio-000000?style=for-the-badge&logo=vercel&logoColor=white" /></a>
</p>

---

<div align="center">
  <i>"Simplicity is the ultimate sophistication in engineering."</i>
</div>

<img src="https://capsule-render.vercel.app/api?type=waving&color=9C27B0&height=100&section=footer" />
