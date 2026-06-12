// Proxy all /api/store/* requests to the Oracle Cloud API server
const ORACLE_API = "http://143.47.254.68:8080";

export async function onRequest(context) {
  const url = new URL(context.request.url);
  // Strip /api/store prefix and forward to Oracle
  const path = url.pathname.replace("/api/store", "/api");
  const targetUrl = `${ORACLE_API}${path}${url.search}`;

  const headers = new Headers(context.request.headers);
  headers.delete("host");

  const response = await fetch(targetUrl, {
    method: context.request.method,
    headers,
    body: context.request.method !== "GET" ? await context.request.text() : undefined,
  });

  const responseHeaders = new Headers(response.headers);
  responseHeaders.set("Access-Control-Allow-Origin", "*");

  return new Response(response.body, {
    status: response.status,
    headers: responseHeaders,
  });
}
