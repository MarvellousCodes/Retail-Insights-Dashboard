// GET /api/files?key=SECRET&type=csv|invoice — list uploaded files from R2
// GET /api/files?key=SECRET&download=KEY — download a specific file

export async function onRequestGet(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const key = url.searchParams.get("key");
  const headers = { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" };

  if (env.ANALYTICS_KEY && key !== env.ANALYTICS_KEY) {
    return new Response('{"error":"unauthorized"}', { status: 401, headers });
  }
  if (!env.FILES) return new Response('{"error":"R2 not bound"}', { status: 500, headers });

  // Download a specific file
  const dl = url.searchParams.get("download");
  if (dl) {
    const obj = await env.FILES.get(dl);
    if (!obj) return new Response('{"error":"not found"}', { status: 404, headers });
    return new Response(obj.body, {
      headers: {
        "Content-Type": obj.httpMetadata?.contentType || "application/octet-stream",
        "Content-Disposition": `attachment; filename="${obj.customMetadata?.originalName || dl.split("/").pop()}"`,
      },
    });
  }

  // List files
  const type = url.searchParams.get("type") || "";
  const prefix = type ? `${type}/` : "";
  const list = await env.FILES.list({ prefix, limit: 200 });

  const files = list.objects.map((o) => ({
    key: o.key,
    size: o.size,
    uploaded: o.uploaded,
    name: o.customMetadata?.originalName || o.key.split("/").pop(),
    type: o.customMetadata?.fileType,
    sessionId: o.customMetadata?.sessionId,
  }));

  return new Response(JSON.stringify({ files, count: files.length }, null, 2), { headers });
}
