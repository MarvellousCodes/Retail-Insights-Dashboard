// Proxy all /api/store/* requests to the Oracle Cloud API server
const ORACLE_API = "http://143.47.254.68:8080";

export async function onRequest(context) {
  // Handle CORS preflight
  if (context.request.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    });
  }

  const url = new URL(context.request.url);
  const path = url.pathname.replace("/api/store", "/api");
  const targetUrl = `${ORACLE_API}${path}${url.search}`;

  const fetchOptions = {
    method: context.request.method,
    headers: { "Content-Type": "application/json" },
  };

  if (context.request.method === "POST") {
    fetchOptions.body = await context.request.text();
  }

  try {
    const response = await fetch(targetUrl, fetchOptions);
    const body = await response.text();

    return new Response(body, {
      status: response.status,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: "API unreachable", detail: e.message }), {
      status: 502,
      headers: { "Content-Type": "application/json" },
    });
  }
}
