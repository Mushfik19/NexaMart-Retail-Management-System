# NexaMart Retail Management System

NexaMart is a comprehensive Retail Management and Point of Sale (POS) system built with Next.js and Prisma. It is designed to handle multiple stores, inventory, stock transfers, purchasing, customer loyalty, and daily store operations.

## Features

- **Multi-Store Management**: Manage multiple stores and warehouses from a central dashboard.
- **Point of Sale (POS)**: Robust POS system with barcode scanning, discounts, taxes, and multi-payment support.
- **Inventory & Stock Control**: Track inventory levels, stock transfers between stores, batch tracking, and perishable goods management.
- **Purchasing**: Generate purchase orders and receive goods directly into inventory.
- **Cash Register Management**: Open and close shifts, track expected cash vs actual cash, and manage cash movements.
- **User Roles & Permissions**: Comprehensive RBAC (Role-Based Access Control) supporting roles like Super Admin, Store Manager, Cashier, etc.
- **Customer Loyalty**: Track customer spending, points balance, and loyalty tiers.
- **Audit Trails**: Extensive logging of inventory transactions and user actions for accountability.

## Tech Stack

- **Frontend & Backend**: Next.js (App Router)
- **Database**: Prisma ORM (SQLite for development, adaptable to PostgreSQL/MySQL)
- **Language**: TypeScript
- **Styling**: Tailwind CSS (if configured)

## Getting Started

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Mushfik19/NexaMart-Retail-Management-System.git
   cd NexaMart-Retail-Management-System
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up the database:**
   ```bash
   npx prisma generate
   npx prisma db push
   # Optional: run seed script if available
   # npx prisma db seed
   ```

4. **Run the development server:**
   ```bash
   npm run dev
   ```

5. **Open your browser:**
   Navigate to `http://localhost:3000` to access the application.

## Deployment

This project can be easily deployed on [Vercel](https://vercel.com/):

1. Push your code to GitHub.
2. Import the project in Vercel.
3. Add the `DATABASE_URL` to the Environment Variables.
4. Vercel will automatically build and deploy your application.

## License

This project is licensed under the MIT License.
