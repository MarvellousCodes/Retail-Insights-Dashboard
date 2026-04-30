// GET /api/analytics — returns aggregated usage data
// Protected by a simple shared key (query param ?key=...)

export async function onRequestGet(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const key = url.searchParams.get("key");

  const headers = { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" };

  // Simple auth — set ANALYTICS_KEY in Pages environment variables
  if (env.ANALYTICS_KEY && key !== env.ANALYTICS_KEY) {
    return new Response('{"error":"unauthorized"}', { status: 401, headers });
  }

  if (!env.ANALYTICS) {
    return new Response('{"error":"KV not bound"}', { status: 500, headers });
  }

  // List all events (last 1000)
  const list = await env.ANALYTICS.list({ prefix: "evt:", limit: 1000 });
  const events = [];
  const summary = { csv_uploads: 0, invoice_scans: 0, invoice_exports: 0, add_to_csv: 0, total_products: 0, total_new_products: 0, sessions: new Set() };

  for (const k of list.keys) {
    const val = await env.ANALYTICS.get(k.name, "json");
    if (!val) continue;
    events.push(val);
    if (val.sid) summary.sessions.add(val.sid);
    for (const e of val.events || []) {
      if (e.event === "csv_upload") { summary.csv_uploads++; summary.total_products += (e.props?.products || 0); }
      if (e.event === "invoice_scan") { summary.invoice_scans++; summary.total_new_products += (e.props?.newProducts || 0); }
      if (e.event === "invoice_export") summary.invoice_exports++;
      if (e.event === "add_to_csv") summary.add_to_csv++;
    }
  }

  return new Response(JSON.stringify({
    summary: { ...summary, sessions: summary.sessions.size },
    recentEvents: events.slice(-50),
  }, null, 2), { headers });
}
