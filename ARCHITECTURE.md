# ARCHITECTURE.md

This document describes the high-level and low-level architecture of the TaskFlow AI (actavio-frontend) application.

---

## Part 1: High-Level Architecture

The high-level architecture describes **what the system is made of and how layers communicate** — a bird's-eye view of the entire system.

### Current State (What Exists)

```
┌─────────────────────────────────────────────────────────┐
│                     CLIENT (Browser)                    │
│                                                         │
│   ┌─────────────────────────────────────────────────┐   │
│   │           Next.js 16 Application               │   │
│   │                                                 │   │
│   │  ┌──────────┐  ┌──────────┐  ┌──────────────┐  │   │
│   │  │  Pages   │  │Components│  │  Contexts    │  │   │
│   │  │ (Routes) │  │  (UI)    │  │  (State)     │  │   │
│   │  └──────────┘  └──────────┘  └──────────────┘  │   │
│   │                                                 │   │
│   │  ┌─────────────────────────────────────────┐   │   │
│   │  │        In-Memory Mock Data              │   │   │
│   │  │  (AuthContext, Tasks, Users)            │   │   │
│   │  └─────────────────────────────────────────┘   │   │
│   └─────────────────────────────────────────────────┘   │
│                                                         │
│   ┌──────────┐  ┌──────────┐  ┌──────────────────────┐  │
│   │localStorage│ │SessionStore│ │  Vercel Analytics  │  │
│   │(theme/lang)│ │(none yet)│ │  (passive tracking)│  │
│   └──────────┘  └──────────┘  └──────────────────────┘  │
└─────────────────────────────────────────────────────────┘
                           │
                    ╔══════╧══════╗
                    ║  NO BACKEND ║  ← critical gap
                    ║  (mock only)║
                    ╚═════════════╝
```

---

### Target State (Production Architecture)

```
┌─────────────────────────────────────────────────────────────┐
│                        Client Layer                         │
│   Next.js 16 App  ──  Vercel CDN  ──  Vercel Analytics     │
└──────────────────────────────┬──────────────────────────────┘
                               │ HTTPS
                               │ REST / GraphQL / WebSocket
┌──────────────────────────────▼──────────────────────────────┐
│                         API Gateway                          │
│          (Rate Limiting, Auth Validation, Routing)          │
└──────┬───────────────────────┬───────────────────────┬──────┘
       │                       │                       │
┌──────▼──────┐   ┌────────────▼──────────┐   ┌───────▼──────┐
│  Auth       │   │   Core Business       │   │   AI / NLP   │
│  Service    │   │   API Service         │   │   Service    │
│             │   │                       │   │              │
│  - login    │   │  - tasks CRUD         │   │  - parse     │
│  - register │   │  - user settings      │   │    voice/text│
│  - refresh  │   │  - admin operations   │   │  - extract   │
│  - oauth    │   │  - file uploads       │   │    intent    │
└──────┬──────┘   └────────────┬──────────┘   └───────┬──────┘
       │                       │                       │
┌──────▼───────────────────────▼───────────────────────▼──────┐
│                        Data Layer                            │
│                                                             │
│  ┌────────────┐  ┌───────────────┐  ┌───────────────────┐  │
│  │  Primary   │  │  Cache Layer  │  │   File Storage    │  │
│  │  Database  │  │  (Redis)      │  │   (S3 / Vercel    │  │
│  │ (PostgreSQL│  │               │  │    Blob)          │  │
│  │  /Supabase)│  │  - sessions   │  │                   │  │
│  │            │  │  - rate limits│  │  - voice files    │  │
│  │            │  │  - i18n cache │  │  - avatars        │  │
│  └────────────┘  └───────────────┘  └───────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                               │
┌──────────────────────────────▼──────────────────────────────┐
│                    External Services                         │
│                                                             │
│  ┌──────────┐  ┌──────────┐  ┌─────────┐  ┌────────────┐  │
│  │  Email   │  │ Calendar │  │  Slack  │  │  Resend /  │  │
│  │ Provider │  │  (Google)│  │  Teams  │  │  SendGrid  │  │
│  └──────────┘  └──────────┘  └─────────┘  └────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## Part 2: Low-Level Architecture

The low-level architecture describes **how the code inside the Next.js app is organized and connected**.

### 2.1 Internal Layer Diagram

```
┌─────────────────────────────────────────────────────────┐
│                     PRESENTATION LAYER                  │
│  app/(pages)/                                           │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐  │
│  │ /login   │ │/dashboard│ │  /admin  │ │/onboarding│  │
│  │ /signup  │ │ /tasks   │ │  /users  │ │           │  │
│  └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘  │
└───────┼─────────────┼────────────┼─────────────┼────────┘
        │             │            │             │
