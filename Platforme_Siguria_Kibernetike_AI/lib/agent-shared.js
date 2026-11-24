const crypto = require("node:crypto");
const baseLessons = require("../data/base-lessons.json");

const STORE_KEY = "cyberedu-lessons-v1";
const SITE_STORE_KEY = "cyberedu-site-config-v1";
const CONTENT_STORE_KEY = "cyberedu-managed-content-v1";
const categories = new Set(["Llogaritë", "Mashtrimet", "Privatësia", "Pajisjet", "Rrjetet", "Incidente"]);
const levels = new Set(["Fillestar", "Mesatar", "I avancuar"]);
const siteViews = new Set(["dashboard", "lessons", "quiz", "lab", "assistant", "safety"]);
const officialHosts = ["cisa.gov", "ncsc.gov.uk", "enisa.europa.eu", "ftc.gov", "owasp.org", "nist.gov", "cert.europa.eu", "europa.eu"];
const defaultSiteConfig = {
  siteName: "CyberEdu",
  tagline: "Akademia jote digjitale",
  announcement: "",
  heroTitle: "Mëso si të mbrohesh online, me ritmin tënd.",
  heroDescription: "Nis me një temë të vogël, provo çfarë mësove dhe kthehu kur të duash. Hapat e vegjël të ndihmojnë të kujdesesh më mirë për veten në internet.",
  sidebarTitle: "Siguria fillon me ty.",
  sidebarNote: "Një hap i vogël sot të mbron nesër.",
  tipTitle: "Mendo para se të klikosh.",
  tipText: "Kontrollo dërguesin dhe lidhjen para se të hapësh një mesazh të papritur.",
  enabledViews: ["dashboard", "lessons", "quiz", "lab", "assistant", "safety"],
  featuredLessonIds: [1, 2, 3],
  managedContent: { quizQuestions: [], labCases: [], safetyTips: [] }
};

function send(res, status, data) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.end(JSON.stringify(data));
}

function readBody(req) {
  if (req.body && typeof req.body === "object") return Promise.resolve(req.body);
  return new Promise((resolve, reject) => {
    let raw = "";
    req.on("data", chunk => { raw += chunk; if (raw.length > 1_000_000) reject(new Error("Kërkesa është shumë e madhe.")); });
    req.on("end", () => { try { resolve(JSON.parse(raw || "{}")); } catch { reject(new Error("Kërkesa nuk është JSON i vlefshëm.")); } });
    req.on("error", reject);
  });
}

function authorized(req, secret = process.env.LESSON_AGENT_KEY) {
  const received = req.headers.authorization || "";
  const expected = `Bearer ${secret || ""}`;
  const a = Buffer.from(received);
  const b = Buffer.from(expected);
  return Boolean(secret && a.length === b.length && crypto.timingSafeEqual(a, b));
}

function requireEnv(...names) {
  const missing = names.filter(name => !process.env[name]);
  if (missing.length) throw new Error(`Mungojnë variablat në Vercel: ${missing.join(", ")}.`);
}

async function redis(command, key, value) {
  requireEnv("KV_REST_API_URL", "KV_REST_API_TOKEN");
  const base = process.env.KV_REST_API_URL.replace(/\/$/, "");
  const response = await fetch(`${base}/${command}/${encodeURIComponent(key)}`, {
    method: command === "set" ? "POST" : "GET",
    headers: { Authorization: `Bearer ${process.env.KV_REST_API_TOKEN}`, ...(command === "set" ? { "Content-Type": "application/json" } : {}) },
    ...(command === "set" ? { body: JSON.stringify(value) } : {})
  });
  const result = await response.json();
  if (!response.ok || result.error) throw new Error("Ruajtja e të dhënave në Redis dështoi.");
  return result.result;
}

async function getLessons() {
  const value = await redis("get", STORE_KEY);
  return value ? JSON.parse(value) : baseLessons;
}

async function saveLessons(lessons) { await redis("set", STORE_KEY, lessons); }

