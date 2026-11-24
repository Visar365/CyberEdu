const { send, getLessons } = require("../lib/agent-shared");
const baseLessons = require("../data/base-lessons.json");

module.exports = async function handler(req, res) {
  if (req.method !== "GET") return send(res, 405, { error: "Metoda nuk mbështetet." });
  try { return send(res, 200, await getLessons()); }
  catch (error) { console.error("CyberEdu lessons:", error.message); return send(res, 200, baseLessons); }
};
