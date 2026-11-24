const { send, getLessons } = require("../lib/agent-shared");

module.exports = async function handler(req, res) {
  if (req.method !== "GET") return send(res, 405, { error: "Metoda nuk mbështetet." });
  try { return send(res, 200, await getLessons()); }
  catch (error) { console.error("CyberEdu lessons:", error.message); return send(res, 503, { error: "Ruajtja e mësimeve nuk është konfiguruar në Vercel." }); }
};
