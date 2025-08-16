# Technology Stack & Build System

## Core Technologies

**Frontend Framework:**
- Next.js 14 with App Router
- React 18 with TypeScript
- Server-side rendering and static generation

**Backend & Database:**
- Next.js API Routes for backend logic
- Supabase (PostgreSQL) as primary database
- Official Supabase client (@supabase/supabase-js) - **NEVER use direct PostgreSQL connections**
- Real-time subscriptions via Supabase channels

**Authentication & Security:**
- Custom JWT implementation with bcryptjs
- Server-side session management
- Role-based access control (customer, admin, kitchen, delivery)

**Styling & UI:**
- Tailwind CSS for styling
- Radix UI components for accessibility
- shadcn/ui component library
- Lucide React for icons
- CSS custom properties for theming

**State Management:**
- React Context API for global state
- Custom hooks for data fetching
- Local storage for cart persistence

**Payment & Integration:**
- Mercado Pago for payment processing
- Thermal printer server for kitchen orders
- Geolocation APIs for delivery

## Development Commands

```bash
# Development
npm run dev              # Start development server
npm run build           # Build for production
npm run start           # Start production server
npm run lint            # Run ESLint
npm run test            # Run Jest tests
npm run type-check      # TypeScript type checking

# Print Server (separate service)
cd print-server
npm install
npm start
```

## Environment Configuration

**Required Variables:**
- `SUPABASE_URL` - Supabase project URL
- `SUPABASE_KEY` - Supabase anon/service role key
- `JWT_SECRET` - Secret for JWT token signing
- `NEXT_PUBLIC_SITE_URL` - Application base URL

**Optional Variables:**
- `MERCADOPAGO_ACCESS_TOKEN` - Payment processing
- `ENABLE_QUERY_LOGS` - Database query logging
- `LOG_LEVEL` - Application logging level

## Database Architecture

- **Primary Database:** Supabase (PostgreSQL)
- **Connection Method:** Official Supabase client only
- **Real-time:** Supabase subscriptions for live updates
- **Security:** Row Level Security (RLS) policies
- **Migration:** Supabase CLI for schema changes

## Key Libraries

- `@supabase/supabase-js` - Database client
- `bcryptjs` - Password hashing
- `jsonwebtoken` - JWT token management
- `zod` - Schema validation
- `date-fns` - Date manipulation
- `class-variance-authority` - Component variants
- `clsx` & `tailwind-merge` - Conditional styling