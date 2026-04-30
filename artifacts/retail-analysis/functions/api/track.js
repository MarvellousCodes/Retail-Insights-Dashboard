// Cloudflare Pages Function — receives analytics events and stores in KV
// KV namespace binding: ANALYTICS (configured in wrangler.toml or Pages dashboard)

export async function onRequestPost(context) {
  const { request, env } = context;

  // CORS
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Content-Type": "application/json",
  };

  try {
    const body = await request.json();
    const { sid, ts, ua, events } = body;
    if (!events?.length) return new Response('{"ok":true}', { headers });

    // Store each event batch under a time-based key for easy retrieval
    const key = `evt:${ts}:${sid?.slice(0, 8) || "anon"}`;
    const record = {
      sid,
      ts,
      ua,
      ip: request.headers.get("cf-connecting-ip") || "unknown",
      country: request.headers.get("cf-ipcountry") || "unknown",
      events,
    };

    if (env.ANALYTICS) {
      // Store with 90-day TTL
      await env.ANALYTICS.put(key, JSON.stringify(record), { expirationTtl: 90 * 86400 });
    }

    return new Response('{"ok":true}', { headers });
  } catch {
    return new Response('{"ok":true}', { headers, status: 200 });
  }
}

// Handle CORS preflight
export async function onRequestOptions() {
  return new Response(null, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}
