import { useState, useEffect, useCallback, useRef } from "react";
import { API_BASE } from "@/lib/api";
import { Sparkles, Send, Loader2, Code2, Download, Gauge, AlertTriangle, FileSpreadsheet, Plus, Trash2, MessageSquare, ArrowLeft } from "lucide-react";
import { useAskHistory, useCurrentCid, runAsk, clearAskHistory, newConversation, setCurrentCid, groupConversations, askTimeAgo, type AskTurn } from "@/lib/askStore";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from "recharts";

interface Usage { today: number; daily_limit: number; month_cost: number; monthly_ceiling: number; configured: boolean; }

interface SheetRecord {
  ts: number;
  request: string;
  filename: string;
  columns: string[];
  rows: any[][]; // preview rows (capped)
  row_count: number;
  file_b64?: string; // kept only for small files
  file_type?: string;
}

const SHEET_KEY = "rg-sheet-history";
const SHEET_B64_LIMIT = 300_000; // ~300 KB base64 kept per file; bigger files rebuild on demand

function loadSheets(): SheetRecord[] {
  try { return JSON.parse(localStorage.getItem(SHEET_KEY) || "[]"); } catch { return []; }
}
function saveSheets(s: SheetRecord[]) {
  try { localStorage.setItem(SHEET_KEY, JSON.stringify(s.slice(0, 20))); } catch { /* quota: drop file payloads and retry */
    try { localStorage.setItem(SHEET_KEY, JSON.stringify(s.slice(0, 20).map(r => ({ ...r, file_b64: undefined })))); } catch {}
  }
}
function downloadB64(b64: string, type: string, filename: string) {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([bytes], { type }));
  a.download = filename; a.click();
}

const SUGGESTIONS = [
  "Which 5 products am I losing money on?",
  "Top 3 departments by sales revenue?",
  "Which suppliers have the lowest average margin?",
  "What's my busiest day of the week?",
];

const SHEET_SUGGESTIONS = [
  "All products below cost, with department and suggested price",
  "Every supplier with total spend and average margin",
  "Top 100 products by sales value this year",
  "Active products with no barcode",
];

function authHeaders(): Record<string, string> {
  const token = localStorage.getItem("rg-token");
  return { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) };
}

/** Build mini chart data when an answer's rows suit a small bar chart. */
function chartData(t: AskTurn): { name: string; value: number }[] | null {
  if (!t.rows || t.rows.length < 3 || t.rows.length > 12 || !t.columns || t.columns.length < 2) return null;
  let numIdx = -1;
  for (let i = 1; i < t.columns.length; i++) {
    if (t.rows.every((r) => r[i] !== null && r[i] !== "" && !isNaN(parseFloat(String(r[i]))))) { numIdx = i; break; }
  }
  if (numIdx === -1) return null;
  return t.rows.map((r) => ({
    name: String(r[0] ?? "").slice(0, 14),
    value: Math.round(parseFloat(String(r[numIdx])) * 100) / 100,
  }));
}

