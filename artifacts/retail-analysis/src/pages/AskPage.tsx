import { useState, useEffect, useRef, useCallback } from "react";
import { apiCall } from "@/lib/api";
import { Sparkles, Send, Loader2, Code2, Download, Gauge, AlertTriangle } from "lucide-react";

interface Turn {
  q: string; answer: string; sql: string;
  columns: string[]; rows: any[][]; row_count: number; showSql: boolean;
}
interface Usage { today: number; daily_limit: number; month_cost: number; monthly_ceiling: number; configured: boolean; }

const SUGGESTIONS = [
  "Which 5 products am I losing money on?",
  "Top 3 departments by sales revenue?",
  "Which suppliers have the lowest average margin?",
  "What's my busiest day of the week?",
  "How many active products are below 20% margin?",
];

export function AskPage() {
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [history, setHistory] = useState<Turn[]>([]);
  const [usage, setUsage] = useState<Usage | null>(null);
  const endRef = useRef<HTMLDivElement | null>(null);

  const loadUsage = useCallback(() => { apiCall("/api/ask/usage").then(setUsage).catch(() => {}); }, []);
  useEffect(() => { loadUsage(); }, [loadUsage]);

  const submit = useCallback(async (question: string) => {
    const text = question.trim();
    if (!text || busy) return;
    setError(""); setBusy(true); setQ("");
    try {
      const d = await apiCall("/api/ask", { method: "POST", body: JSON.stringify({ question: text }) });
      if (d.error) {
        setError(d.error + (d.attempted_sql ? `  (tried: ${d.attempted_sql})` : ""));
      } else {
        setHistory((h) => [{ q: text, answer: d.answer, sql: d.sql, columns: d.columns || [], rows: d.rows || [], row_count: d.row_count || 0, showSql: false }, ...h]);
        if (d.usage) setUsage((u) => ({ ...(u as Usage), ...d.usage, configured: true }));
      }
    } catch {
      setError("Something went wrong - please try again.");
    }
    setBusy(false);
  }, [busy]);

  const toggleSql = (i: number) => setHistory((h) => h.map((t, idx) => idx === i ? { ...t, showSql: !t.showSql } : t));

  const exportTxt = () => {
    const text = history.slice().reverse().map((t) => `Q: ${t.q}\nA: ${t.answer}\nSQL: ${t.sql}\n`).join("\n----------------\n\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([text], { type: "text/plain" }));
    a.download = "retailguard-ask-history.txt"; a.click();
  };

  const u = usage;
  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between gap-2 mb-1">
        <div className="flex items-center gap-2.5">
          <Sparkles className="w-6 h-6 text-violet-600" />
          <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">Ask your shop</h1>
        </div>
        {history.length > 0 && (
          <button onClick={exportTxt} className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800">
            <Download className="w-3.5 h-3.5" /> Export
          </button>
        )}
      </div>
      <p className="text-xs text-gray-500 mb-3">Ask a plain-English question about your stock, margins, departments, sales or suppliers. Read-only — it can never change your data.</p>

      {u && (
        <div className="flex items-center gap-3 mb-3 text-xs text-gray-500">
          <span className="inline-flex items-center gap-1.5"><Gauge className="w-3.5 h-3.5" /> <b className="text-gray-700 dark:text-gray-200">{u.today}/{u.daily_limit}</b> today</span>
          <span>${u.month_cost.toFixed(3)} / ${u.monthly_ceiling.toFixed(0)} this month</span>
        </div>
      )}

      {/* input */}
      <div className="flex gap-2 mb-3">
        <input
          value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") submit(q); }}
          placeholder="e.g. which drinks am I losing money on?" autoFocus
          className="flex-1 h-11 px-3.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" />
        <button onClick={() => submit(q)} disabled={!q.trim() || busy}
          className="inline-flex items-center gap-2 px-4 h-11 rounded-xl bg-violet-600 text-white text-sm font-semibold hover:bg-violet-700 transition disabled:opacity-50">
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />} Ask
        </button>
      </div>

      {/* suggestions */}
      {history.length === 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {SUGGESTIONS.map((s) => (
            <button key={s} onClick={() => submit(s)} disabled={busy}
              className="px-3 py-1.5 rounded-full text-xs bg-violet-50 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 hover:bg-violet-100 dark:hover:bg-violet-900/50 transition disabled:opacity-50">
              {s}
            </button>
          ))}
        </div>
      )}

      {error && (
        <div className="mb-4 flex items-start gap-2 p-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 text-sm">
          <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" /> <span>{error}</span>
        </div>
      )}

      {busy && <div className="mb-4 text-sm text-gray-400 flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Thinking…</div>}

      {/* history (newest first) */}
      <div ref={endRef} className="space-y-4">
        {history.map((t, i) => (
          <div key={i} className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="px-4 py-2.5 border-b border-gray-100 dark:border-gray-700 text-sm font-semibold text-gray-900 dark:text-white">{t.q}</div>
            <div className="p-4">
              <p className="text-sm text-gray-800 dark:text-gray-100 whitespace-pre-wrap leading-relaxed">{t.answer}</p>
              <div className="mt-3 flex items-center gap-3">
                <button onClick={() => toggleSql(i)} className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-violet-600">
                  <Code2 className="w-3.5 h-3.5" /> {t.showSql ? "Hide" : "Show"} SQL
                </button>
                <span className="text-xs text-gray-400">{t.row_count} row{t.row_count === 1 ? "" : "s"}</span>
              </div>
              {t.showSql && (
                <pre className="mt-2 p-3 rounded-lg bg-gray-900 text-gray-100 text-[11px] overflow-x-auto whitespace-pre-wrap">{t.sql}</pre>
              )}
              {t.showSql && t.rows.length > 0 && (
                <div className="mt-2 overflow-x-auto">
                  <table className="text-xs w-full">
                    <thead className="text-gray-500 border-b border-gray-100 dark:border-gray-700">
                      <tr>{t.columns.map((c, j) => <th key={j} className="px-2 py-1 text-left font-medium">{c}</th>)}</tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
                      {t.rows.slice(0, 8).map((r, ri) => (
                        <tr key={ri}>{r.map((v, ci) => <td key={ci} className="px-2 py-1 text-gray-700 dark:text-gray-300 max-w-[160px] truncate">{v === null ? "—" : String(v)}</td>)}</tr>
                      ))}
                    </tbody>
                  </table>
                  {t.rows.length > 8 && <p className="text-[11px] text-gray-400 mt-1">…and {t.rows.length - 8} more rows</p>}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
