const { send, authorized, requireEnv, getLessons, getSiteConfig, commandSite } = require("../../lib/agent-shared");

module.exports = async function handler(req, res) {
  if (req.method !== "GET") return send(res, 405, { error: "Metoda nuk mbështetet." });
  if (!process.env.CRON_SECRET || !authorized(req, process.env.CRON_SECRET)) return send(res, 401, { error: "Pa autorizim." });
  try {
    requireEnv("OPENAI_API_KEY", "KV_REST_API_URL", "KV_REST_API_TOKEN");
    const [lessons, config] = await Promise.all([getLessons(), getSiteConfig()]);
    const prompt = "Bëj mirëmbajtjen ditore të të gjitha pjesëve ekzistuese të CyberEdu: kursit, kuizit, laboratorit, këshillave të sigurisë dhe teksteve/organizimit të faqes. Shto saktësisht një mësim të ri progresiv, një pyetje kuizi, një skenar laboratori dhe një këshillë sigurie të re e jo të përsëritur. Kërko web-in dhe përdor burime zyrtare HTTPS. Rishiko tekstet dhe konfigurimin e faqes dhe përditëso vetëm ato që kanë përmirësim të verifikueshëm. Mos fshi përmbajtje, mësime, pyetje, skenarë, këshilla, seksione ose të dhëna ekzistuese. Ruaj identitetin, hyrjen, përparimin e nxënësve, kodin dhe dizajnin. Nëse do të duhej kod ose veçori e re, raportoje te message pa pretenduar se e ke implementuar.";
    const result = await commandSite(prompt, config, lessons, { maxLessonChanges: 1, requireNewLesson: true });
    return send(res, 200, { ok: true, lessonChanges: result.lessonChanges, contentChanges: result.contentChanges, siteConfig: result.siteConfig, message: result.message });
  } catch (error) {
    console.error("CyberEdu scheduled audit:", error.message);
    return send(res, 503, { error: error.message || "Auditimi i planifikuar dështoi." });
  }
};
