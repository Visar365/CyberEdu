const { send, authorized, requireEnv, getLessons, propose, applyProposals } = require("../../lib/agent-shared");

module.exports = async function handler(req, res) {
  if (req.method !== "GET") return send(res, 405, { error: "Metoda nuk mbështetet." });
  if (!process.env.CRON_SECRET || !authorized(req, process.env.CRON_SECRET)) return send(res, 401, { error: "Pa autorizim." });
  try {
    requireEnv("OPENAI_API_KEY", "KV_REST_API_URL", "KV_REST_API_TOKEN");
    let lessons = await getLessons();
    if (!lessons.length) return send(res, 200, { ok: true, changed: 0, message: "Nise fillimisht një auditim nga paneli i administratorit." });
    const prompt = "Bëj auditimin ditor të kursit CyberEdu. Verifiko udhëzimet dhe burimet përmes web search. Përditëso vetëm një mësim nëse gjen pasaktësi, këshillë të vjetruar ose paqartësi me ndikim. Shto vetëm një temë të re nëse mungon një temë bazë e rëndësishme. Nëse kursi është në rregull, kthe proposals bosh.";
    const proposals = await propose(prompt, lessons);
    if (!proposals.length) return send(res, 200, { ok: true, changed: 0 });
    lessons = await applyProposals(proposals.slice(0, 1), lessons);
    return send(res, 200, { ok: true, changed: 1 });
  } catch (error) {
    console.error("CyberEdu scheduled audit:", error.message);
    return send(res, 503, { error: error.message || "Auditimi i planifikuar dështoi." });
  }
};