export function AskPage() {
  const [tab, setTab] = useState<"ask" | "sheet">("ask");
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const history = useAskHistory();
  const cid = useCurrentCid();
  const [usage, setUsage] = useState<Usage | null>(null);
  const [openSql, setOpenSql] = useState<Set<number>>(new Set());
  const [sheetQ, setSheetQ] = useState("");
  const [sheetBusy, setSheetBusy] = useState(false);
  const [sheetErr, setSheetErr] = useState("");
  const [sheets, setSheets] = useState<SheetRecord[]>(loadSheets);
  const [viewSheet, setViewSheet] = useState<SheetRecord | null>(null);
  const endRef = useRef<HTMLDivElement | null>(null);

  const conversations = groupConversations(history);
  const turns = history.filter((t) => t.cid === cid).reverse(); // oldest first for chat flow

  // Arriving at Ask starts a fresh session so the page opens on the intro.
  useEffect(() => { newConversation(); }, []);

  const loadUsage = useCallback(() => { fetch(`${API_BASE}/api/ask/usage`, { headers: authHeaders() }).then((r) => r.json()).then(setUsage).catch(() => {}); }, []);
  useEffect(() => { loadUsage(); }, [loadUsage]);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [history.length, busy, cid]);

  const submit = useCallback(async (question: string) => {
    const text = question.trim();
    if (!text || busy) return;
    setError(""); setBusy(true); setQ("");
    const r = await runAsk(text);
    if (!r.ok) setError(r.error || "Something went wrong. Please try again.");
    else if (r.usage) setUsage((u) => ({ ...(u as Usage), ...r.usage, configured: true }));
    setBusy(false);
  }, [busy]);

  const toggleSql = (ts: number) => setOpenSql((s) => { const n = new Set(s); n.has(ts) ? n.delete(ts) : n.add(ts); return n; });

  const exportTxt = () => {
    const text = turns.map((t) => `Q: ${t.q}\nA: ${t.answer}${t.sql ? `\nSQL: ${t.sql}` : ""}\n`).join("\n----------------\n\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([text], { type: "text/plain" }));
    a.download = "retailguard-ask-session.txt"; a.click();
  };

  const buildSheet = useCallback(async (request: string) => {
    const text = request.trim();
    if (!text || sheetBusy) return;
    setSheetErr(""); setSheetBusy(true);
    try {
      const res = await fetch(`${API_BASE}/api/spreadsheet`, {
        method: "POST", headers: authHeaders(),
        body: JSON.stringify({ question: text, format: "json" }),
      });
      if (res.status === 401) { localStorage.removeItem("rg-token"); window.location.href = "/signin.html"; return; }
      const d = await res.json();
      if (d.error) { setSheetErr(d.error); }
      else {
        const rec: SheetRecord = {
          ts: Date.now(), request: text, filename: d.filename,
          columns: d.columns || [], rows: (d.rows || []).slice(0, 50), row_count: d.row_count || 0,
          file_b64: d.file_b64 && d.file_b64.length <= SHEET_B64_LIMIT ? d.file_b64 : undefined,
          file_type: d.file_type,
        };
        const next = [rec, ...sheets];
        setSheets(next); saveSheets(next);
        setViewSheet({ ...rec, rows: (d.rows || []) }); // viewer gets the full preview (up to 200 rows)
        if (d.file_b64) downloadB64(d.file_b64, d.file_type, d.filename);
        if (d.usage) setUsage((u) => ({ ...(u as Usage), ...d.usage, configured: true }));
        setSheetQ("");
      }
    } catch {
      setSheetErr("Something went wrong building the file.");
    }
    setSheetBusy(false);
  }, [sheetBusy, sheets]);

  const rebuildAndDownload = useCallback(async (rec: SheetRecord) => {
    if (rec.file_b64 && rec.file_type) { downloadB64(rec.file_b64, rec.file_type, rec.filename); return; }
    await buildSheet(rec.request);
  }, [buildSheet]);

  const clearSheets = () => { setSheets([]); saveSheets([]); setViewSheet(null); };

  const u = usage;
  const composer = (
    <div className="flex gap-2">
      <input
        value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") submit(q); }}
        placeholder="Ask anything about your shop..." autoFocus
        className="flex-1 h-11 px-3.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" />
      <button onClick={() => submit(q)} disabled={!q.trim() || busy}
        className="inline-flex items-center gap-2 px-4 h-11 rounded-xl bg-violet-600 text-white text-sm font-semibold hover:bg-violet-700 transition disabled:opacity-50">
        {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />} Ask
      </button>
    </div>
  );

  return (
    <div className="md:grid md:grid-cols-[16rem_1fr] md:items-start">
      {/* LEFT: sessions (ask tab) or previous excels (sheet tab) */}
      <aside className="hidden md:flex md:flex-col md:sticky md:top-0 md:h-screen overflow-y-auto border-r border-gray-200 dark:border-gray-800 bg-gray-50/60 dark:bg-gray-900/30">
        {tab === "ask" ? (
          <>
            <div className="flex items-center justify-between px-3 py-3 border-b border-gray-200 dark:border-gray-800">
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-600 dark:text-gray-300"><MessageSquare className="w-3.5 h-3.5" /> Sessions</span>
              <button onClick={() => { newConversation(); setError(""); }} title="New session" className="inline-flex items-center gap-1 text-[11px] px-2 py-1 rounded-lg bg-violet-600 text-white hover:bg-violet-700"><Plus className="w-3.5 h-3.5" /> New</button>
            </div>
            <div className="p-2 space-y-1">
              {conversations.length === 0 && <p className="text-xs text-gray-400 px-2 py-3">Your past sessions show up here, including ones started from the chat bubble. Click one to reopen it.</p>}
              {conversations.map((c) => (
                <button key={c.cid} onClick={() => setCurrentCid(c.cid)} className={`w-full text-left px-2.5 py-2 rounded-lg transition ${c.cid === cid ? "bg-violet-100 dark:bg-violet-900/30" : "hover:bg-violet-50 dark:hover:bg-violet-900/20"}`}>
                  <span className="block text-xs text-gray-700 dark:text-gray-200 truncate font-medium">{c.title}</span>
                  <span className="block text-[10px] text-gray-400 mt-0.5">{c.turns.length} message{c.turns.length === 1 ? "" : "s"} &middot; {askTimeAgo(c.updated)}</span>
                </button>
              ))}
            </div>
            {history.length > 0 && (
              <div className="mt-auto p-2 border-t border-gray-200 dark:border-gray-800">
                <button onClick={clearAskHistory} className="inline-flex items-center gap-1.5 text-[11px] text-gray-400 hover:text-red-500 px-2 py-1"><Trash2 className="w-3.5 h-3.5" /> Clear all</button>
              </div>
            )}
          </>
        ) : (
          <>
            <div className="flex items-center justify-between px-3 py-3 border-b border-gray-200 dark:border-gray-800">
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-600 dark:text-gray-300"><FileSpreadsheet className="w-3.5 h-3.5" /> Spreadsheets</span>
              <button onClick={() => setViewSheet(null)} title="New spreadsheet" className="inline-flex items-center gap-1 text-[11px] px-2 py-1 rounded-lg bg-violet-600 text-white hover:bg-violet-700"><Plus className="w-3.5 h-3.5" /> New</button>
            </div>
            <div className="p-2 space-y-1">
              {sheets.length === 0 && <p className="text-xs text-gray-400 px-2 py-3">Spreadsheets you build show up here. Click one to view it again or download it.</p>}
              {sheets.map((s) => (
                <button key={s.ts} onClick={() => setViewSheet(s)} className={`w-full text-left px-2.5 py-2 rounded-lg transition ${viewSheet?.ts === s.ts ? "bg-violet-100 dark:bg-violet-900/30" : "hover:bg-violet-50 dark:hover:bg-violet-900/20"}`}>
                  <span className="block text-xs text-gray-700 dark:text-gray-200 truncate font-medium">{s.request}</span>
                  <span className="block text-[10px] text-gray-400 mt-0.5">{s.row_count} rows &middot; {askTimeAgo(s.ts)}</span>
                </button>
              ))}
            </div>
            {sheets.length > 0 && (
              <div className="mt-auto p-2 border-t border-gray-200 dark:border-gray-800">
                <button onClick={clearSheets} className="inline-flex items-center gap-1.5 text-[11px] text-gray-400 hover:text-red-500 px-2 py-1"><Trash2 className="w-3.5 h-3.5" /> Clear all</button>
              </div>
            )}
          </>
        )}
      </aside>

      {/* RIGHT */}
      <div className="flex flex-col h-screen">
        {/* header */}
        <div className="px-4 md:px-6 pt-4 pb-3 border-b border-gray-100 dark:border-gray-800">
          <div className="max-w-3xl mx-auto">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <Sparkles className="w-5 h-5 text-violet-600" />
                <h1 className="text-lg md:text-xl font-bold text-gray-900 dark:text-white">Ask your shop</h1>
              </div>
              <div className="flex items-center gap-3">
                {u && (
                  <span className="hidden sm:inline-flex items-center gap-1.5 text-[11px] text-gray-500">
                    <Gauge className="w-3.5 h-3.5" /> <b className="text-gray-700 dark:text-gray-200">{u.today}/{u.daily_limit}</b> today
                  </span>
                )}
                <button onClick={() => { if (tab === "ask") { newConversation(); setError(""); } else setViewSheet(null); }} className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 md:hidden"><Plus className="w-3.5 h-3.5" /> New</button>
                {turns.length > 0 && tab === "ask" && (
                  <button onClick={exportTxt} className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800">
                    <Download className="w-3.5 h-3.5" /> Export
                  </button>
                )}
              </div>
            </div>
            <div className="mt-3 inline-flex bg-gray-100 dark:bg-gray-800 rounded-xl p-1">
              <button onClick={() => setTab("ask")}
                className={`px-4 py-1.5 rounded-lg text-sm transition ${tab === "ask" ? "bg-white dark:bg-gray-900 text-gray-900 dark:text-white font-semibold shadow-sm" : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"}`}>
                Ask
              </button>
              <button onClick={() => setTab("sheet")}
                className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm transition ${tab === "sheet" ? "bg-white dark:bg-gray-900 text-gray-900 dark:text-white font-semibold shadow-sm" : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"}`}>
                <FileSpreadsheet className="w-3.5 h-3.5" /> Spreadsheet
              </button>
            </div>
          </div>
        </div>

        {tab === "sheet" ? (
          viewSheet ? (
            /* ===== SPREADSHEET TAB, VIEWER ===== */
            <div className="flex-1 overflow-y-auto px-4 md:px-6 py-5">
              <div className="max-w-3xl mx-auto">
                <button onClick={() => setViewSheet(null)} className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-violet-600 mb-3"><ArrowLeft className="w-3.5 h-3.5" /> Build another</button>
                <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden">
                  <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{viewSheet.request}</p>
                      <p className="text-[11px] text-gray-400 mt-0.5">{viewSheet.filename} &middot; {viewSheet.row_count} rows &middot; {askTimeAgo(viewSheet.ts)}</p>
                    </div>
                    <button onClick={() => rebuildAndDownload(viewSheet)} disabled={sheetBusy}
                      className="inline-flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg bg-violet-600 text-white font-semibold hover:bg-violet-700 disabled:opacity-50 whitespace-nowrap">
                      {sheetBusy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />} {viewSheet.file_b64 ? "Download Excel" : "Rebuild and download"}
                    </button>
                  </div>
                  <div className="overflow-x-auto max-h-[26rem] overflow-y-auto">
                    <table className="text-xs w-full">
                      <thead className="text-gray-500 border-b border-gray-100 dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-800">
                        <tr>{viewSheet.columns.map((c, j) => <th key={j} className="px-3 py-2 text-left font-semibold whitespace-nowrap">{c}</th>)}</tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
                        {viewSheet.rows.map((r, ri) => (
                          <tr key={ri} className={ri % 2 ? "bg-gray-50/60 dark:bg-gray-900/20" : ""}>
                            {r.map((v, ci) => <td key={ci} className="px-3 py-1.5 text-gray-700 dark:text-gray-300 max-w-[200px] truncate">{v === null ? "\u2014" : String(v)}</td>)}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {viewSheet.row_count > viewSheet.rows.length && (
                    <p className="px-4 py-2 text-[11px] text-gray-400 border-t border-gray-100 dark:border-gray-700">Showing the first {viewSheet.rows.length} of {viewSheet.row_count} rows. The full data is in the Excel file.</p>
                  )}
                </div>
                {sheetErr && (
                  <div className="mt-3 flex items-start gap-2 p-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 text-sm">
                    <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" /> <span>{sheetErr}</span>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* ===== SPREADSHEET TAB, INTRO ===== */
            <div className="flex-1 flex flex-col items-center justify-center px-4 pb-24">
              <div className="w-full max-w-xl text-center">
                <div className="w-12 h-12 rounded-2xl bg-violet-100 dark:bg-violet-900/40 flex items-center justify-center mx-auto mb-4">
                  <FileSpreadsheet className="w-6 h-6 text-violet-600" />
                </div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1.5">What list do you want to build?</h2>
                <p className="text-xs text-gray-500 mb-5">Describe it in plain English and get an Excel file, with a preview right here. The lookup costs a fraction of a cent. Building the file is free.</p>
                <div className="flex gap-2">
                  <input
                    value={sheetQ} onChange={(e) => setSheetQ(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") buildSheet(sheetQ); }}
                    placeholder="e.g. every active product below 25% margin with the suggested price" autoFocus
                    className="flex-1 h-11 px-3.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" />
                  <button onClick={() => buildSheet(sheetQ)} disabled={!sheetQ.trim() || sheetBusy}
                    className="inline-flex items-center gap-2 px-4 h-11 rounded-xl bg-violet-600 text-white text-sm font-semibold hover:bg-violet-700 transition disabled:opacity-50 whitespace-nowrap">
                    {sheetBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileSpreadsheet className="w-4 h-4" />} Build Excel
                  </button>
                </div>
                <div className="flex flex-wrap justify-center gap-2 mt-4">
                  {SHEET_SUGGESTIONS.map((s) => (
                    <button key={s} onClick={() => buildSheet(s)} disabled={sheetBusy}
                      className="px-3 py-1.5 rounded-full text-xs bg-violet-50 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 hover:bg-violet-100 dark:hover:bg-violet-900/50 transition disabled:opacity-50">
                      {s}
                    </button>
                  ))}
                </div>
                {sheetBusy && <div className="mt-4 text-sm text-gray-400 flex items-center justify-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Building your spreadsheet...</div>}
                {sheetErr && (
                  <div className="mt-4 flex items-start gap-2 p-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 text-sm text-left">
                    <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" /> <span>{sheetErr}</span>
                  </div>
                )}
              </div>
            </div>
          )
        ) : turns.length === 0 && !busy ? (
          /* ===== ASK TAB, EMPTY SESSION: centered intro ===== */
          <div className="flex-1 flex flex-col items-center justify-center px-4 pb-24">
            <div className="w-full max-w-xl text-center">
              <div className="w-12 h-12 rounded-2xl bg-violet-100 dark:bg-violet-900/40 flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-6 h-6 text-violet-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1.5">What would you like to know?</h2>
              <p className="text-xs text-gray-500 mb-5">Stock, margins, departments, sales or suppliers. Plain English is fine. If a question is unclear I will ask a quick follow-up.</p>
              {composer}
              <div className="flex flex-wrap justify-center gap-2 mt-4">
                {SUGGESTIONS.map((s) => (
                  <button key={s} onClick={() => submit(s)} disabled={busy}
                    className="px-3 py-1.5 rounded-full text-xs bg-violet-50 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 hover:bg-violet-100 dark:hover:bg-violet-900/50 transition disabled:opacity-50">
                    {s}
                  </button>
                ))}
              </div>
              {error && (
                <div className="mt-4 flex items-start gap-2 p-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 text-sm text-left">
                  <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" /> <span>{error}</span>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* ===== ASK TAB, ACTIVE SESSION: chat bubbles + docked composer ===== */
          <>
            <div className="flex-1 overflow-y-auto px-4 md:px-6 py-5">
              <div className="max-w-3xl mx-auto flex flex-col gap-3">
                {turns.map((t) => {
                  const cd = t.clarify ? null : chartData(t);
                  return (
                    <div key={t.ts} className="flex flex-col gap-3">
                      <div className="self-end max-w-[78%] bg-violet-600 text-white text-sm px-4 py-2.5 rounded-2xl rounded-br-md whitespace-pre-wrap">{t.q}</div>
                      <div className={`self-start max-w-[88%] rounded-2xl rounded-bl-md px-4 py-3 text-sm leading-relaxed ${t.clarify ? "bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200" : "bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-100"}`}>
                        <p className="whitespace-pre-wrap">{t.answer}</p>
                        {t.clarify ? (
                          <p className="mt-2 text-[11px] text-amber-600 dark:text-amber-400">Type your reply below to continue.</p>
                        ) : (
                          <>
                            {cd && (
                              <div className="mt-3 h-32 -ml-2">
                                <ResponsiveContainer width="100%" height="100%">
                                  <BarChart data={cd} margin={{ top: 4, right: 4, bottom: 0, left: 4 }}>
                                    <XAxis dataKey="name" tick={{ fontSize: 9 }} interval={0} axisLine={false} tickLine={false} />
                                    <YAxis hide />
                                    <Tooltip cursor={{ fill: "rgba(124,58,237,0.08)" }} contentStyle={{ fontSize: 11, borderRadius: 8 }} />
                                    <Bar dataKey="value" fill="#7c3aed" radius={[4, 4, 0, 0]} />
                                  </BarChart>
                                </ResponsiveContainer>
                              </div>
                            )}
                            <div className="mt-2.5 flex items-center gap-3">
                              <button onClick={() => toggleSql(t.ts)} className="inline-flex items-center gap-1.5 text-[11px] text-gray-500 hover:text-violet-600">
                                <Code2 className="w-3 h-3" /> {openSql.has(t.ts) ? "Hide" : "Show"} SQL
                              </button>
                              <span className="text-[11px] text-gray-400">{t.row_count} row{t.row_count === 1 ? "" : "s"}</span>
                            </div>
                            {openSql.has(t.ts) && t.sql && (
                              <pre className="mt-2 p-3 rounded-lg bg-gray-900 text-gray-100 text-[10.5px] overflow-x-auto whitespace-pre-wrap">{t.sql}</pre>
                            )}
                            {openSql.has(t.ts) && t.rows.length > 0 && (
                              <div className="mt-2 overflow-x-auto">
                                <table className="text-[11px] w-full">
                                  <thead className="text-gray-500 border-b border-gray-200 dark:border-gray-700">
                                    <tr>{t.columns.map((c, j) => <th key={j} className="px-2 py-1 text-left font-medium">{c}</th>)}</tr>
                                  </thead>
                                  <tbody className="divide-y divide-gray-200/60 dark:divide-gray-700">
                                    {t.rows.slice(0, 8).map((r, ri) => (
                                      <tr key={ri}>{r.map((v, ci) => <td key={ci} className="px-2 py-1 text-gray-700 dark:text-gray-300 max-w-[160px] truncate">{v === null ? "\u2014" : String(v)}</td>)}</tr>
                                    ))}
                                  </tbody>
                                </table>
                                {t.rows.length > 8 && <p className="text-[10.5px] text-gray-400 mt-1">...and {t.rows.length - 8} more rows</p>}
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
                {busy && (
                  <div className="self-start bg-gray-100 dark:bg-gray-800 rounded-2xl rounded-bl-md px-4 py-3 text-sm text-gray-400 inline-flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" /> Thinking...
                  </div>
                )}
                <div ref={endRef} />
              </div>
            </div>
            <div className="px-4 md:px-6 py-3.5 border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900">
              <div className="max-w-3xl mx-auto">
                {error && (
                  <div className="mb-2.5 flex items-start gap-2 p-2.5 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 text-xs">
                    <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" /> <span>{error}</span>
                  </div>
                )}
                {composer}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
