# Go-Live Checklist

Switch the Advisor Marketing Hub from demo mode to fully live. Everything is
built and deployed — these steps connect the real backend.

**Accounts:** Supabase (required), Vercel (required, connected), Zapier
(sending — optional), Google Cloud (analytics sync — optional).

---

## Core setup (makes it live)

### 1. Create the database tables — required
Supabase → **SQL Editor** → paste all of [`supabase/schema.sql`](../supabase/schema.sql) → **Run**.
Creates `profiles`, `service_tasks`, `advisors_data`, `advisor_workspace` (safe to re-run).

> The recursion fix is already applied. Do **not** add an "admins read all profiles"
> policy that queries `profiles` — it causes infinite recursion.

### 2. Add environment variables — required
Vercel → Project → **Settings → Environment Variables** (Production):

| Variable | Scope | Value |
| --- | --- | --- |
| `VITE_SUPABASE_URL` | public | Supabase → Settings → API → Project URL |
| `VITE_SUPABASE_ANON_KEY` | public | anon public key |
| `VITE_ADMIN_EMAIL` | public | `team@onestopprintco.com` |
| `SUPABASE_URL` | server | same Project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | **secret** | service_role key — server only, never the browser/repo/chat |
| `ADMIN_EMAIL` | server | `team@onestopprintco.com` |
| `ZAPIER_WEBHOOK_URL` | server | step 5 (blank until then) |
| `CRON_SECRET` | secret | step 5 — any random string |
| `GOOGLE_SERVICE_ACCOUNT_KEY` | secret | step 6 — full JSON key |

### 3. Redeploy — required
Vercel → Deployments → ⋯ (latest) → **Redeploy**. Then open
`/api/auth/status` — it should return `{"adminExists":false,...}`.

### 4. Create the admin account & add the team — required
Open the site → it offers to **create the admin** for `team@onestopprintco.com` →
choose a password. Then add teammates/advisors under **Team & Access**. Sign in as
an advisor (incognito) to confirm their scoped view.

---

## Integrations (optional)

### 5. Turn on sending — optional
One Zapier **Catch Hook** powers review requests, birthday/holiday greetings, and
notification emails via your connected Gmail.
1. Zapier → Create Zap → **Webhooks by Zapier → Catch Hook**; copy the URL.
2. Add a **Gmail → Send Email** action, mapping `to`, `subject`, `body`.
3. Vercel: set `ZAPIER_WEBHOOK_URL` and `CRON_SECRET` (random string), then redeploy.

The app posts this payload to the hook:
```json
{ "purpose": "review_request | birthday | holiday | notification",
  "channel": "email | sms", "to": "...", "name": "...", "subject": "...", "body": "..." }
```

### 6. Connect Google analytics — optional
Enables the **Sync now** button (GA4 traffic + Search Console keyword positions).
Manual entry/overrides work with or without this.
1. Google Cloud: enable the **Analytics Data API** + **Search Console API**.
2. Create a **service account**, download its JSON key.
3. Grant it access to each advisor's GA4 property + Search Console.
4. Vercel: set `GOOGLE_SERVICE_ACCOUNT_KEY` (full JSON), redeploy.
5. Per advisor (Analytics tab): set source to Google, enter GA4 Property ID +
   Search Console URL, hit **Sync now**.

---

## Verify
- `/api/auth/status` returns JSON.
- The site requires login.
- Add a client → reload → it persists.
- Request a review → **Send now** → the email arrives.

## After go-live — natural next builds
- Link advisor logins to their advisor record (full multi-tenant scoping).
- Move video testimonials to Supabase Storage.
- Auto-log more team activity from live events (published posts, shipped orders).
