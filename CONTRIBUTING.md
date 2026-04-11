# Contributing to UAE Salon Booking SaaS

Thank you for your interest in contributing! This project aims to provide a top-tier SaaS solution for the UAE salon industry.

## How to Contribute

### 1. Reporting Bugs
- Check the [Issues](https://github.com/taaqib-masood/salon-booking-saas/issues) to see if the bug has already been reported.
- If not, open a new issue with a clear description and steps to reproduce.

### 2. Suggesting Features
- Open an issue with the "feature request" tag.
- Describe the feature and why it would be beneficial for salon owners in the UAE.

### 3. Submitting Pull Requests
- Fork the repository.
- Create a new branch for your feature or fix.
- Ensure your code follows the existing style and is well-documented.
- Include unit tests if applicable.
- Submit a PR with a detailed description of your changes.

## Development Setup

See the [README.md](README.md) for detailed setup instructions.

### Coding Standards
- Use ES Modules (`import`/`export`).
- Use CamelCase for variables and functions.
- Ensure all service names and categories support bilingual fields (`name_en`, `name_ar`).
- Always calculate VAT using the centralized utility in `utils/vat.js`.

## Tech Stack
- **Backend**: Node.js, Express, MongoDB
- **Frontend**: React, Vite, TailwindCSS
- **Communication**: Twilio (WhatsApp), SendGrid (Email)
- **Payments**: Stripe, Square POS

---
*By contributing, you agree that your contributions will be licensed under the MIT License.*