┌───────▼─────────────▼────────────▼─────────────▼────────┐
│                   COMPONENT LAYER                        │
│  components/                                            │
│  ┌────────────┐ ┌────────────┐ ┌───────────────────┐   │
│  │   auth/    │ │ dashboard/ │ │    onboarding/    │   │
│  │auth-layout │ │dash-layout │ │  (6 step screens) │   │
│  └────────────┘ └────────────┘ └───────────────────┘   │
│  ┌────────────┐ ┌────────────┐ ┌───────────────────┐   │
│  │  landing/  │ │    ui/     │ │ theme-toggle etc. │   │
│  │(5 sections)│ │(60+shadcn) │ │                   │   │
│  └────────────┘ └────────────┘ └───────────────────┘   │
└──────────────────────────────┬──────────────────────────┘
                               │
┌──────────────────────────────▼──────────────────────────┐
│                    STATE / LOGIC LAYER                   │
│                                                         │
│  lib/                          hooks/                   │
│  ┌──────────────┐  ┌────────┐  ┌─────────┐ ┌────────┐  │
│  │auth-context  │  │i18n-   │  │use-     │ │use-    │  │
│  │              │  │context │  │mobile   │ │toast   │  │
│  │ - user state │  │        │  │         │ │        │  │
│  │ - auth logic │  │- langs │  │- breakpt│ │- notif.│  │
│  │ - mock users │  │- keys  │  │         │ │        │  │
│  └──────────────┘  └────────┘  └─────────┘ └────────┘  │
│  ┌──────────────┐  ┌────────┐                           │
│  │theme-context │  │utils   │                           │
│  │              │  │        │                           │
│  │- light/dark  │  │- cn()  │                           │
│  │- localStorage│  │        │                           │
│  └──────────────┘  └────────┘                           │
└──────────────────────────────┬──────────────────────────┘
                               │
┌──────────────────────────────▼──────────────────────────┐
│                     DATA / API LAYER                     │
│                                                         │
│  app/api/                       (future: lib/api/)      │
│  ┌──────────────────────────┐   ┌───────────────────┐   │
│  │ /api/chat/auth/          │   │  API client (none │   │
│  │   resend-email/route.ts  │   │  yet — needed!)   │   │
│  │   (stub only)            │   │                   │   │
│  └──────────────────────────┘   └───────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

---

### 2.2 Context Provider Tree (Runtime)

Every component in the application inherits from these providers in this exact order:

```
<html>
  └── <ThemeProvider>             ← controls dark/light class on <html>
        └── <I18nProvider>        ← t() translation function available everywhere
              └── <AuthProvider>  ← user, login(), logout() available everywhere
                    └── <Analytics />
                    └── {children}  ← all pages render here
```

**Current problem:** `AuthProvider` holds auth state, user data, and all mock "API" logic in a single file (`lib/auth-context.tsx`). As the app grows, this becomes unmaintainable. Auth state management and API calls should be separated.

---

### 2.3 Authentication Flow

**Current (mock — client only):**
```
User clicks Login
      │
      ▼
AuthContext.login(email, password)
      │
      ▼
Compare against hardcoded mockUsers array
      │
      ▼
Set user in React state (memory only)
      │
      ▼
Navigate to /dashboard
      │
      ▼  (page refresh = logged out)
State lost — user must log in again
```

**Target (production):**
```
User clicks Login
      │
      ▼
POST /api/auth/login { email, password }
      │
      ▼
Server validates credentials → verifies hashed password
      │
      ▼
Response sets httpOnly cookie (refresh token) + returns access token
      │
      ▼
AuthContext stores access token in memory (NOT localStorage)
      │
      ▼
All API calls send: Authorization: Bearer <access_token>
      │
      ▼
On page refresh → silent token refresh via POST /api/auth/refresh
      │
      ▼
Session persists across browser restarts
```

---

### 2.4 Route Protection Architecture

**Current (client-side only — bypassable):**
```typescript
// dashboard/page.tsx — fragile, causes layout flash
useEffect(() => {
  if (!user) router.push('/login')
}, [user])
```

**Target — Next.js Middleware (does not exist yet):**
```
File: middleware.ts  (repo root)

Every request
      │
      ▼
middleware.ts intercepts BEFORE page renders
      │
      ├── Route is /dashboard/* or /admin/*
      │         │
      │         ├── No auth cookie → redirect to /login (server-side, no flash)
      │         └── Has cookie → allow through
      │
      └── Route is /login or /signup
                │
                ├── Already has auth cookie → redirect to /dashboard
                └── No cookie → allow through
```

