# Llogaritë online dhe paneli Admin

Paneli Admin është i kyçur nga serveri: vetëm përdoruesi me email-in e verifikuar të vendosur te `CYBEREDU_ADMIN_EMAIL` mund t’i lexojë arritjet. Tabela e përparimit nuk lexohet drejtpërdrejt nga shfletuesit; API-ja e faqes verifikon sesionin përmes Supabase Auth para çdo leximi ose ruajtjeje. Çelësi sekret i Supabase përdoret vetëm në funksionet Vercel.

## Konfigurimi i parë

1. Krijo një projekt Supabase dhe kopjo **Project URL**, **Publishable key** dhe **Secret key** nga paneli i Supabase.
2. Në Supabase SQL Editor ekzekuto `supabase/migrations/202611240001_admin_progress.sql`.
3. Te Supabase Auth, lëre të aktivizuar konfirmimin me email. Te URL Configuration vendos `https://cyberedu-web.vercel.app` si Site URL dhe shtoje po atë adresë te Redirect URLs.
4. Te Vercel → Settings → Environment Variables, vendos për **Production**:
   - `SUPABASE_URL` — Project URL.
   - `SUPABASE_PUBLISHABLE_KEY` — Publishable key (`sb_publishable_…`).
   - `SUPABASE_SECRET_KEY` — Secret key (`sb_secret_…`); mbaje vetëm në Vercel, mos e vendos në kod ose në shfletues.
   - `CYBEREDU_ADMIN_EMAIL` — email-i yt, i njëjtë me email-in e verifikuar të llogarisë Admin.
5. Ruaji variablat dhe bëj **Redeploy** të Production. Krijo profil cloud me email-in Admin dhe konfirmoje përmes email-it. Pastaj hyr: butoni **Admin** shfaqet vetëm për atë email.

## Përdorimi

Profilet e krijuara para këtij konfigurimi janë demonstrime lokale, jo llogari online. Secili përdorues duhet të krijojë një llogari cloud dhe të konfirmojë email-in. Në të njëjtin shfletues, hyrja e re me të njëjtin email i sinkronizon mësimet e përfunduara dhe pikët ekzistuese në profilin cloud.

Paneli liston vetëm përdoruesit që kanë sinkronizuar përparimin. Shfaq emrin, email-in, numrin e mësimeve, pikët e kuizit, numrin e arritjeve dhe kohën e sinkronizimit. Bisedat me chatbotin, fjalëkalimet dhe aktivitetet individuale nuk dërgohen në panel.
