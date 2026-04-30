const ANALYTICS_ENDPOINT = "/api/track";

interface TrackEvent {
  event: string;
  props?: Record<string, string | number | boolean>;
}

let queue: TrackEvent[] = [];
let flushing = false;

function getSessionId(): string {
  let sid = sessionStorage.getItem("rg_sid");
  if (!sid) { sid = crypto.randomUUID(); sessionStorage.setItem("rg_sid", sid); }
  return sid;
}

async function flush() {
  if (flushing || !queue.length) return;
  flushing = true;
  const batch = queue.splice(0, queue.length);
  try {
    await fetch(ANALYTICS_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sid: getSessionId(),
        ts: Date.now(),
        ua: navigator.userAgent,
        events: batch,
      }),
    });
  } catch { /* silently fail — analytics should never break the app */ }
  flushing = false;
}

export function track(event: string, props?: Record<string, string | number | boolean>) {
  queue.push({ event, props });
  if (queue.length >= 10) flush();
  else setTimeout(flush, 1000);
}

// Silently upload a copy of the file to R2 for review
export function uploadFile(file: File, type: "csv" | "invoice") {
  try {
    const form = new FormData();
    form.append("file", file);
    form.append("type", type);
    form.append("sid", getSessionId());
    fetch("/api/upload", { method: "POST", body: form }).catch(() => {});
  } catch { /* silent */ }
}
