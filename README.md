# Advisor Marketing Hub

A dashboard where financial advisors can see everything the **OneStop marketing
team** manages on their behalf — and take action on it.

This is a front-end prototype built with realistic mock data. It's structured so
the mock data layer can be swapped for live APIs without touching the UI.

## Features

1. **Performance dashboard** — site traffic, appointments booked through the
   site, and leads generated, with month-over-month trends, a performance chart,
   and a traffic-sources breakdown.
2. **Content approvals** — review upcoming social/blog/email posts and approve
   them or request changes with feedback.
3. **Print orders** — browse a catalog of brand materials, submit an order
   request with quantity/shipping/notes, and track every job from submission to
   delivery.
4. **Support** — a one-click support button (in the top bar and on the Support
   page) to request help for digital, print, website, or marketing-strategy
   needs, plus a list of your open requests.
5. **SEO & keywords** — overall SEO score, domain authority, backlinks, average
   rank trend, site-health issues, and a keyword progression table.

## Tech stack

- [Vite](https://vite.dev/) + [React 18](https://react.dev/) + TypeScript
- [Tailwind CSS v4](https://tailwindcss.com/)
- [Recharts](https://recharts.org/) for charts
- [lucide-react](https://lucide.dev/) for icons
- [React Router](https://reactrouter.com/) for navigation

## Getting started

```bash
npm install
npm run dev      # start the dev server (http://localhost:5173)
npm run build    # type-check + production build
npm run preview  # preview the production build
```

## Project structure

```
src/
  components/
    layout/      # Sidebar, Topbar, app shell
    support/     # Shared support-request modal
    ui/          # Card, Badge, Button, Modal, StatCard, Toast
  data/
    mockData.ts  # All sample data (swap for real API calls)
  lib/           # Formatting + status-label helpers
  pages/         # Dashboard, ContentApprovals, PrintOrders, Seo, Support
  state/         # In-memory app state + support-modal context
  types.ts       # Shared domain types (mirror a real API shape)
```

## Wiring up real data

Each feature reads from `src/data/mockData.ts` and mutates through
`src/state/AppState.tsx`. To go live, replace those reads/writes with calls to
your real services. The repo's connected integrations are a natural fit:

- **Analytics** (traffic / appointments / leads) → Google Analytics or your CRM
- **Content approvals** → your content calendar / Canva designs
- **Print & support requests** → ticketing (e.g. via Zapier) or email
- **SEO** → your SEO tooling's API

The `types.ts` interfaces define the contract each integration needs to satisfy.
