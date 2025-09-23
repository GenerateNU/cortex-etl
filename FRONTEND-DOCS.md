# Cortex ETL Frontend Documentation

## Architecture Overview

Next.js 15 application with App Router, providing a multi-tenant interface for ETL operations. Built with TypeScript, Tailwind CSS, and NextAuth for authentication.

## Tech Stack

### Core Framework

- **Next.js 15.5.2**: React framework with App Router
  - Choice rationale: SSR capabilities, file-based routing, built-in optimizations
  - App Router for React Server Components
  - Turbopack

### State & Data Management

- **TanStack Query 5.87.1**: Server state management
- **React 19.1.0**: Latest stable with improved performance

### Authentication

- **NextAuth 4.24.11**: Authentication solution
  - JWT strategy (stateless)
  - Credentials provider for backend integration
  - Role-based route protection via middleware

### Styling

- **Tailwind CSS 3**: Utility-first CSS

### HTTP Client

- **Axios 1.11.0**: API communication

## Project Structure

```
frontend/
├── app/
│   ├── (auth)/              # Public routes group
│   ├── (protected)/         # Auth required group
│   │   └── layout.tsx       # Protected layout with navbar
│   ├── api/
│   │   └── auth/
│   │       └── [...nextauth]/
│   │           └── route.ts # NextAuth handler
│   ├── globals.css          # Global styles
│   ├── layout.tsx           # Root layout
│   ├── page.tsx            # Home page
│   └── providers.tsx       # Context providers
├── components/
├── lib/
│   └── api.ts             # Axios instance
├── types/
├── middleware.ts          # Route protection
└── .env.local            # Environment config
```

## Design Decisions

### Authentication Strategy

**NextAuth with JWT** instead of alternatives:

- Works with stateless backend
- Built-in CSRF protection
- Extensible providers for future OAuth

### Route Organization

**Route groups** for logical separation:

- `(auth)`: Public authentication pages
- `(protected)`: Requires authentication
- Parentheses prevent URL impact

### State Management

**TanStack Query** over alternatives:

- Parallel queries support
- DevTools for debugging

## Authentication Flow

### Login Process

1. User submits credentials to `/login`
2. NextAuth calls backend `/api/auth/login`
3. Backend validates and returns JWT
4. NextAuth wraps in session
5. Token stored in HTTP-only cookie
6. Middleware validates on protected routes

## Security Measures

### Current Implementation

- HTTPS-only cookies (production)
- CSRF protection via NextAuth
- Environment variables for secrets
- Input sanitization on forms

### Production Requirements

- Content Security Policy headers
- Rate limiting on auth
- Secure headers configuration
- API key rotation

## Environment Variables

### Required

- `NEXT_PUBLIC_API_URL`: Backend endpoint
- `NEXTAUTH_URL`: App URL
- `NEXTAUTH_SECRET`: JWT signing secret

### Development Values

```
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=dev-secret
```

## Multi-Tenant Considerations

### Tenant Isolation

- Dashboard shows only tenant data
- API calls include tenant context
- Admin can switch tenant view
