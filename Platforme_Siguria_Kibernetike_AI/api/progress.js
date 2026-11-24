const { send, readBody, getSupabaseConfig, verifyUser, progressRequest } = require("../lib/supabase");
const { getLessons } = require("../lib/agent-shared");

module.exports = async function handler(req, res) {
  if (req.method !== "GET" && req.method !== "PUT") return send(res, 405, { error: "Metoda nuk mbështetet." });
  const config = getSupabaseConfig();
  if (!config) return send(res, 503, { error: "Ruajtja online nuk është konfiguruar." });
  try {
    const user = await verifyUser(req, config);
    if (!user) return send(res, 401, { error: "Hyrja ka skaduar. Hyr përsëri." });
    const filter = `user_id=eq.${encodeURIComponent(user.id)}&select=user_id,completed_lessons,quiz_score,updated_at&limit=1`;
    if (req.method === "GET") {
      const rows = await progressRequest(config, "GET", filter);
      const row = rows[0] || { completed_lessons: [], quiz_score: 0 };
      return send(res, 200, { progress: row });
    }

    const body = await readBody(req);
    const lessons = await getLessons();
    const validIds = new Set(lessons.map(lesson => lesson.id));
    if (!Array.isArray(body.completed_lessons) || body.completed_lessons.length > 500 || body.completed_lessons.some(id => !Number.isInteger(id) || !validIds.has(id))) {
      return send(res, 400, { error: "Lista e mësimeve të përfunduara nuk është e vlefshme." });
    }
    if (!Number.isSafeInteger(body.quiz_score) || body.quiz_score < 0 || body.quiz_score > 100000) return send(res, 400, { error: "Rezultati i kuizit nuk është i vlefshëm." });
    const completed = [...new Set(body.completed_lessons)];
    const earned = [
      ...(completed.length > 0 ? ["first"] : []),
      ...(completed.length >= 5 ? ["explorer"] : []),
      ...(body.quiz_score >= 5 ? ["quiz"] : []),
      ...(completed.length === lessons.length ? ["complete"] : [])
    ];
    const row = {
      user_id: user.id,
      email: user.email.trim().toLowerCase(),
      display_name: String(user.user_metadata?.display_name || "").trim().slice(0, 80),
      completed_lessons: completed,
      quiz_score: body.quiz_score,
      earned_achievements: earned,
      updated_at: new Date().toISOString()
    };
    await progressRequest(config, "POST", "on_conflict=user_id", row);
    return send(res, 200, { ok: true });
  } catch (error) {
    console.error("CyberEdu progress:", error.message);
    return send(res, 503, { error: "Nuk mundëm ta lexojmë ose ruajmë përparimin." });
  }
};
