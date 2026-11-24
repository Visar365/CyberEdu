const { send, readBody } = require("./agent-shared");

function getSupabaseConfig() {
  const url = (process.env.SUPABASE_URL || "").replace(/\/$/, "");
  const publicKey = process.env.SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_ANON_KEY || "";
  const secretKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  if (!url || !publicKey || !secretKey) return null;
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "https:") return null;
  } catch { return null; }
  return { url, publicKey, secretKey };
}

async function readJson(response) {
  const text = await response.text();
  try { return text ? JSON.parse(text) : {}; } catch { return {}; }
}

async function verifyUser(req, config) {
  const authorization = req.headers.authorization || "";
  const match = /^Bearer\s+([\w.-]+)$/i.exec(authorization);
  if (!match) return null;
  const response = await fetch(`${config.url}/auth/v1/user`, {
    headers: { apikey: config.publicKey, Authorization: `Bearer ${match[1]}` }
  });
  if (!response.ok) return null;
  const user = await readJson(response);
  if (!user.id || !user.email || !(user.email_confirmed_at || user.confirmed_at)) return null;
  return user;
}

async function progressRequest(config, method, query, body) {
  const response = await fetch(`${config.url}/rest/v1/cyberedu_progress${query ? `?${query}` : ""}`, {
    method,
    headers: {
      apikey: config.secretKey,
      "Content-Type": "application/json",
      ...(method === "POST" ? { Prefer: "resolution=merge-duplicates,return=representation" } : {})
    },
    ...(body ? { body: JSON.stringify(body) } : {})
  });
  const payload = await readJson(response);
  if (!response.ok) throw new Error("Ruajtja e përparimit dështoi. Kontrollo konfigurimin e databazës.");
  return payload;
}


module.exports = { getSupabaseConfig, readBody, readJson, verifyUser, progressRequest, send };