async function getSiteConfig() {
  const value = await redis("get", SITE_STORE_KEY);
  if (!value) return { ...defaultSiteConfig, managedContent: await getManagedContent() };
  try {
    const config = { ...defaultSiteConfig, ...JSON.parse(value) };
    config.managedContent = await getManagedContent();
    return config;
  } catch { return { ...defaultSiteConfig, managedContent: await getManagedContent().catch(() => defaultSiteConfig.managedContent) }; }
}

async function getManagedContent() {
  const value = await redis("get", CONTENT_STORE_KEY);
  if (!value) return { quizQuestions: [], labCases: [], safetyTips: [] };
  try {
    const parsed = JSON.parse(value);
    return {
      quizQuestions: Array.isArray(parsed.quizQuestions) ? parsed.quizQuestions : [],
      labCases: Array.isArray(parsed.labCases) ? parsed.labCases : [],
      safetyTips: Array.isArray(parsed.safetyTips) ? parsed.safetyTips : []
    };
  } catch { return { quizQuestions: [], labCases: [], safetyTips: [] }; }
}

async function saveManagedContent(content) { await redis("set", CONTENT_STORE_KEY, content); }

function validateSiteConfig(config, lessons) {
  const textFields = ["siteName", "tagline", "heroTitle", "heroDescription", "sidebarTitle", "sidebarNote", "tipTitle", "tipText"];
  if (!config || textFields.some(key => typeof config[key] !== "string" || config[key].trim().length < 2 || config[key].length > 240)) return false;
  if (typeof config.announcement !== "string" || config.announcement.length > 280) return false;
  if (!Array.isArray(config.enabledViews) || config.enabledViews.length < 2 || config.enabledViews.length > siteViews.size || config.enabledViews.some(view => !siteViews.has(view)) || !config.enabledViews.includes("dashboard") || !config.enabledViews.includes("lessons")) return false;
  if (!Array.isArray(config.featuredLessonIds) || config.featuredLessonIds.length > 3 || config.featuredLessonIds.some(id => !Number.isInteger(id) || !lessons.some(lesson => lesson.id === id))) return false;
  return true;
}

async function saveSiteConfig(config) { await redis("set", SITE_STORE_KEY, config); }