```typescript
// middleware.ts (to be created)
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const token = request.cookies.get('auth-token')
  const isAuthPage = request.nextUrl.pathname.startsWith('/login')
  const isProtected = request.nextUrl.pathname.startsWith('/dashboard')
    || request.nextUrl.pathname.startsWith('/admin')

  if (isProtected && !token) {
    return NextResponse.redirect(new URL('/login', request.url))
  }
  if (isAuthPage && token) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }
}

export const config = {
  matcher: ['/dashboard/:path*', '/admin/:path*', '/login', '/signup']
}
```

---

### 2.5 Onboarding Wizard Flow

```
Step 1: Welcome
  [Next]
     │
Step 2: Connect Tool (Google Calendar)
  [Skip] ──────────────────────┐
  [Connect + Next]             │
     │                         │
Step 3: Use Case Selection ◄───┘
  (follow-ups / task-management / calendar)
  [Next]
     │
Step 4: Input (Voice / Text)
  → sets taskData.rawInput
  [Next]
     │
Step 5: Preview & Edit
  ← AI-interpreted task shown
  → user can edit title, dueDate, reminder
  [Confirm]
     │
Step 6: Success
  → completeOnboarding() called on AuthContext
  → navigate to /dashboard

State lives in: onboarding/page.tsx — local useState only
Problem: browser refresh mid-flow resets to Step 1
Fix needed: persist progress to DB or sessionStorage
```

---

### 2.6 Data Models

**Exists — User model** (`lib/auth-context.tsx`):
```typescript
interface User {
  id: string
  email: string
  name: string
  role: "user" | "admin"
  avatar?: string
  emailVerified: boolean
  createdAt: Date
  onboardingCompleted: boolean
}
```

**Missing — models your UI uses but has no type definition for:**

```typescript
// Tasks — currently inline hardcoded arrays in dashboard/tasks/page.tsx
interface Task {
  id: string                            // should be UUID string, not number
  userId: string                        // ownership link — missing
  title: string
  description: string
  dueDate: string
  status: "pending" | "completed"
  priority: "low" | "medium" | "high"
  createdAt: Date                       // missing
  updatedAt: Date                       // missing
  source?: "voice" | "text" | "email"  // missing — core product feature
  aiConfidence?: number                 // missing — shown in onboarding preview
}

// Onboarding — no persistent model exists
interface OnboardingSession {
  userId: string
  completedStep: number
  useCase?: "follow-ups" | "task-management" | "calendar"
  connectedTools: string[]
  rawInput?: string
  completedAt?: Date
}

// Notification settings — used in Settings page but no shared type
interface NotificationSettings {
  emailReminders: boolean
  pushNotifications: boolean
  weeklyDigest: boolean
  marketingEmails: boolean
}
```

---

### 2.7 Recommended File Structure for API Layer

This layer does not exist yet but is needed before any backend integration:

```
lib/
  api/
    client.ts          ← base fetch wrapper (auth headers, error handling)
    auth.ts            ← login, register, refresh, logout
    tasks.ts           ← CRUD operations for tasks
    users.ts           ← admin user management
    settings.ts        ← user settings read/write
    onboarding.ts      ← save/resume onboarding progress
  types/
    user.ts            ← User, NotificationSettings interfaces
    task.ts            ← Task, CreateTaskPayload interfaces
    onboarding.ts      ← OnboardingSession interface
    api.ts             ← ApiResponse<T>, PaginatedResponse<T>
```

---

### 2.8 Recommended i18n File Structure

`lib/translations.ts` is currently 1,441 lines in a single file. Split it:

```
lib/
  i18n/
    en.ts              ← English strings
    de.ts              ← German strings
    bn.ts              ← Bengali strings
    index.ts           ← exports merged type-safe Translation type
```

This allows:
- Independent translation updates per language
- Type-safe key completion in IDE
- Easier to hand off to translators

---

## Part 3: Recommended Next Steps

Ordered by impact vs. effort:

| Priority | Action | Effort |
|---|---|---|
| P0 | Create `middleware.ts` for server-side route protection | 1 hour |
| P0 | Add `loading.tsx` and `error.tsx` per route segment | 2 hours |
| P0 | Add `not-found.tsx` global 404 page | 30 min |
| P1 | Set up Supabase (DB + Auth + Storage) | 1 day |
| P1 | Create `lib/api/` typed fetch client layer | 1 day |
| P1 | Replace mock AuthContext with real API calls | 2 days |
| P1 | Add React Hook Form + Zod to all auth forms | 1 day |
| P2 | Migrate pages to Server Components where possible | 2 days |
| P2 | Add React Query / SWR for server state management | 1 day |
| P2 | Split `translations.ts` into per-language files | 2 hours |
| P2 | Persist onboarding progress to DB or sessionStorage | 4 hours |
| P3 | Set up Vitest + React Testing Library | 1 day |
| P3 | Add Sentry for error tracking | 2 hours |
| P3 | Add `robots.txt`, `sitemap.xml`, OpenGraph meta tags | 2 hours |
