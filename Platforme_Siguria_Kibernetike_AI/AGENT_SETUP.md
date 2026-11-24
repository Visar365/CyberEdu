# Agjenti autonom i CyberEdu

Vercel Cron nis automatikisht një auditim çdo ditë në 03:00 UTC (pa klikuar buton në faqe). Agjenti ngarkon vetë katalogun fillestar me 26 mësime, kontrollon udhëzimet kibernetike, përditëson mësimet kur gjen ndryshim të vlefshëm dhe rifreskon këshillën ose tekstet e faqes. Përmbajtja e gjeneruar ruhet në Redis dhe u shfaqet vizitorëve. Në ciklin ditor lejohet maksimumi një ndryshim mësimi.

Agjenti mund të menaxhojë përmbajtjen, njoftimin, tekstet kryesore, këshillën e ditës, mësimet e paraqitura dhe seksionet ekzistuese. Nuk ndryshon kodin, dizajnin, hyrjen, domenin ose të dhënat e nxënësve; për një veçori interaktive krejt të re kërkohet zhvillim dhe publikim i kontrolluar.

## Konfigurimi në Vercel

1. Te projekti `cyberedu-web`, hap **Storage** dhe krijo/lidh një bazë **Upstash Redis** vetëm për CyberEdu. Mos përdor databazë ose kredenciale të projekteve të tjera. Lidhja shton zakonisht `KV_REST_API_URL` dhe `KV_REST_API_TOKEN`.
2. Te **Settings → Environment Variables**, shto në **Production**:
   - `OPENAI_API_KEY` — çelësi yt privat i OpenAI API. Thirrjet model/web search faturohen nga OpenAI.
   - `CRON_SECRET` — sekret i gjatë dhe privat për autorizimin e auditimit të planifikuar.
   - `LESSON_AGENT_KEY` — sekret tjetër, vetëm nëse dëshiron të përdorësh panelin e udhëzimeve manuale.
   - `KV_REST_API_URL` dhe `KV_REST_API_TOKEN` — nga Upstash nëse integrimi nuk i shtoi vetë.
3. Ruaji variablat dhe bëj **Redeploy** të Production. Pas deploy-it, Cron nis vetë; auditimi i parë do të ndodhë në orarin e radhës.

Për auditim të menjëhershëm ose kërkesë të posaçme, hyr te **Mësimet → Hap panelin e AI-së**. Paneli kërkon `LESSON_AGENT_KEY`. Auditimi ditor përdor vetëm një kërkesë AI dhe mund të ruajë maksimumi një ndryshim mësimi. Modeli parazgjedhur është `gpt-4.1-mini`; `OPENAI_MODEL` mund të përdoret për ta ndërruar.

Vercel Cron punon vetëm në Production dhe dërgon `CRON_SECRET` si bearer token. Upstash REST ruan katalogun përtej jetëgjatësisë së funksioneve serverless.