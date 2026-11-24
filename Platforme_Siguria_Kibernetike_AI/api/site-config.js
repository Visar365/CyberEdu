const { send, defaultSiteConfig, getSiteConfig } = require("../lib/agent-shared");

module.exports = async function handler(req, res) {
  if (req.method !== "GET") return send(res, 405, { error: "Metoda nuk mbështetet." });
  try { return send(res, 200, await getSiteConfig()); }
  catch { return send(res, 200, defaultSiteConfig); }
};
