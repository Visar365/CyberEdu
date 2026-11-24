# Agjenti autonom i CyberEdu

Vercel Cron nis automatikisht një cikël çdo ditë në 03:00 UTC (pa klikuar buton në faqe). Agjenti ngarkon vetë katalogun fillestar me 26 mësime dhe shton një mësim të ri në çdo cikël të suksesshëm, duke e zgjeruar kursin gradualisht. Ai kontrollon temat ekzistuese për të shmangur përsëritjet, nuk fshin ose zëvendëson mësimet ekzistuese, dhe rifreskon këshillën apo tekstet e faqes kur ka vlerë. Mësimet e reja mbështeten në burime zyrtare; përmbajtja ruhet në Redis dhe u shfaqet vizitorëve.

Agjenti mund të menaxhojë përmbajtjen, njoftimin, tekstet kryesore, këshillën e ditës, mësimet e paraqitura dhe seksionet ekzistuese. Nuk ndryshon kodin, dizajnin, hyrjen, domenin ose të dhënat e nxënësve; për një veçori interaktive krejt të re kërkohet zhvillim dhe publikim i kontrolluar.

## Konfigurimi në Vercel

1. Te projekti `cyberedu-web`, hap **Storage** dhe krijo/lidh një bazë **Upstash Redis** vetëm për CyberEdu. Mos përdor databazë ose kredenciale të projekteve të tjera. Lidhja shton zakonisht `KV_REST_API_URL` dhe `KV_REST_API_TOKEN`.
2. Te **Settings → Environment Variables**, shto në **Production**:
   - `OPENAI_API_KEY` — çelësi yt privat i OpenAI API. Thirrjet model/web search faturohen nga OpenAI.
   - `CRON_SECRET` — sekret i gjatë dhe privat për autorizimin e auditimit të planifikuar.
   - `LESSON_AGENT_KEY` — sekret tjetër, vetëm nëse dëshiron të përdorësh panelin e udhëzimeve manuale.
   - `KV_REST_API_URL` dhe `KV_REST_API_TOKEN` — nga Upstash nëse integrimi nuk i shtoi vetë.
3. Ruaji variablat dhe bëj **Redeploy** të Production. Pas deploy-it, Cron nis vetë; auditimi i parë do të ndodhë në orarin e radhës.

Për auditim të menjëhershëm ose kërkesë të posaçme, hyr te **Mësimet → Hap panelin e AI-së**. Paneli kërkon `LESSON_AGENT_KEY`. Cikli ditor përdor një kërkesë AI dhe shton maksimumi një mësim të ri. Thirrjet e OpenAI API mund të tarifohen sipas llogarisë. Modeli parazgjedhur është `gpt-4.1-mini`; `OPENAI_MODEL` mund të përdoret për ta ndërruar.

Vercel Cron punon vetëm në Production dhe dërgon `CRON_SECRET` si bearer token. Upstash REST ruan katalogun përtej jetëgjatësisë së funksioneve serverless.
