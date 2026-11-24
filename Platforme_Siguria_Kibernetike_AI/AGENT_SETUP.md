# Agjenti autonom i CyberEdu

Vercel Cron nis një cikël automatik çdo ditë në 03:00 UTC. Në çdo cikël të suksesshëm AI shton një mësim të ri, si dhe nga një pyetje kuizi, skenar laboratori dhe këshillë sigurie. AI rishikon edhe tekstet, këshillën e ditës dhe përmbajtjen/organizimin e seksioneve ekzistuese kur gjen përmirësim me burime zyrtare. Përmbajtja e gjeneruar ruhet në Upstash Redis dhe i shfaqet faqes pas rifreskimit.

AI nuk heq përmbajtjen ekzistuese dhe nuk ndryshon përparimin e nxënësve. Mund të përditësojë tekstet, të shtojë materiale në mësime, kuize, laborator dhe këshilla. Ndryshimet në kod, dizajn, hyrje, domen ose veçori të reja interaktive kërkojnë zhvillim dhe deploy të kodit; cikli ditor nuk i kryen vetë këto ndryshime.

## Konfigurimi në Vercel

1. Te projekti `cyberedu-web`, hap **Storage** dhe krijo/lidh një bazë **Upstash Redis** vetëm për CyberEdu.
2. Te **Settings → Environment Variables**, shto në **Production**:
   - `OPENAI_API_KEY` — çelësi privat i OpenAI API. Thirrjet e modelit dhe kërkimi në web mund të faturohen nga OpenAI.
   - `CRON_SECRET` — sekret i gjatë për autorizimin e Cron-it.
   - `LESSON_AGENT_KEY` — sekret për panelin e komandave manuale.
   - `KV_REST_API_URL` dhe `KV_REST_API_TOKEN` — kredencialet Redis nëse integrimi nuk i ka shtuar vetë.
3. Ruaji variablat dhe bëj **Redeploy** të Production. Cron-i aktivizohet në deploy-in Production.

Për llogari cloud dhe sinkronizimin e përparimit të secilit përdorues, ndiq udhëzuesin [SUPABASE_SETUP.md](SUPABASE_SETUP.md). Pa këtë konfigurim profili vazhdon të jetë vetëm demonstrim lokal.

Për udhëzim të menjëhershëm, përdor **Mësimet → Hap panelin e AI-së** dhe jep një kërkesë të qartë, p.sh. “Shto një pyetje të re për passkeys dhe një skenar të ri për QR phishing; ruaj të gjitha përmbajtjet ekzistuese.” Paneli mund të përditësojë përmbajtje dhe konfigurim, por nuk mund të modifikojë vetë kodin ose dizajnin. Modeli parazgjedhur është `gpt-4.1-mini`; `OPENAI_MODEL` mund të përdoret për ta ndërruar.
