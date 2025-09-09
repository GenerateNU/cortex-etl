# Cortex ETL Frontend Documentation

## Architecture Overview

Next.js 15 application with App Router, providing a multi-tenant interface for ETL operations. Built with TypeScript, Tailwind CSS, and NextAuth for authentication.

## Tech Stack

### Core Framework
- **Next.js 15.5.2**: React framework with App Router
  - Choice rationale: SSR capabilities, file-based routing, built-in optimizations
  - App Router for React Server Components
  - Turbopack attempted (disabled due to Windows issues)

### State & Data Management
- **TanStack Query 5.87.1**: Server state management
  - Replaces React Query naming
  - Caching, synchronization, background updates
  - Optimistic updates for better UX
- **React 19.1.0**: Latest stable with improved performance

### Authentication
- **NextAuth 4.24.11**: Authentication solution
  - JWT strategy (stateless)
  - Credentials provider for backend integration
  - Role-based route protection via middleware
  - Session management without database

### Styling
- **Tailwind CSS 3**: Utility-first CSS
  - Downgraded from v4 due to compatibility
  - PostCSS for processing
  - Dark mode support via CSS variables

### HTTP Client
- **Axios 1.11.0**: API communication
  - Interceptors for auth token injection
  - Better error handling than fetch

## Project Structure

```
frontend/
├── app/
│   ├── (auth)/              # Public routes group
│   │   └── login/
│   │       └── page.tsx     # Login form
│   ├── (protected)/         # Auth required group
│   │   ├── dashboard/
│   │   │   └── page.tsx     # User dashboard
│   │   ├── admin/
│   │   │   └── page.tsx     # Admin panel
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
│   └── navbar.tsx          # Navigation component
├── lib/
│   └── api.ts             # Axios instance
├── types/
│   └── next-auth.d.ts    # Extended auth types
├── middleware.ts          # Route protection
└── .env.local            # Environment config
```

## Design Decisions

### App Router vs Pages Router
**App Router chosen** for modern React features:
- Server Components by default
- Improved data fetching
- Layouts and nested routing
- Streaming and Suspense

### Authentication Strategy
**NextAuth with JWT** instead of alternatives:
- No session database required
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
- Better caching than SWR
- Optimistic updates
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

### Session Structure
```typescript
{
  user: {
    email: string
    role: "admin" | "tenant_user"
    tenantId: number | null
  }
}
```

### Route Protection
Middleware intercepts requests to:
- `/dashboard/*` - Tenant users
- `/admin/*` - Admin only

Unauthorized users redirected to `/login`

## Component Architecture

### Providers Hierarchy
```tsx
<SessionProvider>     // NextAuth context
  <QueryClientProvider> // TanStack Query
    {children}
  </QueryClientProvider>
</SessionProvider>
```

### Protected Layout
- Navbar with role-based links
- Logout functionality
- User info display

### API Client Configuration
```typescript
// Axios interceptor adds auth header
Authorization: Bearer [session.user.email]
```

## Type Safety

### Extended NextAuth Types
- User: Added role and tenantId
- Session: Typed user object
- JWT: Custom claims

### TypeScript Configuration
- Strict mode enabled
- Path aliases via `@/*`
- Type checking in build

## Styling Architecture

### Tailwind Configuration
- Core utility classes only
- Custom CSS variables for theming
- Dark mode via prefers-color-scheme
- Responsive design utilities

### CSS Variables
```css
--background: Light/dark mode colors
--foreground: Text colors
```

## Performance Optimizations

### Current Implementation
- Static generation where possible
- Client-side navigation
- Code splitting per route
- Image optimization (built-in)

### Bundle Size
- Tree shaking enabled
- Dynamic imports for heavy components
- Standalone output for Docker

## Development Experience

### Hot Module Replacement
- Fast Refresh for React components
- CSS changes instant
- State preserved during updates

### Error Handling
- Error boundaries per route
- Fallback UI for loading states
- Form validation feedback

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

## Testing Strategy (Planned)

### Unit Tests
- Jest for component testing
- React Testing Library
- Mock NextAuth sessions

### E2E Tests
- Playwright for user flows
- Multi-tenant scenarios
- Cross-browser testing

## Build & Deployment

### Development
```bash
npm run dev
# Available at http://localhost:3000
```

### Production Build
```bash
npm run build
npm start
```

### Docker Configuration
- Multi-stage build (planned)
- Standalone output
- Node 18 Alpine base

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

### UI Customization (Planned)
- Tenant-specific branding
- Custom color schemes
- Logo upload capability

## Future Enhancements

### File Upload System
- Drag-and-drop interface
- Progress indicators
- Chunked uploads for large files
- Resume capability

### Real-time Updates
- WebSocket for ETL progress
- Server-sent events for notifications
- Live data refresh

### Advanced Features
- Data visualization with D3/Recharts
- Export functionality
- Bulk operations UI
- Audit log viewer

## Common Issues & Solutions

### Windows Development
- Turbopack disabled (compatibility)
- Path separator issues
- Hot reload inconsistencies
- Solution: Standard dev mode without Turbopack

### Tailwind v4 Migration
- Downgraded to v3 for stability
- LightningCSS issues on Windows
- PostCSS configuration required

### Type Errors
- NextAuth types extended via declaration
- Session type augmentation
- Proper null checking required

## Performance Metrics

### Target Metrics
- First Contentful Paint: <1.5s
- Time to Interactive: <3s
- Lighthouse Score: >90

### Monitoring (Planned)
- Vercel Analytics
- Custom performance marks
- Error tracking (Sentry)
- User session recording