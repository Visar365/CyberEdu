const http = require("node:http");
const fs = require("node:fs/promises");
const path = require("node:path");
const vm = require("node:vm");

const root = __dirname;
const dataFile = path.join(root, "data", "agent-lessons.json");
const port = Number(process.env.PORT || 4173);
const apiKey = process.env.OPENAI_API_KEY;
const editorKey = process.env.LESSON_AGENT_KEY;
const model = process.env.OPENAI_MODEL || "gpt-6-luna";
const mime = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8", ".json": "application/json; charset=utf-8", ".svg": "image/svg+xml" };

async function readLessons() { try { return JSON.parse(await fs.readFile(dataFile, "utf8")); } catch (error) { if (error.code === "ENOENT") return []; throw error; } }
async function sendJson(res, code, value) { res.writeHead(code, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" }); res.end(JSON.stringify(value)); }
async function body(req) { let value = ""; for await (const chunk of req) { value += chunk; if (value.length > 1_000_000) throw new Error("Kërkesa është shumë e madhe."); } return JSON.parse(value || "{}"); }
function validLesson(lesson) {
  const fields = ["title", "icon", "level", "category", "short", "body"];
  if (!lesson || !Number.isInteger(lesson.id) || fields.some(key => typeof lesson[key] !== "string" || !lesson[key].trim())) return false;
  if (!Array.isArray(lesson.points) || lesson.points.length < 3 || lesson.points.length > 8 || lesson.points.some(item => typeof item !== "string")) return false;
  if (!Array.isArray(lesson.agentChapters) || lesson.agentChapters.length < 5 || lesson.agentChapters.length > 7 || lesson.agentChapters.some(item => !item.title || !Array.isArray(item.paragraphs) || item.paragraphs.length < 2 || !item.example)) return false;
  const lessonText = [lesson.title, lesson.short, lesson.body, ...lesson.points, ...lesson.agentChapters.flatMap(item => [item.title, ...item.paragraphs, item.example]), lesson.action].join(" ");
  if (lessonText.trim().split(/\s+/).length < 500) return false;
  if (!Array.isArray(lesson.sources) || lesson.sources.length < 1 || lesson.sources.some(item => !item.name || !/^https:\/\//i.test(item.url || ""))) return false;
  return true;
}
function escapeGenerated(value, key = "") {
  if (typeof value === "string") return ["category", "level", "url", "time"].includes(key) ? value : value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#39;");
  if (Array.isArray(value)) return value.map(item => escapeGenerated(item, key));
  if (value && typeof value === "object") return Object.fromEntries(Object.entries(value).map(([childKey, item]) => [childKey, escapeGenerated(item, childKey)]));
  return value;
}
const lessonSchema = { type: "object", additionalProperties: false, required: ["operation", "targetId", "reason", "lesson"], properties: {
  operation: { type: "string", enum: ["add", "update"] }, targetId: { type: "integer" }, reason: { type: "string" },
  lesson: { type: "object", additionalProperties: false, required: ["id", "title", "icon", "time", "level", "category", "short", "body", "points", "agentChapters", "action", "sources"], properties: {
    id: { type: "integer" }, title: { type: "string" }, icon: { type: "string" }, time: { type: "string" }, level: { type: "string", enum: ["Fillestar", "Mesatar", "I avancuar"] }, category: { type: "string", enum: ["Llogaritë", "Mashtrimet", "Privatësia", "Pajisjet", "Rrjetet", "Incidente"] }, short: { type: "string" }, body: { type: "string" }, points: { type: "array", items: { type: "string" } }, action: { type: "string" }, agentChapters: { type: "array", items: { type: "object", additionalProperties: false, required: ["title", "paragraphs", "example"], properties: { title: { type: "string" }, paragraphs: { type: "array", items: { type: "string" } }, example: { type: "string" } } } }, sources: { type: "array", items: { type: "object", additionalProperties: false, required: ["name", "url"], properties: { name: { type: "string" }, url: { type: "string" } } } }
  } }
} };

async function route(req, res) {
  const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);
  if (url.pathname === "/api/lessons" && req.method === "GET") return sendJson(res, 200, await readLessons());
  if (url.pathname.startsWith("/api/agent/") && (!editorKey || req.headers.authorization !== `Bearer ${editorKey}`)) return sendJson(res, 401, { error: "Çelësi i redaktorit është i pasaktë ose nuk është konfiguruar." });
  if (url.pathname === "/api/agent/sync" && req.method === "POST") {
    const input = await body(req);
    if (!Array.isArray(input.lessons) || input.lessons.length < 1 || input.lessons.length > 80 || input.lessons.some(lesson => !validLesson(lesson))) return sendJson(res, 400, { error: "Katalogu nuk kaloi kontrollin. Sigurohu që mësimet kanë kapituj dhe burime HTTPS." });
    const managed = await readLessons();
    const merged = input.lessons.map(lesson => ({ ...lesson, ...(managed.find(item => item.id === lesson.id) || {}) }));
    for (const lesson of managed) if (!merged.some(item => item.id === lesson.id)) merged.push(lesson);
    await fs.mkdir(path.dirname(dataFile), { recursive: true });
    await fs.writeFile(dataFile, `${JSON.stringify(merged, null, 2)}\n`, "utf8");
    return sendJson(res, 200, { saved: merged.length });
  }
  if (url.pathname === "/api/agent/propose" && req.method === "POST") {
    if (!apiKey) return sendJson(res, 503, { error: "Vendos OPENAI_API_KEY në mjedis për të përdorur agjentin." });
    const input = await body(req);
    if (typeof input.request !== "string" || input.request.trim().length < 8 || input.request.length > 1200 || !Array.isArray(input.lessons)) return sendJson(res, 400, { error: "Jep një udhëzim dhe listën e mësimeve." });
    const catalog = input.lessons.slice(0, 80).map(({ id, title, category, short, body, points, agentChapters, sources }) => ({ id, title, category, short, body, points, agentChapters, sources }));
    const response = await fetch("https://api.openai.com/v1/responses", { method: "POST", headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" }, body: JSON.stringify({ model, store: false, tools: [{ type: "web_search" }], instructions: "Use web search to verify current guidance and source URLs. Minimum lesson length: 500 words in Albanian, 5-7 chapters with two paragraphs each, examples, actionable summary points, a practical action, and at least one authoritative source. Je redaktor i kujdesshëm i një platforme edukative shqiptare për sigurinë kibernetike. Përmirëso ose shto mësime të sakta, praktike, të kuptueshme për fillestarë. Përdor vetëm burime autoritative reale, me URL HTTPS të njohur (CISA, NCSC, ENISA, FTC, OWASP, NIST); mos shpik citime. Kthe 0 deri 3 propozime, në shqip. Për përditësim cakto targetId dhe ruaj id ekzistues. Për të riun vendos id 0; serveri e cakton. Çdo mësim duhet të ketë 3-6 pika, 5-7 kapituj me paragraphs dhe shembull, veprim përfundimtar dhe burime. Mos jep udhëzime sulmi apo shfrytëzimi; përqendrohu te mbrojtja dhe rikuperimi.", input: `Katalogu aktual (për identifikimin e temave të mbuluara): ${JSON.stringify(catalog)}\n\nKërkesa e redaktorit: ${input.request}`, text: { format: { type: "json_schema", name: "lesson_proposals", strict: true, schema: { type: "object", additionalProperties: false, required: ["proposals"], properties: { proposals: { type: "array", minItems: 0, maxItems: 3, items: lessonSchema } } } } }, max_output_tokens: 8000 }) });
    const result = await response.json();
    if (!response.ok) return sendJson(res, 502, { error: result.error?.message || "Shërbimi AI nuk e përfundoi kërkesën." });
    const output = result.output?.flatMap(item => item.content || []).find(item => item.type === "output_text")?.text;
    if (!output) return sendJson(res, 502, { error: "Agjenti nuk ktheu propozime të lexueshme." });
    let proposals; try { proposals = JSON.parse(output).proposals; } catch { return sendJson(res, 502, { error: "Propozimet e agjentit nuk ishin JSON i vlefshëm." }); }
    const current = [...catalog.map(item => item.id), ...(await readLessons()).map(item => item.id)];
    let nextId = Math.max(0, ...current) + 1;
    for (const proposal of proposals) {
      if (proposal.operation === "add") proposal.lesson.id = nextId++;
      else proposal.lesson.id = proposal.targetId;
      if (!validLesson(proposal.lesson) || (proposal.operation === "update" && !current.includes(proposal.targetId))) return sendJson(res, 502, { error: "Një propozim nuk kaloi kontrollin e strukturës." });
      proposal.lesson = escapeGenerated(proposal.lesson);
      proposal.reason = escapeGenerated(proposal.reason);
      proposal.lesson.time = `${Math.max(4, Math.ceil(JSON.stringify(proposal.lesson).split(/\s+/).length / 125))} min`;
    }
    return sendJson(res, 200, { proposals });
  }
  if (url.pathname === "/api/agent/apply" && req.method === "POST") {
    const input = await body(req); if (!Array.isArray(input.proposals) || !input.proposals.length || input.proposals.length > 3) return sendJson(res, 400, { error: "Zgjidh të paktën një propozim." });
    const managed = await readLessons();
    for (const proposal of input.proposals) {
      if (!validLesson(proposal.lesson)) return sendJson(res, 400, { error: "Mësimi nuk kaloi kontrollin e strukturës." });
      if (proposal.operation === "update" && !managed.some(item => item.id === proposal.targetId)) {
        if (!input.baseIds?.includes(proposal.targetId)) return sendJson(res, 400, { error: "Mësimi i zgjedhur nuk ekziston më." });
      }
      const index = managed.findIndex(item => item.id === proposal.lesson.id);
      if (index >= 0) managed[index] = proposal.lesson; else managed.push(proposal.lesson);
    }
    await fs.mkdir(path.dirname(dataFile), { recursive: true });
    await fs.writeFile(dataFile, `${JSON.stringify(managed, null, 2)}\n`, "utf8");
    return sendJson(res, 200, { saved: input.proposals.length, lessons: managed });
  }
  if (url.pathname.startsWith("/api/")) return sendJson(res, 404, { error: "API endpoint nuk u gjet." });
  const relative = decodeURIComponent(url.pathname === "/" ? "/index.html" : url.pathname);
  const target = path.resolve(root, `.${relative}`);
  if (!target.startsWith(root + path.sep)) return sendJson(res, 403, { error: "Ndalohet." });
  try { const content = await fs.readFile(target); res.writeHead(200, { "Content-Type": mime[path.extname(target)] || "application/octet-stream" }); res.end(content); } catch { res.writeHead(404); res.end("Nuk u gjet."); }
}

let maintenanceRunning = false;
async function loadCourseCatalog() {
  const source = await fs.readFile(path.join(root, "app.js"), "utf8");
  const match = source.match(/const lessons = (\[[\s\S]*?\]);\s*\nconst lessonReading\s*=/);
  if (!match) throw new Error("Could not load the built-in lesson catalog from app.js.");
  const builtIn = vm.runInNewContext(match[1], Object.create(null), { timeout: 1000 });
  const readMap = name => {
    const found = source.match(new RegExp(`const ${name} = (\\{[\\s\\S]*?\\n\\});`));
    if (!found) throw new Error(`Could not load ${name} from app.js.`);
    return vm.runInNewContext(`(${found[1]})`, Object.create(null), { timeout: 1000 });
  };
  const reading = readMap("lessonReading");
  const extra = readMap("lessonExtraChapters");
  const extended = readMap("lessonExtendedChapters");
  const advanced = readMap("lessonAdvancedReading");
  const deepening = readMap("lessonDeepeningChapters");
  const sourcesMap = readMap("lessonSources");
  const additionalSources = source.match(/Object\.assign\(lessonSources,(\{[\s\S]*?\})\);/);
  if (additionalSources) Object.assign(sourcesMap, vm.runInNewContext(`(${additionalSources[1]})`, Object.create(null), { timeout: 1000 }));
  for (const lesson of builtIn) {
    lesson.agentChapters = [...(reading[lesson.id]?.chapters || [{ title: "Parimet kryesore", paragraphs: [lesson.body], example: lesson.points[0] }]), ...(extra[lesson.id] ? [extra[lesson.id]] : []), ...(extended[lesson.id] ? [extended[lesson.id]] : []), ...(advanced[lesson.id]?.chapters || []), ...(deepening[lesson.id] || [])];
    lesson.action = reading[lesson.id]?.action || advanced[lesson.id]?.action || "Zgjidh një hap të sigurt dhe zbatoje sot.";
    lesson.sources = sourcesMap[lesson.id] || [];
  }
  const managed = await readLessons();
  const catalog = builtIn.map(lesson => ({ ...lesson, ...(managed.find(item => item.id === lesson.id) || {}) }));
  for (const lesson of managed) if (!catalog.some(item => item.id === lesson.id)) catalog.push(lesson);
  return catalog;
}
async function runBackgroundMaintenance() {
  if (maintenanceRunning) return;
  if (!apiKey || !editorKey) { console.log("Background lesson audit skipped: configure OPENAI_API_KEY and LESSON_AGENT_KEY."); return; }
  maintenanceRunning = true;
  let changed = 0;
  try {
    const excluded = new Set();
    const initial = await loadCourseCatalog();
    const baseIds = initial.map(lesson => lesson.id);
    for (let round = 1; round <= 8; round++) {
      const lessons = await loadCourseCatalog();
      const request = `Do a full autonomous audit of this Albanian cybersecurity course. Research current official guidance using web search. Correct any inaccurate, outdated, unclear, or repetitive lesson; add a new lesson only for an important missing topic. Preserve lesson IDs for updates. Do not revise IDs already reviewed in this run: ${[...excluded].join(", ") || "none"}. Return an empty proposals array when no useful work remains.`;
      const proposed = await fetch(`http://127.0.0.1:${port}/api/agent/propose`, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${editorKey}` }, body: JSON.stringify({ request, lessons }) });
      const proposalResult = await proposed.json();
      if (!proposed.ok) throw new Error(proposalResult.error || "AI lesson audit failed.");
      if (!proposalResult.proposals?.length) break;
      for (const proposal of proposalResult.proposals) excluded.add(proposal.operation === "update" ? proposal.targetId : proposal.lesson.id);
      const applied = await fetch(`http://127.0.0.1:${port}/api/agent/apply`, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${editorKey}` }, body: JSON.stringify({ proposals: proposalResult.proposals, baseIds }) });
      const appliedResult = await applied.json();
      if (!applied.ok) throw new Error(appliedResult.error || "Could not save autonomous lesson updates.");
      changed += appliedResult.saved;
    }
    console.log(`Background lesson audit finished: ${changed} change(s) saved.`);
  } catch (error) {
    console.error("Background lesson audit failed:", error.message);
  } finally { maintenanceRunning = false; }
}

http.createServer((req, res) => { route(req, res).catch(error => { console.error(error); sendJson(res, 500, { error: "Ndodhi një gabim në server." }); }); }).listen(port, "127.0.0.1", () => {
  console.log(`CyberEdu server ready at http://127.0.0.1:${port}`);
  console.log("Background lesson audit scheduled: immediately and every 24 hours.");
  setTimeout(runBackgroundMaintenance, 30_000);
  setInterval(runBackgroundMaintenance, 24 * 60 * 60 * 1000);
});