async function commandSite(request, config, lessons, { maxLessonChanges = 3, requireNewLesson = false } = {}) {
  requireEnv("OPENAI_API_KEY", "KV_REST_API_URL", "KV_REST_API_TOKEN");
  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL || "gpt-4.1-mini",
      store: false,
      tools: [{ type: "web_search" }],
      instructions: `Je administratori përmbajtjesor i CyberEdu. Përditëso materialet e të gjitha pjesëve ekzistuese: mësime, kuize, skenarë laboratori, këshilla sigurie dhe tekstet/konfigurimin e faqes. Mund të shtosh ose korrigjosh përmbajtje, por mos fshi asnjë material ekzistues. Ruaj të gjitha vargjet ekzistuese të managedContent dhe shto propozimet e reja; serveri do t'i bashkojë pa zëvendësuar përmbajtjen ekzistuese. Mos ndrysho identitetin e faqes, përparimin e nxënësve, të dhënat personale, kodin, dizajnin, domenin ose autentikimin. Për kod/veçori të reja mos pretendo se u implementuan; shënoji te message si kërkesë që kërkon publikim kodi. Mos shpik fakte. Për çdo material përdor web search dhe burime HTTPS zyrtare nga CISA, NCSC, ENISA, FTC, OWASP, NIST ose CERT. Shkruaj shqip. Kthe JSON {siteConfig:{siteName,tagline,announcement,heroTitle,heroDescription,sidebarTitle,sidebarNote,tipTitle,tipText,enabledViews,featuredLessonIds},lessonProposals:[{operation:'add'|'update',targetId:number,reason:string,lesson:{id:number,title:string,icon:string,time:string,level:string,category:string,short:string,body:string,points:string[],action:string,agentChapters:[{title:string,paragraphs:string[],example:string}],sources:[{name:string,url:string}]}}],contentAdditions:{quizQuestions:[{q:string,a:string[],correct:number,why:string}],labCases:[{title:string,sender:string,message:string,options:string[],correct:number,feedback:string}],safetyTips:[{icon:string,title:string,text:string,sourceName:string,sourceUrl:string}]},message:string}. Kthe 0-1 lessonProposals dhe deri në një shtesë për secilin lloj përmbajtjeje në ciklin ditor. Çdo mësim i ri/përditësuar: të paktën 500 fjalë, 5-7 kapituj me nga dy paragrafë dhe shembull, 3-6 pika, veprim praktik dhe burime reale. Për add vendos id 0; për update përdor id ekzistuese dhe targetId. Quiz: saktësisht 4 alternativa, correct indeks 0-3. Laboratori: 3 alternativa, correct indeks 0-2. Këshilla: lidhje burimi vetëm HTTPS nga hostet zyrtare të lejuara. Ruaj vlerat aktuale që nuk preken. Mos hiq dashboard ose seksione ekzistuese. enabledViews lejon vetëm: ${[...siteViews].join(", ")}. featuredLessonIds duhet të jenë ID nga kursi, maksimumi 3.`,
      input: `Konfigurimi dhe përmbajtja aktuale:\n${JSON.stringify(config)}\nKatalogu i mësimeve:\n${JSON.stringify(lessons)}\n\nUdhëzimi:\n${request}`,
      text: { format: { type: "json_object" } },
      max_output_tokens: 9000
    })
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error?.message || "AI nuk e përditësoi konfigurimin.");
  const output = result.output?.flatMap(item => item.content || []).find(item => item.type === "output_text")?.text;
  if (!output) throw new Error("AI nuk ktheu konfigurim të lexueshëm.");
  const parsed = JSON.parse(output);
  const generated = parsed.siteConfig;
  if (!validateSiteConfig(generated, lessons)) throw new Error("Ndryshimi i AI-së nuk kaloi kontrollin e sigurisë.");
  const cleaned = { ...generated };
  for (const key of ["siteName", "tagline", "announcement", "heroTitle", "heroDescription", "sidebarTitle", "sidebarNote", "tipTitle", "tipText"]) cleaned[key] = cleaned[key].trim();
  const proposals = parsed.lessonProposals || [];
  if (!Array.isArray(proposals) || proposals.length > 3) throw new Error("AI ktheu shumë ndryshime në mësime.");
  if (requireNewLesson && (proposals.length !== 1 || proposals[0]?.operation !== "add")) throw new Error("Cikli ditor kërkonte një mësim të ri.");
  const currentIds = new Set(lessons.map(lesson => lesson.id));
  let nextId = Math.max(0, ...currentIds) + 1;
  for (const proposal of proposals) {
    if (proposal.operation === "add") proposal.lesson.id = nextId++;
    else if (proposal.operation === "update" && currentIds.has(proposal.targetId)) proposal.lesson.id = proposal.targetId;
    else throw new Error("AI tentoi të ndryshojë një mësim që nuk ekziston.");
    if (!validLesson(proposal.lesson, { generated: true })) throw new Error("Një ndryshim i kursit nuk kaloi kontrollin e burimeve dhe strukturës.");
    proposal.lesson = cleanLesson(proposal.lesson);
  }
  const selected = proposals.slice(0, maxLessonChanges);
  const content = await getManagedContent();
  const additions = parsed.contentAdditions || {};
  for (const type of ["quizQuestions", "labCases", "safetyTips"]) {
    const incoming = additions[type] || [];
    if (!Array.isArray(incoming) || incoming.length > 1) throw new Error("AI ktheu numër të pavlefshëm shtesash në platformë.");
    if (requireNewLesson && incoming.length !== 1) throw new Error("Cikli ditor kërkonte nga një shtesë të re në kuiz, laborator dhe këshilla sigurie.");
    for (const item of incoming) {
      const text = JSON.stringify(item);
      if (text.length > 8000 || /<\/?\w+|javascript:/i.test(text)) throw new Error("Përmbajtja e re nuk kaloi kontrollin e sigurisë.");
      const shortText = (value, max) => typeof value === "string" && value.trim().length > 0 && value.length <= max;
      if (type === "quizQuestions" && (!shortText(item.q, 500) || !Array.isArray(item.a) || item.a.length !== 4 || item.a.some(answer => !shortText(answer, 300)) || !Number.isInteger(item.correct) || item.correct < 0 || item.correct > 3 || !shortText(item.why, 800))) throw new Error("Pyetja e kuizit nuk kaloi validimin.");
      if (type === "labCases" && (!shortText(item.title, 160) || !shortText(item.sender, 160) || !shortText(item.message, 1000) || !Array.isArray(item.options) || item.options.length !== 3 || item.options.some(option => !shortText(option, 300)) || !Number.isInteger(item.correct) || item.correct < 0 || item.correct > 2 || !shortText(item.feedback, 800))) throw new Error("Skenari i laboratorit nuk kaloi validimin.");
      if (type === "safetyTips") {
        let url; try { url = new URL(item.sourceUrl); } catch { throw new Error("Burimi i këshillës nuk është URL e vlefshme."); }
        if (!shortText(item.title, 160) || !shortText(item.text, 800) || !shortText(item.sourceName, 200) || (item.icon !== undefined && !shortText(item.icon, 8)) || url.protocol !== "https:" || !officialHosts.some(host => url.hostname === host || url.hostname.endsWith(`.${host}`))) throw new Error("Këshilla nuk ka burim zyrtar të lejuar.");
      }
      const key = type === "quizQuestions" ? "q" : "title";
      if (content[type].some(existing => String(existing[key]).toLowerCase() === String(item[key]).toLowerCase())) {
        if (requireNewLesson) throw new Error("Cikli ditor propozoi përmbajtje të përsëritur.");
        continue;
      }
      content[type].push(item);
    }
  }
  if (selected.length) await applyProposals(selected, lessons);
  await saveManagedContent(content);
  cleaned.managedContent = content;
  await saveSiteConfig(cleaned);
  return { siteConfig: cleaned, lessonChanges: selected.length, contentChanges: Object.values(additions).reduce((total, items) => total + (Array.isArray(items) ? items.length : 0), 0), message: String(parsed.message || "Përditësimi përfundoi.").slice(0, 500) };
}

