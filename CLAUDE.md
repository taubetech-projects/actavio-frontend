# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Development
npm run dev       # Start dev server at http://localhost:3000
npm run build     # Production build
npm run start     # Start production server
npm run lint      # Run ESLint
```

No test runner is configured in this project.

## Architecture

**Next.js 16 App Router** SaaS frontend for "TaskFlow AI" — an AI-powered task management product. EU-hosted, GDPR-compliant.

### State Management

Three React Context providers wrap the entire app (see `app/layout.tsx`):

- **`lib/auth-context.tsx`** — Authentication state. Currently uses a mock in-memory user store with demo credentials (`demo@taskflow.com / demo123`, `admin@taskflow.com / admin123`). Handles login, signup, password reset, email verification, and onboarding state.
- **`lib/theme-context.tsx`** — Light/dark/system theme, persisted to localStorage.
- **`lib/i18n-context.tsx`** — Internationalization for English, German, Bengali with browser language auto-detection. Translation strings live in `lib/translations.ts`.

### Routing

| Route | Purpose |
|-------|---------|
| `/` | Landing page (marketing) |
| `/login`, `/signup` | Auth pages using `components/auth/auth-layout.tsx` |
| `/forgot-password`, `/reset-password`, `/resend-email` | Auth recovery flows |
| `/onboarding` | 6-step multi-screen onboarding flow (components in `components/onboarding/`) |
| `/dashboard` | Main app with stats and tasks |
| `/dashboard/settings`, `/dashboard/tasks` | Dashboard sub-pages |
| `/admin`, `/admin/users` | Admin panel |

The only API route is `POST /api/chat/auth/resend-email` — a stub that simulates email sending.

### UI Stack

- **shadcn/ui** (new-york style) with Radix UI primitives — components in `components/ui/`
- **TailwindCSS v4** — configured via CSS `@theme inline` directive in `app/globals.css` (no separate `tailwind.config` file). Uses OKLch color space with CSS variables for light/dark themes.
- Icons: lucide-react
- Charts: recharts
- Forms: react-hook-form + zod

### Key Config Notes

- `@/*` path alias maps to the repo root
- TypeScript build errors are ignored (`ignoreBuildErrors: true` in `next.config.mjs`) — don't rely on build to catch type errors
- Image optimization is disabled (`unoptimized: true`)
- Adding new shadcn components: `npx shadcn@latest add <component>`
