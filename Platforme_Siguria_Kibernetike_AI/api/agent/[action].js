const { send, readBody, authorized, requireEnv, getLessons, saveLessons, validLesson, propose, applyProposals, getSiteConfig, commandSite } = require("../../lib/agent-shared");

module.exports = async function handler(req, res) {
  if (!authorized(req)) return send(res, 401, { error: "Çelësi i redaktorit mungon ose është i pasaktë." });
  const action = Array.isArray(req.query?.action) ? req.query.action[0] : req.query?.action;
  try {
    if (req.method !== "POST") return send(res, 405, { error: "Metoda nuk mbështetet." });
    const input = await readBody(req);
    if (action === "command") {
      if (typeof input.request !== "string" || input.request.trim().length < 8 || input.request.length > 1200) return send(res, 400, { error: "Shkruaj një udhëzim prej të paktën 8 karakteresh." });
      const [config, lessons] = await Promise.all([getSiteConfig(), getLessons()]);
      const result = await commandSite(input.request.trim(), config, lessons);
      return send(res, 200, { ok: true, ...result });
    }
    if (action === "sync") {
      if (!Array.isArray(input.lessons) || input.lessons.length < 1 || input.lessons.length > 80 || input.lessons.some(lesson => !validLesson(lesson))) return send(res, 400, { error: "Katalogu nuk kaloi kontrollin. Sigurohu që çdo mësim ka kapituj dhe burime HTTPS." });
      const unique = new Set(input.lessons.map(lesson => lesson.id));
      if (unique.size !== input.lessons.length) return send(res, 400, { error: "Katalogu përmban ID të përsëritura." });
      const existing = await getLessons();
      const merged = input.lessons.map(lesson => ({ ...lesson, ...(existing.find(item => item.id === lesson.id) || {}) }));
      for (const lesson of existing) if (!merged.some(item => item.id === lesson.id)) merged.push(lesson);
      await saveLessons(merged);
      return send(res, 200, { saved: merged.length });
    }
    if (action === "propose") {
      if (typeof input.request !== "string" || input.request.trim().length < 8 || input.request.length > 1200 || !Array.isArray(input.lessons) || input.lessons.length > 80) return send(res, 400, { error: "Jep udhëzimin dhe katalogun aktual të mësimeve." });
      requireEnv("KV_REST_API_URL", "KV_REST_API_TOKEN");
      const lessons = input.lessons;
      const proposals = await propose(input.request.trim(), lessons);
      return send(res, 200, { proposals });
    }
    if (action === "apply") {
      if (!Array.isArray(input.proposals) || input.proposals.length < 1 || input.proposals.length > 3) return send(res, 400, { error: "Zgjidh 1-3 propozime." });
      const lessons = await getLessons();
      if (!lessons.length) return send(res, 409, { error: "Katalogu s'është ruajtur ende. Nise njëherë auditimin me butonin AI." });
      const saved = await applyProposals(input.proposals, lessons);
      return send(res, 200, { saved: input.proposals.length, lessons: saved });
    }
    return send(res, 404, { error: "Veprimi nuk u gjet." });
  } catch (error) {
    console.error("CyberEdu agent:", error.message);
    return send(res, 502, { error: error.message || "Kërkesa e AI-së dështoi." });
  }
};
