import { useEffect, useState } from "react";
import { apiCall } from "@/lib/api";

// Shared, conversational "Ask your shop" store. Turns are grouped into
// conversations (cid). The floating widget and the Ask page both read this,
// so a conversation continues seamlessly between them. Persisted to
// localStorage; the active conversation id lives in sessionStorage.

export interface AskTurn {
  ts: number;
  cid: string; // conversation id
  q: string;
  answer: string;
  sql: string;
  columns: string[];
  rows: any[][];
  row_count: number;
  clarify?: boolean; // true when the answer is a follow-up question, not data
}

export interface Conversation {
  cid: string;
  title: string;
  started: number;
  updated: number;
  turns: AskTurn[]; // chronological
}

const KEY = "rg-ask-history";
const CID_KEY = "rg-ask-cid";
const EVT = "rg-ask-history";
const MAX = 80;

function newCid(): string {
  return "c" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

export function getCurrentCid(): string {
  let c = sessionStorage.getItem(CID_KEY);
  if (!c) {
    c = newCid();
    sessionStorage.setItem(CID_KEY, c);
  }
  return c;
}

export function setCurrentCid(cid: string) {
  sessionStorage.setItem(CID_KEY, cid);
  window.dispatchEvent(new CustomEvent(EVT));
}

export function newConversation(): string {
  const c = newCid();
  sessionStorage.setItem(CID_KEY, c);
  window.dispatchEvent(new CustomEvent(EVT));
  return c;
}

export function loadAskHistory(): AskTurn[] {
  try {
    const raw = localStorage.getItem(KEY);
    const arr = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(arr)) return [];
    // back-compat: turns saved before conversations existed get a legacy cid
    return arr.map((t: any) => (t && t.cid ? t : { ...t, cid: "legacy" }));
  } catch {
    return [];
  }
}

function save(arr: AskTurn[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(arr.slice(0, MAX)));
  } catch {
    /* ignore quota errors */
  }
  window.dispatchEvent(new CustomEvent(EVT));
}

export function pushAskTurn(t: AskTurn) {
  save([t, ...loadAskHistory()]);
}

export function clearAskHistory() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
  newConversation();
}

// Calls the read-only /api/ask endpoint with the current conversation's recent
// turns as context. Stores the turn (data answer OR clarifying question).
export async function runAsk(
  question: string
): Promise<{ ok: boolean; error?: string; usage?: any; clarify?: boolean }> {
  const text = question.trim();
  if (!text) return { ok: false, error: "Please type a question." };
  const cid = getCurrentCid();
  const ctx = loadAskHistory()
    .filter((t) => t.cid === cid)
    .slice(0, 4)
    .reverse()
    .map((t) => ({ q: t.q, answer: t.answer }));
  try {
    const d = await apiCall("/api/ask", {
      method: "POST",
      body: JSON.stringify({ question: text, context: ctx }),
    });
    if (d.error) {
      return { ok: false, error: d.error + (d.attempted_sql ? `  (tried: ${d.attempted_sql})` : "") };
    }
    pushAskTurn({
      ts: Date.now(),
      cid,
      q: text,
      answer: d.answer,
      sql: d.sql || "",
      columns: d.columns || [],
      rows: d.rows || [],
      row_count: d.row_count || 0,
      clarify: !!d.needs_clarification,
    });
    return { ok: true, usage: d.usage, clarify: !!d.needs_clarification };
  } catch {
    return { ok: false, error: "Something went wrong, please try again." };
  }
}

export function useAskHistory(): AskTurn[] {
  const [h, setH] = useState<AskTurn[]>(() => loadAskHistory());
  useEffect(() => {
    const update = () => setH(loadAskHistory());
    const onStorage = (e: StorageEvent) => {
      if (e.key === KEY) update();
    };
    window.addEventListener(EVT, update);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener(EVT, update);
      window.removeEventListener("storage", onStorage);
    };
  }, []);
  return h;
}

export function useCurrentCid(): string {
  const [c, setC] = useState<string>(() => getCurrentCid());
  useEffect(() => {
    const update = () => setC(getCurrentCid());
    window.addEventListener(EVT, update);
    window.addEventListener("storage", update);
    return () => {
      window.removeEventListener(EVT, update);
      window.removeEventListener("storage", update);
    };
  }, []);
  return c;
}

export function groupConversations(history: AskTurn[]): Conversation[] {
  const map = new Map<string, AskTurn[]>();
  for (const t of history) {
    if (!map.has(t.cid)) map.set(t.cid, []);
    map.get(t.cid)!.push(t);
  }
  const out: Conversation[] = [];
  map.forEach((turns, cid) => {
    const chrono = [...turns].sort((a, b) => a.ts - b.ts);
    out.push({
      cid,
      turns: chrono,
      title: chrono[0]?.q || "Conversation",
      started: chrono[0]?.ts || 0,
      updated: chrono[chrono.length - 1]?.ts || 0,
    });
  });
  return out.sort((a, b) => b.updated - a.updated);
}

export function askTimeAgo(ts: number): string {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const hr = Math.floor(m / 60);
  if (hr < 24) return `${hr}h ago`;
  const d = Math.floor(hr / 24);
  return `${d}d ago`;
}
