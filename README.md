# Qisana (Secours Infirmiers Pro)

A comprehensive full-stack web application designed for nursing professionals (Secours Infirmiers). Qisana provides robust tools for practitioner profile management, scheduling, location-based searches, and system audit logging.

---

## Tech Stack

**Frontend:**
* [Next.js](https://nextjs.org/) (React Framework)
* Tailwind CSS / PostCSS

**Backend:**
* [NestJS](https://nestjs.com/) (Node.js Framework)
* [Prisma](https://www.prisma.io/) (ORM)
* JSON Web Tokens (JWT) & Passport for Authentication

**Infrastructure:**
* [PostgreSQL](https://www.postgresql.org/) (Database)
* [Docker & Docker Compose](https://www.docker.com/) (Containerization)
* [Caddy](https://caddyserver.com/) (Reverse Proxy & Auto-HTTPS)

---

## Features

* **Authentication & Authorization:** Secure JWT-based login, role management (Admin/User), and account verification processes.
* **User Profile & Schedule Management:** Comprehensive tools for practitioners to manage their professional profiles, set working schedules, and update real-time availability.
* **Location-Based Search:** Advanced search functionality optimized by geographical location to connect patients with available nurses.
* **Audit & Reporting:** Detailed tracking of user searches and interactions, complete with downloadable CSV/PDF report generation.
* **Automated Infrastructure:** Database schema synchronization, initial data seeding (including CPTS directories), and migrations run automatically on container startup.
* **Production-Ready TLS:** Caddy server configured for automatic Let's Encrypt SSL certificate provisioning.

---

## Project Structure

```text
qisana/
├── backend/               # NestJS API, Prisma schema, and migrations
│   ├── prisma/            # Database schema and seed scripts
│   ├── src/               # Backend source code (Controllers, Services, Modules)
│   └── Dockerfile         # Backend container definition
├── frontend/              # Next.js web application
│   ├── app/               # Next.js App Router components
│   ├── lib/               # Shared utilities and API clients
│   └── Dockerfile         # Frontend container definition
├── Caddyfile              # Reverse proxy and SSL configuration
└── docker-compose.yml     # Multi-container orchestration
