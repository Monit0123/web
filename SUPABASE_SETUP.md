# Supabase setup for the ONYX demo

1. Open the Supabase project dashboard.
2. Open **SQL Editor**.
3. Create a new query.
4. Paste all of `supabase-schema.sql`.
5. Click **Run**.
6. Go to **Authentication → Providers → Email** and enable Email provider.
7. For a demo, you may disable email confirmation. For real use, keep confirmation enabled and configure SMTP.
8. Create one account through the ONYX sign-up screen.
9. In SQL Editor, replace `owner@example.com` in the commented admin query, uncomment it, and run it. This makes that account the demo admin.
10. Reply with “schema complete” so the frontend can be connected to the tables.

## Optional storage bucket

For the member progress-photo demo:

- Storage → New bucket
- Name: `progress-photos`
- Keep it **private**
- Do not make it public

The storage policies and signed-upload flow should be added only after the account flow is connected, so private photos are never exposed by a public URL.

## What the current schema supports

- Public lead capture
- Public free-trial booking requests
- Member profiles
- Member memberships
- Admin/manager/coach roles
- Staff-only lead access
- Member-only booking access
- Audit events

The publishable Supabase key belongs in browser code. Never put the Supabase service-role key in this repository or frontend.
