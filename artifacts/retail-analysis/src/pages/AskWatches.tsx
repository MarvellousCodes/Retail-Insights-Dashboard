import React, { useState, useEffect, useCallback } from "react";
import { apiCall } from "@/lib/api";

/* ===== SVG Icons (no emojis) ===== */
const BellSvg = () => (
  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
  </svg>
);

const XSvg = () => (
  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const EyeSvg = () => (
  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
  </svg>
);

/* ===== Watch Types ===== */
export interface Watch {
  id: number;
  shop: string;
  name: string;
  question: string;
  sql: string;
  column: string;
  op: "above" | "below";
  threshold: number;
  last_value: number | null;
  last_evaluated_at: string | null;
  breached: boolean;
  active: boolean;
  created_at: string;
}

/* ===== Watch Form (inline mini-form on stat answers) ===== */
interface WatchFormProps {
  question: string;
  sql: string;
  column: string;
  currentValue: number | null;
}

export function WatchForm({ question, sql, column, currentValue }: WatchFormProps) {
  const [open, setOpen] = useState(false);
  const [threshold, setThreshold] = useState("");
  const [op, setOp] = useState<"above" | "below">("above");
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const [err, setErr] = useState("");

  const handleSave = async () => {
    const val = parseFloat(threshold);
    if (isNaN(val)) { setErr("Enter a number"); return; }
    setSaving(true);
    setErr("");
    try {
      const res = await apiCall("/api/watches", {
        method: "POST",
        body: JSON.stringify({ question, sql, column, op, threshold: val }),
      });
      if (res?.id) {
        setDone(true);
        setTimeout(() => { setOpen(false); setDone(false); setThreshold(""); }, 2000);
      } else {
        setErr(res?.error || "Failed");
      }
    } catch {
      setErr("Network error");
    }
    setSaving(false);
  };

  if (done) {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 mt-2">
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
        Watch added
      </span>
    );
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1 text-[10px] text-gray-400 hover:text-violet-600 dark:hover:text-violet-400 mt-2 transition-colors"
      >
        <EyeSvg /> Watch this
      </button>
    );
  }

  return (
    <div className="mt-2 flex flex-wrap items-center gap-1.5">
      <span className="text-[10px] text-gray-500">Alert when</span>
      <select
        value={op}
        onChange={(e) => setOp(e.target.value as "above" | "below")}
        className="text-[10px] px-1.5 py-0.5 rounded border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300"
      >
        <option value="above">above</option>
        <option value="below">below</option>
      </select>
      <input
        type="number"
        value={threshold}
        onChange={(e) => setThreshold(e.target.value)}
        placeholder={currentValue != null ? String(Math.round(currentValue)) : "value"}
        className="w-20 text-[10px] px-1.5 py-0.5 rounded border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300"
      />
      <button
        onClick={handleSave}
        disabled={saving}
        className="text-[10px] px-2 py-0.5 rounded bg-violet-600 text-white hover:bg-violet-700 disabled:opacity-50"
      >
        {saving ? "..." : "Save"}
      </button>
      <button
        onClick={() => setOpen(false)}
        className="text-[10px] text-gray-400 hover:text-gray-600"
      >
        Cancel
      </button>
      {err && <span className="text-[10px] text-red-500">{err}</span>}
    </div>
  );
}

/* ===== Watches Strip (empty state on Ask page) ===== */
export function WatchesStrip() {
  const [watches, setWatches] = useState<Watch[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const data = await apiCall("/api/watches");
      if (Array.isArray(data)) setWatches(data);
      else if (data?.watches && Array.isArray(data.watches)) setWatches(data.watches);
    } catch { /* silent */ }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async (id: number) => {
    try {
      await apiCall(`/api/watches/${id}`, { method: "DELETE" });
      setWatches((w) => w.filter((x) => x.id !== id));
    } catch { /* silent */ }
  };

  if (loading || watches.length === 0) return null;

  return (
    <div className="w-full max-w-xl mt-5">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 mb-2 px-1 flex items-center gap-1.5">
        <EyeSvg /> Active watches
      </p>
      <div className="flex flex-wrap gap-2">
        {watches.filter((w) => w.active).map((w) => (
          <div
            key={w.id}
            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-[11px] border transition ${
              w.breached
                ? "bg-red-50/80 dark:bg-red-900/20 border-red-200 dark:border-red-800/60 text-red-700 dark:text-red-300"
                : "bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300"
            }`}
          >
            {w.breached && <BellSvg />}
            <span className="truncate max-w-[180px]">{w.name || w.question}</span>
            {w.last_value != null && (
              <span className="text-[10px] text-gray-400 font-mono">
                {w.op === "above" ? ">" : "<"}{w.threshold} (now: {typeof w.last_value === "number" ? w.last_value.toLocaleString() : w.last_value})
              </span>
            )}
            <button
              onClick={() => handleDelete(w.id)}
              className="text-gray-300 hover:text-red-500 transition-colors"
              title="Remove watch"
            >
              <XSvg />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