function escapeText(value) {
  return String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#39;");
}

function validLesson(lesson, { generated = false } = {}) {
  if (!lesson || !Number.isInteger(lesson.id) || lesson.id < 1) return false;
  if (!["title", "icon", "level", "category", "short", "body"].every(key => typeof lesson[key] === "string" && lesson[key].trim())) return false;
  if (!levels.has(lesson.level) || !categories.has(lesson.category)) return false;
  if (!Array.isArray(lesson.points) || lesson.points.length < 3 || lesson.points.length > 8 || lesson.points.some(item => typeof item !== "string" || !item.trim())) return false;
  if (!Array.isArray(lesson.agentChapters) || lesson.agentChapters.length < 5 || lesson.agentChapters.length > 7 || lesson.agentChapters.some(item => !item.title || !Array.isArray(item.paragraphs) || item.paragraphs.length < 2 || !item.example)) return false;
  if (!Array.isArray(lesson.sources) || lesson.sources.length < 1 || lesson.sources.some(item => {
    try { const url = new URL(item.url); return url.protocol !== "https:" || (generated && !officialHosts.some(host => url.hostname === host || url.hostname.endsWith(`.${host}`))) || !item.name; } catch { return true; }
  })) return false;
  if (generated) {
    const words = [lesson.title, lesson.short, lesson.body, ...lesson.points, ...lesson.agentChapters.flatMap(chapter => [chapter.title, ...chapter.paragraphs, chapter.example]), lesson.action].join(" ").trim().split(/\s+/).length;
    if (words < 500 || typeof lesson.action !== "string" || !lesson.action.trim()) return false;
  }
  return true;
}

function cleanLesson(lesson) {
  const clean = JSON.parse(JSON.stringify(lesson));
  for (const key of ["title", "icon", "short", "body", "action"]) if (clean[key]) clean[key] = escapeText(clean[key]);
  clean.points = clean.points.map(escapeText);
  clean.agentChapters = clean.agentChapters.map(chapter => ({ title: escapeText(chapter.title), paragraphs: chapter.paragraphs.map(escapeText), example: escapeText(chapter.example) }));
  clean.sources = clean.sources.map(source => ({ name: escapeText(source.name), url: source.url }));
  clean.time = `${Math.max(4, Math.ceil(JSON.stringify(clean).split(/\s+/).length / 125))} min`;
  return clean;
}

