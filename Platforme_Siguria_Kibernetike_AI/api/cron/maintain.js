const { send, authorized, requireEnv, getLessons, getSiteConfig, commandSite } = require("../../lib/agent-shared");

module.exports = async function handler(req, res) {
  if (req.method !== "GET") return send(res, 405, { error: "Metoda nuk mbështetet." });
  if (!process.env.CRON_SECRET || !authorized(req, process.env.CRON_SECRET)) return send(res, 401, { error: "Pa autorizim." });
  try {
    requireEnv("OPENAI_API_KEY", "KV_REST_API_URL", "KV_REST_API_TOKEN");
    const [lessons, config] = await Promise.all([getLessons(), getSiteConfig()]);
    const prompt = "Bëj mirëmbajtjen ditore të CyberEdu pa pritur komandë nga administratori. Shto saktësisht një mësim të ri në çdo cikël ditor të suksesshëm, që kursi të zgjerohet gradualisht nga bazat drejt temave më të avancuara. Lexo katalogun ekzistues dhe zgjidh temë të re që nuk përsërit titujt, shembujt ose përmbajtjen e mësimeve ekzistuese. Mësimi duhet të jetë i dobishëm, praktik, në shqip të qartë dhe i mbështetur në burime zyrtare të verifikueshme. Mos ndrysho ose fshi asnjë mësim ekzistues. Kontrollo gjithashtu për këshilla të pasakta ose të vjetruara dhe rifresko këshillën e ditës apo tekstet e faqes vetëm kur ka vlerë të qartë. Ruaj dashboard dhe seksionin e mësimeve.";
    const result = await commandSite(prompt, config, lessons, { maxLessonChanges: 1, requireNewLesson: true });
    return send(res, 200, { ok: true, lessonChanges: result.lessonChanges, siteConfig: result.siteConfig });
  } catch (error) {
    console.error("CyberEdu scheduled audit:", error.message);
    return send(res, 503, { error: error.message || "Auditimi i planifikuar dështoi." });
  }
};
