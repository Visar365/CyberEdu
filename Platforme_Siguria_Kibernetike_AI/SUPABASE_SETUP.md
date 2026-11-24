# Llogaritë dhe progresi online

CyberEdu mund t’i ruajë llogaritë dhe përparimin personal në Supabase. Pa këtë konfigurim, profilet ruhen vetëm në shfletues.

## Konfigurimi

1. Krijo projekt Supabase dhe kopjo Project URL, Publishable key dhe Secret key.
2. Në SQL Editor ekzekuto `supabase/migrations/202611240001_cyberedu_progress.sql`.
3. Te Auth / URL Configuration cakto Site URL dhe Redirect URL si `https://cyberedu-web.vercel.app`.
4. Në Vercel / Settings / Environment Variables vendos për Production `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY` dhe `SUPABASE_SECRET_KEY`. Secret key ruhet vetëm në server dhe nuk vendoset në kod apo në shfletues.
5. Redeploy projektin. Përdoruesit krijojnë llogari dhe konfirmojnë email-in; progresi i tyre sinkronizohet pas hyrjes.
