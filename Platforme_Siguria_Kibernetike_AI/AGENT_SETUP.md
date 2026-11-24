# AI në prapavijë për CyberEdu

Vercel publikon API-në e agjentit dhe e nis auditimin automatik një herë në ditë. AI kontrollon vetëm përmbajtjen e kursit (mësimet dhe burimet); nuk ndryshon kodin, pamjen, hyrjen ose funksionet e faqes. Mësimet e ruajtura shfaqen për vizitorët përmes `/api/lessons`.

## Konfigurimi në Vercel

1. Te projekti `cyberedu-web`, hap **Storage** dhe krijo/lidh një bazë **Upstash Redis** vetëm për CyberEdu. Mos përdor kredencialet e një projekti tjetër. Lidhja shton zakonisht `KV_REST_API_URL` dhe `KV_REST_API_TOKEN`.
2. Te **Settings → Environment Variables**, shto këto variabla si **Secret** në **Production**:
   - `OPENAI_API_KEY` — çelësi yt i OpenAI API. Thirrjet e modelit dhe web search faturohen nga OpenAI.
   - `LESSON_AGENT_KEY` — fjalëkalim i gjatë, privat, që përdoret vetëm nga administratori për panelin e AI-së.
   - `CRON_SECRET` — sekret i gjatë e i veçantë për thirrjen ditore të Vercel Cron.
   - `KV_REST_API_URL` dhe `KV_REST_API_TOKEN` — nga lidhja e Upstash Redis (nëse nuk u shtuan vetë).
3. Ruaji variablat, pastaj bëj **Redeploy** të Production.
4. Hape faqen, shko te **Mësimet → Hap panelin e AI-së**, zgjidh **Nise auditimin automatik tani** dhe fut `LESSON_AGENT_KEY` kur të kërkohet. Kjo ruan katalogun fillestar dhe nis rishikimin.

Pas inicializimit, Vercel Cron e kontrollon kursin çdo ditë në 03:00 UTC. Për të kufizuar koston, cikli ditor bën vetëm një kërkesë AI dhe mund të ruajë maksimumi një ndryshim. Mund të nisësh auditim tjetër manualisht nga paneli. Variabli opsional `OPENAI_MODEL` ndërron modelin; parazgjedhja është `gpt-4.1-mini`.

Vercel Cron punon në deploy-in Production dhe dërgon `CRON_SECRET` si bearer token te funksioni i planifikuar. API-ja e Redis ruan katalogun përtej jetëgjatësisë së funksioneve serverless.