async function propose(request, lessons) {
  requireEnv("OPENAI_API_KEY");
  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL || "gpt-4.1-mini",
      store: false,
      tools: [{ type: "web_search" }],
      instructions: "Je redaktor i kujdesshëm i CyberEdu, platformë shqiptare për edukim të sigurt kibernetik. Përdor kërkim në web për të verifikuar rekomandimet dhe burimet aktuale zyrtare. Kthe JSON me fushën proposals dhe 0-3 propozime. Përditëso vetëm kur gjen informacion të pasaktë, të vjetruar, të paqartë ose të përsëritur; shto mësim vetëm kur mungon një temë me rëndësi. Shkruaj shqip të qartë për fillestarë. Çdo mësim duhet të ketë të paktën 500 fjalë, 5-7 kapituj me nga dy paragrafë dhe shembull, 3-6 pika, veprim praktik dhe burime HTTPS reale nga CISA, NCSC, ENISA, FTC, OWASP, NIST ose CERT. Mos shpik burime. Vetëm këshilla mbrojtëse dhe rikuperimi; mos jep hapa sulmi. Formati: {proposals:[{operation:'add'|'update',targetId:number,reason:string,lesson:{id:number,title:string,icon:string,time:string,level:string,category:string,short:string,body:string,points:string[],action:string,agentChapters:[{title:string,paragraphs:string[],example:string}],sources:[{name:string,url:string}]}}]}. Për add, vendos id 0; për update ruaj id dhe vendos targetId ekzistues.",
      input: `Katalogu aktual:\n${JSON.stringify(lessons)}\n\nKërkesa e redaktimit:\n${request}`,
      text: { format: { type: "json_object" } },
      max_output_tokens: 12000
    })
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error?.message || "Shërbimi AI nuk e përfundoi kërkesën.");
  const output = result.output?.flatMap(item => item.content || []).find(item => item.type === "output_text")?.text;
  if (!output) throw new Error("AI nuk ktheu propozime të lexueshme.");
  const proposals = JSON.parse(output).proposals;
  if (!Array.isArray(proposals) || proposals.length > 3) throw new Error("AI ktheu propozime me format të pavlefshëm.");
  const ids = new Set(lessons.map(lesson => lesson.id));
  let nextId = Math.max(0, ...ids) + 1;
  return proposals.map(proposal => {
    if (proposal.operation === "add") proposal.lesson.id = nextId++;
    else if (proposal.operation === "update" && ids.has(proposal.targetId)) proposal.lesson.id = proposal.targetId;
    else throw new Error("AI tentoi të ndryshojë një mësim që nuk ekziston.");
    if (!validLesson(proposal.lesson, { generated: true })) throw new Error("Një propozim nuk kaloi kontrollin e përmbajtjes dhe burimeve.");
    proposal.lesson = cleanLesson(proposal.lesson);
    proposal.reason = escapeText(proposal.reason || "");
    return proposal;
  });
}

async function applyProposals(proposals, lessons) {
  const next = [...lessons];
  for (const proposal of proposals) {
    const index = next.findIndex(item => item.id === proposal.lesson?.id);
    if (!validLesson(proposal.lesson, { generated: true })) throw new Error("Mësimi nuk kaloi kontrollin e përmbajtjes dhe burimeve.");
    if (proposal.operation === "update" && index < 0) throw new Error("Mësimi që do të përditësohej nuk u gjet.");
    if (proposal.operation === "add" && index >= 0) throw new Error("ID e mësimit të ri ekziston.");
    if (index >= 0) next[index] = proposal.lesson; else next.push(proposal.lesson);
  }
  await saveLessons(next);
  return next;
}

module.exports = { send, readBody, authorized, requireEnv, getLessons, saveLessons, validLesson, cleanLesson, propose, applyProposals, defaultSiteConfig, getSiteConfig, getManagedContent, validateSiteConfig, commandSite };
