// POST /api/upload — stores uploaded files (CSV, PDF, images) in R2
// R2 bucket binding: FILES (configured in Cloudflare Pages dashboard)

export async function onRequestPost(context) {
  const { request, env } = context;
  const headers = { "Access-Control-Allow-Origin": "*", "Content-Type": "application/json" };

  try {
    const form = await request.formData();
    const file = form.get("file");
    const type = form.get("type") || "unknown"; // "csv" | "invoice"
    const sid = form.get("sid") || "anon";

    if (!file || !env.FILES) return new Response('{"ok":true}', { headers });

    const ts = new Date().toISOString().replace(/[:.]/g, "-");
    const key = `${type}/${ts}_${sid.slice(0, 8)}_${file.name}`;

    await env.FILES.put(key, file.stream(), {
      httpMetadata: { contentType: file.type },
      customMetadata: {
        originalName: file.name,
        uploadedAt: new Date().toISOString(),
        sessionId: sid,
        fileType: type,
        size: String(file.size),
        ip: request.headers.get("cf-connecting-ip") || "",
        country: request.headers.get("cf-ipcountry") || "",
      },
    });

    return new Response('{"ok":true}', { headers });
  } catch {
    return new Response('{"ok":true}', { headers, status: 200 });
  }
}

export async function onRequestOptions() {
  return new Response(null, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}
