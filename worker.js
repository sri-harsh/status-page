// ============================================================
//  Status Worker — Cloudflare Worker
//  Deploy to: https://dash.cloudflare.com → Workers & Pages
// ============================================================
//
//  SETUP REQUIRED (one-time):
//  1. Create a KV namespace in your Cloudflare dashboard
//  2. Bind it to this worker as "STATUS_KV"
//  3. Set the SECRET env variable in worker Settings → Variables
//     (use any long random string, e.g. "my-secret-abc123")
//
//  UPDATE ENDPOINT:
//  POST /update?secret=YOUR_SECRET&status=work
//
//  VALID STATUSES: work, commuting, home, sleeping, out, gym, swimming, badminton, movies
// ============================================================

const STATUSES = {
  work:       { label: "At Work",           emoji: "💼", color: "#3B82F6", desc: "Heads down, probably in meetings." },
  commuting:  { label: "Commuting",         emoji: "🚇", color: "#8B5CF6", desc: "In transit. Will respond soon." },
  home:       { label: "Home",              emoji: "🏠", color: "#10B981", desc: "Back home, relaxing or unwinding." },
  sleeping:   { label: "Sleeping",          emoji: "😴", color: "#6B7280", desc: "Phone's been quiet — probably asleep." },
  out:        { label: "Out & About",       emoji: "🌆", color: "#F59E0B", desc: "Out somewhere in the city." },
  gym:        { label: "At the Gym",        emoji: "🏋️", color: "#EF4444", desc: "Working out — phone's in the locker." },
  swimming:   { label: "Swimming",          emoji: "🏊", color: "#06B6D4", desc: "Doing laps — phone's poolside." },
  badminton:  { label: "Playing Badminton", emoji: "🏸", color: "#F97316", desc: "On the court — phone's off to the side." },
  movies:     { label: "At the Movies",     emoji: "🎬", color: "#EC4899", desc: "Catching a film — phone's off." },
};

// Customize the name shown on the status page
const DISPLAY_NAME = "My Status"; // e.g. "Sri's Status"

function renderPage(status, updatedAt) {
  const s = STATUSES[status] || STATUSES["out"];
  const updated = updatedAt ? new Date(parseInt(updatedAt)) : null;
  const timeStr = updated
    ? updated.toLocaleString("en-US", { timeZone: "America/New_York", hour: "numeric", minute: "2-digit", hour12: true, weekday: "short", month: "short", day: "numeric" })
    : "Unknown";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${DISPLAY_NAME}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:wght@300;400;500&display=swap" rel="stylesheet">
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    :root {
      --accent: ${s.color};
      --bg: #0f0f11;
      --surface: #18181b;
      --border: #2a2a30;
      --text: #f4f4f5;
      --muted: #71717a;
    }
    html, body { height: 100%; background: var(--bg); color: var(--text); font-family: 'DM Sans', sans-serif; font-weight: 300; }
    body { display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh; padding: 24px; }
    body::before {
      content: ''; position: fixed; top: 30%; left: 50%; transform: translate(-50%, -50%);
      width: 500px; height: 500px;
      background: radial-gradient(circle, ${s.color}22 0%, transparent 70%);
      pointer-events: none; transition: background 1s ease;
    }
    .card { background: var(--surface); border: 1px solid var(--border); border-radius: 24px; padding: 48px 40px; max-width: 420px; width: 100%; text-align: center; position: relative; animation: rise 0.6s cubic-bezier(0.16, 1, 0.3, 1) both; }
    @keyframes rise { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
    .pill { display: inline-block; background: ${s.color}20; color: ${s.color}; border: 1px solid ${s.color}40; border-radius: 999px; font-size: 11px; font-weight: 500; letter-spacing: 0.12em; text-transform: uppercase; padding: 4px 14px; margin-bottom: 28px; }
    .emoji { font-size: 72px; line-height: 1; margin-bottom: 20px; display: block; animation: pop 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) 0.2s both; }
    @keyframes pop { from { transform: scale(0.6); opacity: 0; } to { transform: scale(1); opacity: 1; } }
    h1 { font-family: 'DM Serif Display', Georgia, serif; font-size: 2rem; font-weight: 400; margin-bottom: 12px; color: var(--text); }
    .desc { font-size: 0.95rem; color: var(--muted); line-height: 1.6; margin-bottom: 32px; }
    .divider { height: 1px; background: var(--border); margin-bottom: 20px; }
    .updated { font-size: 0.78rem; color: var(--muted); letter-spacing: 0.04em; }
    .dot { display: inline-block; width: 7px; height: 7px; border-radius: 50%; background: ${s.color}; margin-right: 6px; vertical-align: middle; animation: pulse 2s ease-in-out infinite; }
    @keyframes pulse { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.4; transform: scale(0.8); } }
    .name { font-size: 0.8rem; color: var(--muted); letter-spacing: 0.08em; text-transform: uppercase; margin-bottom: 6px; }
  </style>
</head>
<body>
  <div class="card">
    <div class="name">${DISPLAY_NAME}</div>
    <div class="pill"><span class="dot"></span>Live</div>
    <span class="emoji">${s.emoji}</span>
    <h1>${s.label}</h1>
    <p class="desc">${s.desc}</p>
    <div class="divider"></div>
    <div class="updated">Last updated: ${timeStr} ET</div>
  </div>
</body>
</html>`;
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;

    // GET / → public status page
    if (request.method === "GET" && path === "/") {
      const status    = await env.STATUS_KV.get("status") || "home";
      const updatedAt = await env.STATUS_KV.get("updatedAt") || null;
      return new Response(renderPage(status, updatedAt), {
        headers: { "Content-Type": "text/html;charset=UTF-8" },
      });
    }

    // POST /update?secret=XXX&status=YYY → update status
    if (request.method === "POST" && path === "/update") {
      const secret = url.searchParams.get("secret");
      const status = url.searchParams.get("status");

      if (!secret || secret !== env.SECRET) {
        return new Response("Unauthorized", { status: 401 });
      }

      if (!status || !STATUSES[status]) {
        const valid = Object.keys(STATUSES).join(", ");
        return new Response(`Invalid status. Valid values: ${valid}`, { status: 400 });
      }

      await env.STATUS_KV.put("status", status);
      await env.STATUS_KV.put("updatedAt", Date.now().toString());

      return new Response(JSON.stringify({ ok: true, status }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response("Not found", { status: 404 });
  },
};
