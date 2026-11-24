const { send, readBody, getSupabaseConfig, readJson } = require("../lib/supabase");

module.exports = async function handler(req, res) {
  const config = getSupabaseConfig();
  if (req.method === "GET") return send(res, 200, { configured: Boolean(config) });
  if (req.method !== "POST") return send(res, 405, { error: "Metoda nuk mbështetet." });
  if (!config) return send(res, 503, { error: "Hyrja në server nuk është konfiguruar ende." });

  try {
    const body = await readBody(req);
    const action = body.action;
    let endpoint;
    let payload;
    if (action === "signup") {
      const email = String(body.email || "").trim().toLowerCase();
      const password = String(body.password || "");
      const name = String(body.name || "").trim();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254 || password.length < 8 || password.length > 128 || name.length < 1 || name.length > 80) {
        return send(res, 400, { error: "Kontrollo email-in, emrin dhe fjalëkalimin (të paktën 8 karaktere)." });
      }
      endpoint = "/auth/v1/signup";
      payload = { email, password, data: { display_name: name } };
    } else if (action === "login") {
      const email = String(body.email || "").trim().toLowerCase();
      const password = String(body.password || "");
      if (!email || !password || email.length > 254 || password.length > 128) return send(res, 400, { error: "Shkruaj email-in dhe fjalëkalimin." });
      endpoint = "/auth/v1/token?grant_type=password";
      payload = { email, password };
    } else if (action === "refresh") {
      const refreshToken = String(body.refresh_token || "");
      if (refreshToken.length < 20 || refreshToken.length > 4096) return send(res, 400, { error: "Sesioni ka skaduar. Hyr përsëri." });
      endpoint = "/auth/v1/token?grant_type=refresh_token";
      payload = { refresh_token: refreshToken };
    } else if (action === "logout") {
      const token = String(req.headers.authorization || "").replace(/^Bearer\s+/i, "");
      if (token) await fetch(`${config.url}/auth/v1/logout`, { method: "POST", headers: { apikey: config.publicKey, Authorization: `Bearer ${token}` } });
      return send(res, 200, { ok: true });
    } else return send(res, 400, { error: "Veprimi nuk njihet." });

    const response = await fetch(`${config.url}${endpoint}`, {
      method: "POST",
      headers: { apikey: config.publicKey, "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const result = await readJson(response);
    if (!response.ok) {
      const message = result.msg || result.message || result.error_description || result.error || "Kërkesa e hyrjes dështoi.";
      return send(res, response.status, { error: String(message).slice(0, 240) });
    }
    if (action === "signup" && !result.access_token) {
      return send(res, 200, { confirmationRequired: true, message: "Kontrollo email-in dhe konfirmo adresën. Pastaj hyr në llogari." });
    }
    return send(res, 200, result);
  } catch (error) {
    console.error("CyberEdu auth:", error.message);
    return send(res, 503, { error: "Shërbimi i llogarive nuk u përgjigj. Provo përsëri." });
  }
};
