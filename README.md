# ⛽ Generator Fuel Monitoring System

> A web-based platform for tracking generator fuel deliveries, running hours, and consumption deviations across Ethio Telecom sites — with real-time dashboards, GIS mapping, fuel request workflows, and role-based access control.

![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)
![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748?logo=prisma)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Database-336791?logo=postgresql)
![Clerk](https://img.shields.io/badge/Auth-Clerk-6C47FF?logo=clerk)
![Vercel](https://img.shields.io/badge/Deployed-Vercel-000000?logo=vercel)
![License](https://img.shields.io/badge/License-MIT-green)

---

## 📖 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [System Modules](#-system-modules)
- [Technology Stack](#-technology-stack)
- [System Architecture](#-system-architecture)
- [Installation](#-installation)
- [Environment Variables](#-environment-variables)
- [Database Setup](#-database-setup)
- [Running the Project](#-running-the-project)
- [Project Structure](#-project-structure)
- [User Roles](#-user-roles)
- [Security & Code Quality](#-security--code-quality)
- [Future Improvements](#-future-improvements)
- [Contributing](#-contributing)
- [License](#-license)
- [Author](#-author)

---

## 📌 Overview

The **Generator Fuel Monitoring System** digitizes generator fuel operations for Ethio Telecom sites, replacing manual paperwork with a centralized web application.

It automatically captures physical fuel delivery records, tracks generator running hours and consumption deviations, manages fuel requests end-to-end, and gives field engineers a mobile-optimized PWA interface for recording data on-site — all backed by role-based access control and real-time analytics.

---

## ✨ Features

### Dashboard & Analytics
- Animated metric cards with count-up animations, sparkline trend charts, and delta badges
- Real-time consumption analytics and deviation tracking
- Running-hour difference calculations
- Site and regional performance overview
- Role-scoped dashboards: each role sees only the data relevant to them

### Fuel Management
- Fuel requests with a full multi-step approval workflow (technician → supervisor → manager → finance → fleet admin)
- Automated fuel journal capturing physical delivery records (Fuel Refills)
- Fuel Admin Wallet with deposit/withdrawal transaction history
- Excel export for reporting

### Generator & Site Management
- Generator registration with capacity, model, and running-hour tracking — created atomically via a database transaction
- Site registration with GPS coordinates, tanker capacity, and DG type/capacity
- Region and department organization (Wireless Infrastructure, Fleet, General)
- Interactive GIS map view (Leaflet)

### Access & Workflow
- Authentication exclusively via Clerk (no local password hashes)
- Role-based authorization via CASL with role-guarded server actions
- Technician profiles linked to departments and regions
- Mobile-optimized PWA for field data entry

---

## 🏗 System Modules

| Module | Description |
|---|---|
| Dashboard | Role-scoped animated dashboards with live metric cards |
| Sites | Register and manage sites, GPS coordinates, and regions |
| Generators | Track generators, capacity, and running hours |
| Fuel Requests | Submit, approve, and track fuel requests through the full workflow |
| Fuel Refills | Record physical delivery records automatically |
| Fuel Journal | Paginated, sortable, exportable journal of all refill events |
| Transactions | Fuel Admin Wallet deposits and withdrawals |
| Technicians | Manage technician profiles, departments, and regions |
| GIS Map | Visualize sites geographically |
| Users | Manage accounts and role-based permissions via Clerk |

---

## 🛠 Technology Stack

**Frontend**
- Next.js 16 (App Router, Turbopack)
- React 19
- TypeScript
- Tailwind CSS
- Radix UI / shadcn/ui
- React Hook Form + Zod
- Recharts (sparklines, analytics charts)
- Leaflet / React-Leaflet

**Backend**
- Next.js Server Actions & API Routes
- Prisma ORM (PostgreSQL)
- Zod input validation (every mutation is validated server-side)
- CASL (role-based ability/permission checks)
- Structured logging (`logger`) across all mutation actions

**Database**
- PostgreSQL (hosted on Neon)

**Authentication**
- Clerk (all roles stored in `publicMetadata`; no local credential tables)

**Infrastructure**
- Deployed on Vercel (auto-deploy on push to `main`)

**Other**
- xlsx (Excel export)
- dnd-kit (drag-and-drop interactions)

---

## 🏛 System Architecture

```
                    Users
                      │
                      ▼
             Next.js Web Application
                      │
        ┌─────────────┼─────────────┐
        │             │             │
        ▼             ▼             ▼
 Authentication   Business Logic   Dashboard
   (Clerk/CASL)   (Server Actions)  (Analytics)
        │              │              │
        └──────────────┼──────────────┘
                        ▼
                  Prisma ORM
                        │
                        ▼
                PostgreSQL (Neon)
```

---

## 🚀 Installation

Clone the repository:

```bash
git clone https://github.com/Million1921/generator-fuel-monitoring-system-full.git
```

Navigate into the project:

```bash
cd generator-fuel-monitoring-system-full
```

Install dependencies:

```bash
npm install
```

---

## ⚙ Environment Variables

Create a `.env` file in the project root:

```env
# PostgreSQL — use the pooled URL for runtime queries
DATABASE_URL=postgresql://...?pgbouncer=true

# PostgreSQL — direct URL (used by Prisma migrations and db push)
DIRECT_URL=postgresql://...

# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL=/dashboard
NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL=/dashboard
```

> ⚠️ **Never commit `.env` to version control.** It is included in `.gitignore`.

---

## 🗄 Database Setup

Generate the Prisma client:

```bash
npx prisma generate
```

Push the schema to your database (for development without migrations):

```bash
npx prisma db push
```

Or run migrations:

```bash
npx prisma migrate dev
```

Open Prisma Studio:

```bash
npx prisma studio
```

> 💡 **Seeding an admin user:** Create the user in the [Clerk Dashboard](https://dashboard.clerk.com), then set their `publicMetadata` to `{ "role": "ADMIN" }`. No local password scripts are needed or provided.

---

## ▶ Running the Project

**Development**
```bash
npm run dev
```

**Production build**
```bash
npm run build
```

**Start production server**
```bash
npm start
```

---

## 📂 Project Structure

```
generator-fuel-monitoring-system-full/
├── src/
│   ├── app/
│   │   ├── (main)/       # Main authenticated layout & routes
│   │   ├── api/          # REST API routes (users, technicians, generators)
│   │   ├── sign-in/
│   │   └── sign-up/
│   ├── components/       # Generic UI components (MetricCard, Sidebar, etc.)
│   ├── features/         # Domain logic: analytics, auth, dashboard,
│   │                     # fuel-refills, fuel-requests, generators,
│   │                     # regions, sites, technicians, transactions, users
│   ├── hooks/
│   ├── lib/
│   │   ├── ability.ts    # CASL role-based permission definitions
│   │   ├── auth.ts       # Clerk session + role helpers
│   │   ├── db.ts         # Prisma client singleton
│   │   └── server-utils.ts # Structured logger, API error helper
│   └── schemas/          # Zod schemas
├── prisma/
│   └── schema.prisma
├── public/
├── scripts/              # Utility scripts (region seeding etc.)
├── proxy.ts              # Next.js proxy middleware (auth gate)
├── package.json
└── README.md
```

---

## 👥 User Roles

Roles are assigned via Clerk `publicMetadata` (e.g. `{ "role": "ADMIN" }`) and enforced with CASL abilities and `requireRole` guards on every server action and API route.

| Role | Capabilities |
|---|---|
| **TECHNICIAN** | Submit fuel requests, record refuelling in the field (PWA), update generator running hours |
| **SUPERVISOR** | Review and approve/reject fuel requests, monitor site and generator status |
| **MANAGER** | Approve fuel requests at the management stage, view full analytics and reports |
| **FLEET_ADMIN** | Issue Work Orders on approved fuel requests (fleet workflow only) |
| **FINANCE** | Manage Fuel Admin Wallet, record deposit/withdrawal transactions, add finance remarks |
| **ADMIN** | Full system access: manage users, sites, regions, departments, and all records |

---

## 🔐 Security & Code Quality

- **Input validation:** Every server action and API route validates all inputs with Zod before touching the database.
- **Sort injection prevention:** All `sortBy` parameters are validated against explicit allowlists before being passed to Prisma (`ALLOWED_SORT` whitelists in technicians, generators, and analytics queries).
- **Transactional writes:** Generator creation uses `prisma.$transaction` to prevent orphaned `GEN-PENDING-*` records on partial failure.
- **Consistent error handling:** All mutation actions (sites, generators, technicians, transactions) use `try/catch` + structured `logger.error` with clean user-facing error messages. Foreign key violations are caught and surfaced as descriptive messages.
- **Auth:** Exclusively Clerk — no local password hashes, no `better-auth` credential tables, no mixed auth stacks.
- **Correlation logging:** Requests include correlation IDs for traceability in production logs.

---

## 🚀 Future Improvements

- Native mobile application
- AI-based fuel consumption prediction
- Fuel theft detection alerts
- Offline data synchronization for field entry
- SMS and email notifications
- QR code generator identification
- IoT sensor integration for live tank levels

---

## 🤝 Contributing

Contributions are welcome.

1. Fork the repository.
2. Create a feature branch:
   ```bash
   git checkout -b feature/new-feature
   ```
3. Commit your changes:
   ```bash
   git commit -m "Add new feature"
   ```
4. Push to your branch:
   ```bash
   git push origin feature/new-feature
   ```
5. Open a Pull Request.

---

## 📄 License

This project is licensed under the **MIT License**.

---

## 👨‍💻 Author

**Million Tesfahun Tibebu**
Master of Science in Computer Science
Bachelor of Science in Computer Engineering

GitHub: [github.com/Million1921](https://github.com/Million1921)

---

## ⭐ Support

If you found this project helpful, please consider giving it a ⭐ on GitHub.
