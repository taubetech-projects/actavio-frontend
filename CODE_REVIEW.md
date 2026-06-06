# CODE_REVIEW.md

This document contains a professional code review of the actavio-frontend codebase, covering critical issues, moderate issues, minor issues, and a prioritized list of missing pieces.

---

## Summary

The UI foundation is solid — component structure, context separation, and routing are well-organized. The main gaps are in the infrastructure layer (authentication, persistence, API). The code is production-ready in appearance but contains no real functionality behind the UI.

---

## Critical Issues

These must be fixed before any real users interact with the application.

---

### C1 — Authentication is entirely fake but looks real

**File:** `lib/auth-context.tsx`

`AuthContext` simulates 1-second API delays using `setTimeout` to feel like real network calls. There is zero security — no backend, no token, no session. This is a structural trap: the entire file needs to be rewritten when connecting a real backend.

The interface design is good and should be kept. The implementation of each method (`login`, `signup`, etc.) must become a thin wrapper over `fetch()` calls instead of self-contained mock logic.

---

### C2 — No `middleware.ts` — route protection is bypassable

**Files:** `app/dashboard/page.tsx`, `app/admin/page.tsx`, `app/admin/users/page.tsx`

All protected routes rely on client-side `useEffect` + `router.push` for redirects:

```typescript
useEffect(() => {
  if (!user) router.push('/login')
}, [user])
```

**Problems:**
- The page renders for a split second before the redirect fires (layout flash)
- A user with JavaScript disabled can access the page content
- There is no server-side protection whatsoever
- Admin pages are publicly accessible to anyone who navigates directly

**Fix:** Create `middleware.ts` at the repo root to intercept requests server-side before any page renders. See `ARCHITECTURE.md` section 2.4 for the implementation.

---

### C3 — TypeScript errors are silently ignored in production builds

**File:** `next.config.mjs`

```javascript
typescript: {
  ignoreBuildErrors: true,
}
```

This means broken types will never cause a build failure. Type errors will be silently shipped to production. Remove this flag and fix any type errors that surface.

---

### C4 — Tasks are hardcoded inside a page component

**File:** `app/dashboard/tasks/page.tsx`

The entire task dataset is initialized as a `useState` array directly inside the page component with hardcoded objects. There is no service layer, no `lib/tasks.ts`, no type definition file. When backend integration is needed, this will require a full rewrite of the component rather than a simple data source swap.

**Fix:** Extract task data and operations into `lib/api/tasks.ts`. Define the `Task` interface in `lib/types/task.ts`. The component should only call `getTasks()`, `createTask()`, etc.

---

### C5 — Sensitive data passed in URL query parameters

**File:** `app/api/chat/auth/resend-email/route.ts`

```typescript
const email = request.nextUrl.searchParams.get('email')
```

Email addresses are read from a **query parameter on a POST request**. Query parameters appear in:
- Server access logs
- Browser history
- CDN and proxy logs
- Referrer headers

Sensitive data must be passed in the **request body**:

```typescript
// Correct approach
const { email } = await request.json()
```

---

## Moderate Issues

These degrade quality or will cause pain as the app scales.

---

### M1 — No form validation library used on auth forms

**Files:** `app/login/page.tsx`, `app/signup/page.tsx`

Both forms use plain `useState` + manual `if` checks instead of React Hook Form + Zod, which are already installed. The signup password requirements are reimplemented manually:

```typescript
// Current — brittle, duplicated logic
const hasMinLength = password.length >= 8
const hasNumber = /\d/.test(password)
const hasUppercase = /[A-Z]/.test(password)
```

This same logic is duplicated in `app/reset-password/page.tsx`. A shared Zod schema would define it once, validate on both client and (future) server, and work natively with React Hook Form.

---

### M2 — `use client` on almost every page

Most pages are fully client-rendered despite using Next.js App Router, which defaults to Server Components. The main performance benefits of App Router (smaller JS bundle, server-side data fetching, better SEO) are not being used.

Pages like `/dashboard`, `/dashboard/tasks`, and `/admin/users` should fetch their initial data on the server and pass it as props to client components that handle interactivity.

---

### M3 — No error boundaries

If any component throws a runtime error, the entire page crashes to a white screen with no user-friendly message. Next.js App Router supports route-level error handling via `error.tsx` files, which are not present anywhere.

**Files to create:**
```
app/error.tsx                    ← global fallback
app/dashboard/error.tsx          ← dashboard section fallback
app/admin/error.tsx              ← admin section fallback
```

---

### M4 — Admin role check is client-side only

**File:** `app/admin/page.tsx`, `app/admin/users/page.tsx`

```typescript
if (user?.role !== 'admin') {
  router.push('/dashboard')
}
```

This only prevents the UI from rendering. Anyone can call admin API endpoints directly — bypassing the UI check entirely. Role validation must be enforced server-side in the API routes, not in the browser.

---

### M5 — `translations.ts` is a single 1,441-line file

**File:** `lib/translations.ts`

All three languages (English, German, Bengali) are in one file. This will become unmanageable as the app grows and impossible to hand off to external translators. See `ARCHITECTURE.md` section 2.8 for the recommended split.

