const { send, getSupabaseConfig, verifyUser, isAdmin, progressRequest } = require("../../lib/user-admin");

module.exports = async function handler(req, res) {
  if (req.method !== "GET") return send(res, 405, { error: "Metoda nuk mbështetet." });
  const config = getSupabaseConfig();
  if (!config || !process.env.CYBEREDU_ADMIN_EMAIL) return send(res, 503, { error: "Paneli admin nuk është konfiguruar." });
  try {
    const user = await verifyUser(req, config);
    if (!user) return send(res, 401, { error: "Hyr në llogari për të vazhduar." });
    if (!await isAdmin(user)) return send(res, 403, { error: "Nuk ke qasje në panelin admin." });
    if (req.query?.check === "1") return send(res, 200, { isAdmin: true });
    const rows = await progressRequest(config, "GET", "select=user_id,email,display_name,completed_lessons,quiz_score,earned_achievements,updated_at&order=updated_at.desc&limit=500");
    return send(res, 200, { users: rows });
  } catch (error) {
    console.error("CyberEdu admin progress:", error.message);
    return send(res, 503, { error: "Nuk mundëm t’i lexojmë arritjet." });
  }
};
