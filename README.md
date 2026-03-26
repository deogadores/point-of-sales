# Point of Sales

A modern, multi-tenant web application for managing products, stock, sales, and customer reservations.

## Features

### POS Core

- Track **products** with unit cost, sale price, and images
- Record **stock adjustments** with reasons and full movement history
- Record **sales** with automatic stock decrement and profit tracking
- Configurable **units of measurement** per product
- **Dashboard** with sales analytics, profit trends, and low-stock overview (7-day, 30-day, 12-month charts)

### Reservations

- Customer-facing public reservation page per store
- Multi-step payment status workflow: Created → Waiting for Payment → Payment Sent → Payment Confirmed → Completed
- Payment proof upload by customers (up to 7 MB)
- Captures customer name, email, phone, and notes
- Live notifications for staff when reservations are created or updated

### Authentication and Access Control

- Centralized authentication via an external auth API (`tools-auth-api`)
- Invitation-only registration using admin-generated phrases
- Store-level role-based access: Owner and Staff roles
- Protected routes with middleware-based session validation
- JWT sessions stored as `httpOnly` cookies

### Multi-tenancy and Store Management

- Each user creates or joins their own store after registration
- Invite codes for adding staff members
- Users can be members of multiple stores

### Settings

- Per-store currency configuration
- Toggle live reservation notifications

## Tech Stack

- **Framework**: Next.js 15 (App Router, Server Actions)
- **Database**: SQLite (local) / Turso (production)
- **ORM**: Drizzle ORM
- **Auth**: Custom JWT via centralized `tools-auth-api`
- **UI**: Tailwind CSS + Headless UI
- **Charts**: Recharts
- **Validation**: Zod
- **Storage**: Vercel Blob (production) / local filesystem (development)
- **Real-time**: Server-Sent Events (SSE)
- **Deployment**: Vercel

## License

GPL-3.0
