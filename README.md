# service-guide-tool

## Supabase keep-alive

Vercel calls `/api/cron/heartbeat` daily at 08:00 UTC, as configured in
`vercel.json`. Each call reads at most one vehicle ID from Supabase to generate
database activity without modifying data. The route is dynamic so each run
performs a fresh query.

Before deploying to production, set a strong random `CRON_SECRET` in the Vercel
project's Production environment variables. Vercel automatically sends it as an
`Authorization: Bearer <CRON_SECRET>` header. Requests with a missing or incorrect
secret are rejected.

The endpoint also uses the app's existing `NEXT_PUBLIC_SUPABASE_URL` and
`NEXT_PUBLIC_SUPABASE_ANON_KEY` variables. Cron jobs become active on a production
deployment. A failed database query returns HTTP 500 and is logged in Vercel.
