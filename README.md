# Generator Fuel Monitoring System

A comprehensive, automated system for tracking fuel deliveries, generator running hours, and consumption deviations for Ethio Telecom sites.

## Features

- **Automated Fuel Journal**: Captures physical delivery records (FuelRefills) automatically.
- **Consumption Analytics**: Calculates running hour differences and tracks fuel usage deviations.
- **Site Management**: Manage generators and site metadata across different regions.
- **Mobile Optimized**: Responsive PWA interface for field engineers to record data on-site.
- **Work Order Tracking**: Integration with maintenance work orders for accurate financial reporting.

## Technology Stack

- **Framework**: [Next.js](https://nextjs.org) (App Router)
- **Database**: [PostgreSQL](https://www.postgresql.org) with [Prisma ORM](https://www.prisma.io)
- **Authentication**: [Clerk](https://clerk.com)
- **Styling**: [Tailwind CSS](https://tailwindcss.com)
- **UI Components**: [Radix UI](https://www.radix-ui.com) & [Lucide Icons](https://lucide.dev)

## Getting Started

1. **Environment Setup**:
   Create a `.env` file with your database connection string and authentication secrets.

2. **Install Dependencies**:
   ```bash
   npm install
   ```

3. **Database Migration**:
   ```bash
   npx prisma migrate dev
   ```

4. **Run Development Server**:
   ```bash
   npm run dev
   ```

5. **Production Build**:
   ```bash
   npm run build
   ```

## Project Structure

- `src/app`: Next.js routes and pages (Main, Auth, and Mobile layouts).
- `src/features`: Shared logic, components, and queries grouped by business domain.
- `src/components`: Generic UI components.
- `src/lib`: Shared utilities, constants, and configuration.
- `prisma`: Database schema and seed scripts.

---
© 2026 Generator Fuel Monitoring System