---

### M6 — Onboarding state is lost on browser refresh

**File:** `app/onboarding/page.tsx`

All 6 onboarding steps are managed with `useState` inside the page component. A browser refresh on any step returns the user to Step 1 with all input cleared. For a flow that involves voice input and tool connection, this is a poor experience.

**Fix:** Persist step progress to `sessionStorage` (client-only, quick fix) or to the database (server-side, proper fix) so users can resume where they left off.

---

## Minor Issues

These are low-severity but should be addressed before launch.

---

### m1 — Image optimization disabled

**File:** `next.config.mjs`

```javascript
images: { unoptimized: true }
```

This disables Vercel's free automatic image optimization (WebP conversion, responsive sizes, CDN caching). This flag is only needed for fully static exports. Remove it unless exporting to a static host.

---

### m2 — Console log in production API route

**File:** `app/api/chat/auth/resend-email/route.ts`

```typescript
console.log(`[API] Resend verification email requested for: ${email}`)
```

Raw `console.log` in API routes logs to the production server without log levels, structured formatting, or the ability to filter by severity. Replace with a proper logger (e.g., `pino`) that supports log levels and structured JSON output.

---

### m3 — Theme/language context has potential SSR hydration mismatch

**Files:** `lib/theme-context.tsx`, `lib/i18n-context.tsx`

Both contexts read from `localStorage` on initialization. During server-side rendering, `localStorage` is not available — the server renders with the default value, but the client immediately switches to the stored value, causing a hydration mismatch warning (and potential flash of wrong theme/language).

**Fix:** Use Next.js `suppressHydrationWarning` on `<html>` for theme (already common practice) and wrap initial `localStorage` reads in a `useEffect` or use the `use client` directive carefully.

---

### m4 — Demo credentials visible in the login UI

**File:** `app/login/page.tsx`

The login page displays demo credentials in plain text in the UI:
```
demo@taskflow.com / demo123
admin@taskflow.com / admin123
```

This is acceptable for a demo but must be removed before any real users are onboarded. Leaving this in creates a false expectation that all credentials are visible.

---

### m5 — No loading or 404 pages

The following files do not exist but are expected by Next.js App Router:

| File | Purpose |
|---|---|
| `app/loading.tsx` | Shown during page navigation |
| `app/not-found.tsx` | Shown for unmatched routes |
| `app/dashboard/loading.tsx` | Skeleton during dashboard load |

Without `loading.tsx`, navigation shows no visual feedback. Without `not-found.tsx`, unhandled routes show a generic Next.js error page.

---

## Missing Pieces — Prioritized

### P0 — Blockers for production

| Missing | Why It Matters |
|---|---|
| `middleware.ts` for route protection | Admin and dashboard pages are publicly accessible |
| Real authentication (JWT + httpOnly cookies) | All data is accessible to any user |
| Backend API layer (`lib/api/`) | No real functionality exists |
| Database (Supabase / PlanetScale / Neon) | Zero data persistence |
| `.env.local` with real environment variables | No secrets management |

### P1 — Required before launch

| Missing | Why It Matters |
|---|---|
| `error.tsx` per route segment | Runtime errors crash the full page silently |
| `loading.tsx` per route segment | No visual feedback during navigation |
| `not-found.tsx` | Unmatched routes show a raw Next.js error |
| React Hook Form + Zod on all auth forms | Form data is not properly validated |
| Real email service (Resend / SendGrid) | Email verification sends nothing |
| Rate limiting on API routes | Endpoints can be spammed freely |

### P2 — Important for quality

| Missing | Why It Matters |
|---|---|
| Server Components for data-heavy pages | All JS is currently sent to the browser |
| React Query or SWR for server state | No caching, refetching, or optimistic updates |
| Persistent onboarding state | Browser refresh wipes all progress |
| Type definitions in `lib/types/` | Task, OnboardingSession, NotificationSettings have no shared types |
| Type-safe API client (tRPC or typed fetch) | No contract between frontend and backend |
| Split translation files by language | Single 1,441-line file will keep growing |
| Test suite (Vitest + Testing Library) | Zero test coverage |

### P3 — Nice to have

| Missing | Why It Matters |
|---|---|
| Storybook | Hard to develop UI components in isolation |
| Sentry error tracking | No visibility into production crashes |
| CI/CD pipeline (GitHub Actions) | No automated quality gates on PRs |
| `robots.txt` and `sitemap.xml` | SEO — search engines have no guidance |
| OpenGraph meta tags | Social sharing links show no preview |
| `CHANGELOG.md` | No record of what changed between versions |

---

## What's Done Well

- Clean component structure — auth, dashboard, onboarding, landing are all properly separated
- Strong TypeScript typing throughout — no `any` types observed
- Consistent use of Zod and React Hook Form is set up (just not wired to forms yet)
- Radix UI + shadcn/ui gives accessible, composable UI primitives
- i18n is comprehensive — 3 languages with fallback and browser detection
- Theme context correctly applies class to `<html>` root
- Auth context interface is well-designed and maps cleanly to what a real API would expose
- Onboarding wizard has a clear, maintainable step machine pattern
- Responsive design implemented throughout
