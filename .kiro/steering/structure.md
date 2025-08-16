# Project Structure & Organization

## Directory Structure

```
williamdiskpizza/
├── app/                    # Next.js 14 App Router
│   ├── api/               # API Routes (backend endpoints)
│   ├── admin/             # Admin dashboard pages
│   ├── cadastro/          # User registration
│   ├── cardapio/          # Menu pages
│   ├── checkout/          # Checkout flow
│   ├── conta/             # User account management
│   ├── pedidos/           # Order management
│   ├── layout.tsx         # Root layout
│   ├── page.tsx           # Home page
│   └── globals.css        # Global styles
├── components/            # Reusable React components
│   ├── ui/               # shadcn/ui components
│   ├── admin/            # Admin-specific components
│   ├── cart/             # Shopping cart components
│   ├── checkout/         # Checkout components
│   ├── menu/             # Menu display components
│   └── layout/           # Layout components
├── contexts/             # React Context providers
│   ├── auth-context.tsx  # Authentication state
│   ├── cart-context.tsx  # Shopping cart state
│   └── coupon-context.tsx # Coupon management
├── hooks/                # Custom React hooks
├── lib/                  # Utility libraries
│   ├── auth.ts           # Authentication logic
│   ├── supabase.ts       # Database client
│   ├── db-supabase.ts    # Database operations
│   ├── logging.ts        # Application logging
│   └── utils.ts          # General utilities
├── types/                # TypeScript type definitions
├── docs/                 # Project documentation
├── scripts/              # Build and utility scripts
├── print-server/         # Thermal printer service
└── supabase/             # Supabase configuration
```

## Naming Conventions

**Files & Directories:**
- Use kebab-case for directories: `checkout-simple/`
- Use kebab-case for page files: `esqueci-senha/page.tsx`
- Use PascalCase for React components: `ErrorBoundary.tsx`
- Use camelCase for utilities: `useDebounce.ts`

**Database Fields:**
- Use snake_case for database columns: `full_name`, `created_at`
- Maintain compatibility with legacy camelCase in types
- Always prefer snake_case in new implementations

**API Routes:**
- RESTful naming: `/api/products`, `/api/orders`
- Use HTTP methods appropriately (GET, POST, PUT, DELETE)
- Group related endpoints in folders

## Component Organization

**UI Components (`components/ui/`):**
- Base components from shadcn/ui
- Reusable across the entire application
- Follow Radix UI patterns for accessibility

**Feature Components:**
- Organized by domain: `admin/`, `cart/`, `menu/`
- Co-locate related components
- Use index files for clean imports

**Page Components (`app/`):**
- One component per route
- Use Server Components by default
- Add 'use client' only when necessary

## State Management Patterns

**Global State:**
- Use React Context for app-wide state
- Separate contexts by domain (auth, cart, coupons)
- Provide TypeScript interfaces for all contexts

**Local State:**
- Use useState for component-specific state
- Use useReducer for complex state logic
- Custom hooks for reusable stateful logic

## Database Patterns

**Connection:**
- Always use official Supabase client
- Import from `lib/supabase.ts`
- Never use direct PostgreSQL connections

**Queries:**
- Centralize database operations in `lib/db-supabase.ts`
- Use TypeScript interfaces for all data structures
- Implement proper error handling and logging

**Real-time:**
- Use Supabase subscriptions for live updates
- Implement in custom hooks for reusability
- Handle connection states properly

## Import Conventions

**Path Aliases:**
- `@/components` - Components directory
- `@/lib` - Library utilities
- `@/hooks` - Custom hooks
- `@/types` - Type definitions

**Import Order:**
1. React and Next.js imports
2. Third-party libraries
3. Internal components and utilities
4. Type imports (with `type` keyword)

## Error Handling

**Client-side:**
- Use Error Boundaries for component errors
- Implement toast notifications for user feedback
- Log errors with `frontendLogger`

**Server-side:**
- Use try-catch blocks in API routes
- Return consistent error responses
- Log errors with `appLogger`

## Security Considerations

**Authentication:**
- Validate JWT tokens on protected routes
- Use middleware for route protection
- Implement role-based access control

**Data Validation:**
- Use Zod schemas for input validation
- Sanitize user inputs
- Implement rate limiting on API routes