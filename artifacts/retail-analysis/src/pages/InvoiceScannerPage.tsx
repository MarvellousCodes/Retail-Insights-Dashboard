import React, { useState, useEffect, useRef, useCallback } from "react";
import { apiCall, API_BASE } from "@/lib/api";
import {
  ScanLine, UploadCloud, Loader2, CheckCircle2, AlertTriangle, Sparkles,
  FileText, TrendingUp, Gauge, X, ClipboardCopy, ArrowRight,
} from "lucide-react";

/* ─── Types ─── */
interface Line {
  invoice_desc: string; barcode: string; qty: number | null;
  invoice_cost: number | null; line_total: number | null;
  status: "matched" | "review" | "new"; matched?: string;
  matched_by?: "barcode" | "name"; confidence?: "high" | "low";
  old_cost?: number | null; cost_delta?: number | null; new_margin?: number | null;
  unit_cost_new?: number | null; pack_size?: number | null;
  case_cost_old?: number | null; case_cost_new?: number | null;
  flag: string;
  reason?: string;
  note?: string;
  product_code?: string;
  product_code_for_change?: string;
  current_price?: number | null;
  suggested_price?: number | null;
  eligible_for_price_change?: boolean;
  price_change_reason?: string;
}

interface ChangeGroups {
  new_products: { description: string; barcode: string; invoice_cost: number; qty: number }[];
  price_changes: { product_code: string; description: string; current_price: number; suggested_price: number; invoice_cost: number }[];
  cost_changes: { product_code: string; description: string; current_cost: number; invoice_cost: number }[];
}

interface ScanResult {
  supplier: string; invoice_date: string; pages: number;
  lines: Line[];
  summary: { matched: number; review?: number; new: number; cost_up: number; below_target: number };
  barcodes_missing?: boolean;
  change_groups?: ChangeGroups;
  usage: { today: number; daily_limit: number; month_cost: number; monthly_ceiling: number; est_cost_this_scan: number };
}
interface Usage { today: number; daily_limit: number; month_cost: number; monthly_ceiling: number; configured: boolean; }

interface ScanRecord {
  id: number; ts: number;
  supplier: string; invoice_date: string; pages: number;
  lines: Line[];
  summary: ScanResult["summary"];
  change_groups?: ChangeGroups;
}

/* ─── Helpers ─── */
function timeAgo(ts: number) {
  const m = Math.floor((Date.now() - ts) / 60000);
  if (m < 1) return "just now";
  if (m < 60) return m + "m ago";
  const h = Math.floor(m / 60);
  if (h < 24) return h + "h ago";
  return Math.floor(h / 24) + "d ago";
}
function eur(v: number | null | undefined) {
  return v === null || v === undefined ? "\u2014" : `\u20AC${Number(v).toFixed(2)}`;
}
function flagCls(flag: string) {
  if (flag.includes("below target")) return "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300";
  if (flag.startsWith("cost up")) return "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300";
  if (flag.includes("review") || flag.includes("units")) return "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300";
  if (flag === "not on system") return "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300";
  return "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300";
}
function statusBadge(s: string) {
  if (s === "matched") return { label: "Matched", cls: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300" };
  if (s === "review") return { label: "Review", cls: "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300" };
  return { label: "New", cls: "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300" };
}

/* ─── Invoice Actions Modal ─── */
interface ModalProps {
  groups: ChangeGroups;
  onClose: () => void;
  onResult: (msg: string, ok: boolean) => void;
  writebackEnabled: boolean;
}

function InvoiceActionsModal({ groups, onClose, onResult, writebackEnabled }: ModalProps) {
  const [priceInclude, setPriceInclude] = useState<Record<string, boolean>>(() => {
    const m: Record<string, boolean> = {};
    groups.price_changes.forEach((p) => { m[p.product_code] = true; });
    return m;
  });
  const [priceValues, setPriceValues] = useState<Record<string, string>>(() => {
    const m: Record<string, string> = {};
    groups.price_changes.forEach((p) => { m[p.product_code] = p.suggested_price.toFixed(2); });
    return m;
  });
  const [costInclude, setCostInclude] = useState<Record<string, boolean>>(() => {
    const m: Record<string, boolean> = {};
    groups.cost_changes.forEach((c) => { m[c.product_code] = true; });
    return m;
  });
  const [costValues, setCostValues] = useState<Record<string, string>>(() => {
    const m: Record<string, string> = {};
    groups.cost_changes.forEach((c) => { m[c.product_code] = c.invoice_cost.toFixed(2); });
    return m;
  });
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);

  const includedPriceChanges = groups.price_changes.filter((p) => priceInclude[p.product_code]);
  const includedCostChanges = groups.cost_changes.filter((c) => costInclude[c.product_code]);
  const totalIncluded = includedPriceChanges.length + includedCostChanges.length;

  const submitJobs = async (draft: boolean) => {
    setSubmitting(true);
    let ok = 0;
    let fail = 0;
    const token = localStorage.getItem("rg-token");
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (token) headers["Authorization"] = `Bearer ${token}`;

    for (const p of includedPriceChanges) {
      try {
        const res = await fetch(`${API_BASE}/api/price-jobs`, {
          method: "POST", headers,
          body: JSON.stringify({ product_code: p.product_code, new_price: parseFloat(priceValues[p.product_code]), draft, source: "invoice_scanner", field: "price" }),
        });
        if (res.ok) ok++; else fail++;
      } catch { fail++; }
    }
    for (const c of includedCostChanges) {
      try {
        const res = await fetch(`${API_BASE}/api/price-jobs`, {
          method: "POST", headers,
          body: JSON.stringify({ product_code: c.product_code, new_price: parseFloat(costValues[c.product_code]), draft, source: "invoice_scanner", field: "cost" }),
        });
        if (res.ok) ok++; else fail++;
      } catch { fail++; }
    }
    setSubmitting(false);
    setShowConfirm(false);

    if (draft) {
      if (fail > 0) onResult(`${ok} changes queued, ${fail} could not be queued`, false);
      else onResult(`${ok} changes queued`, true);
    } else {
      if (fail > 0) onResult(`${ok} changes pushed, ${fail} could not be pushed`, false);
      else onResult(`${ok} changes pushed to your shop`, true);
    }
    onClose();
  };

  const copyNewProducts = () => {
    const text = groups.new_products.map((p) => `${p.description}${p.barcode ? " (" + p.barcode + ")" : ""} - ${eur(p.invoice_cost)} x${p.qty}`).join("\n");
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 w-full max-w-3xl max-h-[85vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">Invoice actions</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800"><X className="w-5 h-5" /></button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
          {/* Section: Selling price changes */}
          {groups.price_changes.length > 0 && (
            <section>
              <h3 className="text-sm font-bold text-gray-800 dark:text-gray-100 mb-2">Selling price changes</h3>
              <div className="rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
                    <tr>
                      <th className="w-8 px-3 py-2"></th>
                      <th className="text-left px-3 py-2 text-[11px] font-semibold uppercase text-gray-500">Product</th>
                      <th className="text-right px-3 py-2 text-[11px] font-semibold uppercase text-gray-500">Current</th>
                      <th className="text-right px-3 py-2 text-[11px] font-semibold uppercase text-gray-500">New price</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-700/60">
                    {groups.price_changes.map((p) => (
                      <tr key={p.product_code} className="hover:bg-gray-50 dark:hover:bg-gray-800/40">
                        <td className="px-3 py-2">
                          <input type="checkbox" checked={priceInclude[p.product_code] ?? true}
                            onChange={() => setPriceInclude((s) => ({ ...s, [p.product_code]: !s[p.product_code] }))}
                            className="w-4 h-4 rounded border-gray-300 text-violet-600 focus:ring-violet-500" />
                        </td>
                        <td className="px-3 py-2 text-gray-800 dark:text-gray-200 truncate max-w-[200px]">{p.description}</td>
                        <td className="px-3 py-2 text-right text-gray-500 tabular-nums">{eur(p.current_price)}</td>
                        <td className="px-3 py-2 text-right">
                          <input type="number" step="0.01" min="0"
                            value={priceValues[p.product_code] ?? ""}
                            onChange={(e) => setPriceValues((s) => ({ ...s, [p.product_code]: e.target.value }))}
                            className="w-20 text-right text-sm font-medium rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 px-2 py-1 focus:ring-1 focus:ring-violet-500 focus:border-violet-500 tabular-nums" />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {/* Section: Cost price updates */}
          {groups.cost_changes.length > 0 && (
            <section>
              <h3 className="text-sm font-bold text-gray-800 dark:text-gray-100 mb-2">Cost price updates</h3>
              <div className="rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
                    <tr>
                      <th className="w-8 px-3 py-2"></th>
                      <th className="text-left px-3 py-2 text-[11px] font-semibold uppercase text-gray-500">Product</th>
                      <th className="text-right px-3 py-2 text-[11px] font-semibold uppercase text-gray-500">Current cost</th>
                      <th className="text-right px-3 py-2 text-[11px] font-semibold uppercase text-gray-500">New cost</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-700/60">
                    {groups.cost_changes.map((c) => (
                      <tr key={c.product_code} className="hover:bg-gray-50 dark:hover:bg-gray-800/40">
                        <td className="px-3 py-2">
                          <input type="checkbox" checked={costInclude[c.product_code] ?? true}
                            onChange={() => setCostInclude((s) => ({ ...s, [c.product_code]: !s[c.product_code] }))}
                            className="w-4 h-4 rounded border-gray-300 text-violet-600 focus:ring-violet-500" />
                        </td>
                        <td className="px-3 py-2 text-gray-800 dark:text-gray-200 truncate max-w-[200px]">{c.description}</td>
                        <td className="px-3 py-2 text-right text-gray-500 tabular-nums">{eur(c.current_cost)}</td>
                        <td className="px-3 py-2 text-right">
                          <input type="number" step="0.01" min="0"
                            value={costValues[c.product_code] ?? ""}
                            onChange={(e) => setCostValues((s) => ({ ...s, [c.product_code]: e.target.value }))}
                            className="w-20 text-right text-sm font-medium rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 px-2 py-1 focus:ring-1 focus:ring-violet-500 focus:border-violet-500 tabular-nums" />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {/* Section: Not in your shop yet */}
          {groups.new_products.length > 0 && (
            <section>
              <h3 className="text-sm font-bold text-gray-800 dark:text-gray-100 mb-2">Not in your shop yet</h3>
              <div className="rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
                    <tr>
                      <th className="text-left px-3 py-2 text-[11px] font-semibold uppercase text-gray-500">Product</th>
                      <th className="text-left px-3 py-2 text-[11px] font-semibold uppercase text-gray-500">Barcode</th>
                      <th className="text-right px-3 py-2 text-[11px] font-semibold uppercase text-gray-500">Invoice cost</th>
                      <th className="text-right px-3 py-2 text-[11px] font-semibold uppercase text-gray-500">Qty</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-700/60">
                    {groups.new_products.map((p, i) => (
                      <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-800/40">
                        <td className="px-3 py-2 text-gray-800 dark:text-gray-200">{p.description}</td>
                        <td className="px-3 py-2 font-mono text-[11px] text-gray-400">{p.barcode || "\u2014"}</td>
                        <td className="px-3 py-2 text-right tabular-nums">{eur(p.invoice_cost)}</td>
                        <td className="px-3 py-2 text-right tabular-nums text-gray-500">{p.qty}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex items-center justify-between mt-2">
                <p className="text-xs text-gray-400">Add these in Retail Solutions at the till</p>
                <button onClick={copyNewProducts} className="inline-flex items-center gap-1.5 text-xs text-violet-600 hover:text-violet-800 font-medium">
                  <ClipboardCopy className="w-3.5 h-3.5" /> {copied ? "Copied" : "Copy list"}
                </button>
              </div>
            </section>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 dark:border-gray-700">
          {writebackEnabled && totalIncluded > 0 ? (
            <>
              <button onClick={() => submitJobs(true)} disabled={submitting}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50">
                {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null} Queue changes
              </button>
              <button onClick={() => setShowConfirm(true)} disabled={submitting}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold bg-violet-600 text-white hover:bg-violet-700 disabled:opacity-50">
                Push changes now
              </button>
            </>
          ) : !writebackEnabled && totalIncluded > 0 ? (
            <p className="text-sm text-gray-400">Goes live once your shop link is set up</p>
          ) : (
            <p className="text-sm text-gray-400">No actionable changes on this invoice</p>
          )}
        </div>
      </div>

      {/* Confirm dialog */}
      {showConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4" onClick={() => setShowConfirm(false)}>
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-base font-bold text-gray-900 dark:text-white mb-2">Push these changes now?</h3>
            <p className="text-sm text-gray-500 mb-5">{totalIncluded} change{totalIncluded !== 1 ? "s" : ""} will be applied to your shop right away.</p>
            <div className="flex items-center justify-end gap-3">
              <button onClick={() => setShowConfirm(false)} className="px-3 py-2 rounded-xl text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800">Cancel</button>
              <button onClick={() => { setShowConfirm(false); submitJobs(true); }} disabled={submitting}
                className="px-3 py-2 rounded-xl text-sm font-medium border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50">
                Queue instead
              </button>
              <button onClick={() => submitJobs(false)} disabled={submitting}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold bg-violet-600 text-white hover:bg-violet-700 disabled:opacity-50">
                {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null} Push now
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Main Page ─── */
export function InvoiceScannerPage(_props?: { existingProducts?: any[]; onAddToSystem?: (f: any) => void; onNavigate?: (tab: string) => void }) {
  const [usage, setUsage] = useState<Usage | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [fileName, setFileName] = useState("");
  const [result, setResult] = useState<ScanResult | null>(null);
  const [scans, setScans] = useState<ScanRecord[]>([]);
  const [viewingPast, setViewingPast] = useState<number | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [writebackEnabled, setWritebackEnabled] = useState(true);
  const [resultBanner, setResultBanner] = useState<{ msg: string; ok: boolean } | null>(null);

  // Fetch writeback status from price-jobs summary
  useEffect(() => {
    apiCall("/api/price-jobs").then((d) => {
      setWritebackEnabled(d.writeback_enabled !== false);
    }).catch(() => {});
  }, []);

  const loadUsage = useCallback(() => { apiCall("/api/invoice/usage").then(setUsage).catch(() => {}); }, []);
  const loadHistory = useCallback(() => { apiCall("/api/invoice/history").then((d) => setScans(d.scans || [])).catch(() => {}); }, []);
  useEffect(() => { loadUsage(); loadHistory(); }, [loadUsage, loadHistory]);

  const onFile = useCallback(async (file: File | undefined) => {
    if (!file) return;
    setError(""); setResult(null); setViewingPast(null); setFileName(file.name); setResultBanner(null);
    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = reader.result as string;
      setBusy(true);
      try {
        const d = await apiCall("/api/invoice/scan", { method: "POST", body: JSON.stringify({ image: dataUrl }) });
        if (d.error) { setError(d.error); }
        else {
          setResult(d);
          if (d.usage) setUsage((u) => ({ ...(u as Usage), ...d.usage, configured: true }));
          loadHistory();
        }
      } catch {
        setError("Scan failed. Please try again.");
      }
      setBusy(false);
    };
    reader.readAsDataURL(file);
  }, [loadHistory]);

  const openPast = (rec: ScanRecord) => {
    setError(""); setFileName(""); setViewingPast(rec.id); setResultBanner(null);
    setResult({ supplier: rec.supplier, invoice_date: rec.invoice_date, pages: rec.pages, lines: rec.lines, summary: rec.summary, change_groups: rec.change_groups, usage: null as any });
  };
  const clearScans = async () => {
    try { await apiCall("/api/invoice/history", { method: "DELETE" }); } catch {}
    setScans([]);
    if (viewingPast) { setResult(null); setViewingPast(null); }
  };

  const groups = result?.change_groups;
  const hasActions = groups && (groups.price_changes.length > 0 || groups.cost_changes.length > 0 || groups.new_products.length > 0);

  const u = usage;
  const pctBudget = u ? Math.min(100, Math.round((u.month_cost / u.monthly_ceiling) * 100)) : 0;

  return (
    <div className="md:grid md:grid-cols-[16rem_1fr] md:items-start">
      {/* LEFT: previous scans */}
      <aside className="hidden md:flex md:flex-col md:sticky md:top-0 md:h-screen overflow-y-auto border-r border-gray-200 dark:border-gray-800 bg-gray-50/60 dark:bg-gray-900/30">
        <div className="flex items-center justify-between px-3 py-3 border-b border-gray-200 dark:border-gray-800">
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-600 dark:text-gray-300"><FileText className="w-3.5 h-3.5" /> Previous scans</span>
          <button onClick={() => { setResult(null); setViewingPast(null); setError(""); setResultBanner(null); fileRef.current?.click(); }} title="Scan a new invoice" className="inline-flex items-center gap-1 text-[11px] px-2 py-1 rounded-lg bg-violet-600 text-white hover:bg-violet-700"><UploadCloud className="w-3.5 h-3.5" /> New</button>
        </div>
        <div className="p-2 space-y-1">
          {scans.length === 0 && <p className="text-xs text-gray-400 px-2 py-3">Invoices you scan show up here. Click one to see its full result again.</p>}
          {scans.map((s) => (
            <button key={s.id} onClick={() => openPast(s)} className={`w-full text-left px-2.5 py-2 rounded-lg transition ${viewingPast === s.id ? "bg-violet-100 dark:bg-violet-900/30" : "hover:bg-violet-50 dark:hover:bg-violet-900/20"}`}>
              <span className="block text-xs text-gray-700 dark:text-gray-200 truncate font-medium">{s.supplier || "Invoice"}</span>
              <span className="block text-[10px] text-gray-400 mt-0.5">{s.lines.length} lines &middot; {s.summary.matched} matched{(s.summary.review ?? 0) > 0 ? ` \u00B7 ${s.summary.review} review` : ""} &middot; {timeAgo(s.ts)}</span>
            </button>
          ))}
        </div>
        {scans.length > 0 && (
          <div className="mt-auto p-2 border-t border-gray-200 dark:border-gray-800">
            <button onClick={clearScans} className="inline-flex items-center gap-1.5 text-[11px] text-gray-400 hover:text-red-500 px-2 py-1">Clear all</button>
          </div>
        )}
      </aside>

      {/* RIGHT: scanner */}
      <div className="p-4 md:p-6 w-full">
      <div className="flex items-center gap-2.5 mb-1">
        <ScanLine className="w-6 h-6 text-violet-600" />
        <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">Invoice Scanner</h1>
      </div>
      <p className="text-xs text-gray-500 mb-5">Upload a supplier invoice (photo or PDF). It reads every line, matches against your stock, and flags cost rises and new margin leaks.</p>

      {/* Usage meter */}
      {u && (
        <div className="flex flex-wrap items-center gap-4 mb-4 text-xs">
          <span className="inline-flex items-center gap-1.5 text-gray-500"><Gauge className="w-3.5 h-3.5" /> <b className="text-gray-700 dark:text-gray-200">{u.today}/{u.daily_limit}</b> scans today</span>
          <span className="inline-flex items-center gap-2 text-gray-500">
            ${u.month_cost.toFixed(3)} / ${u.monthly_ceiling.toFixed(0)} this month
            <span className="inline-block w-24 h-1.5 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden align-middle">
              <span className="block h-full bg-violet-500" style={{ width: `${pctBudget}%` }} />
            </span>
          </span>
          {!u.configured && <span className="text-red-600">not configured</span>}
        </div>
      )}

      {/* Persistent result banner */}
      {resultBanner && (
        <div className={`mb-4 flex items-center gap-2 px-4 py-3 rounded-xl border text-sm ${resultBanner.ok ? "bg-green-50 dark:bg-green-900/15 border-green-200 dark:border-green-800 text-green-800 dark:text-green-300" : "bg-amber-50 dark:bg-amber-900/15 border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300"}`}>
          {resultBanner.ok ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertTriangle className="w-4 h-4 shrink-0" />}
          <span>{resultBanner.msg}</span>
          {_props?.onNavigate && (
            <button onClick={() => _props.onNavigate?.("pricechanges")} className="ml-auto inline-flex items-center gap-1 text-xs font-medium text-violet-600 hover:text-violet-800">
              Price changes page <ArrowRight className="w-3 h-3" />
            </button>
          )}
        </div>
      )}

      {/* Upload zone */}
      <div onClick={() => fileRef.current?.click()}
        className="border-2 border-dashed border-violet-300 dark:border-violet-800 rounded-2xl p-8 text-center cursor-pointer hover:bg-violet-50/50 dark:hover:bg-violet-900/10 transition">
        {busy ? (
          <div className="flex flex-col items-center gap-2 text-violet-600">
            <Loader2 className="w-8 h-8 animate-spin" />
            <span className="text-sm font-semibold">Reading {fileName}...</span>
            <span className="text-xs text-gray-400">extracting line items and matching your stock</span>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <UploadCloud className="w-9 h-9 text-violet-500" />
            <span className="text-sm font-semibold text-gray-800 dark:text-gray-100">Tap to upload or photograph an invoice</span>
            <span className="text-xs text-gray-400">JPG / PNG / PDF, one invoice at a time</span>
          </div>
        )}
      </div>
      <input ref={fileRef} type="file" accept="image/*,application/pdf" capture="environment" className="hidden"
        onChange={(e) => onFile(e.target.files?.[0] ?? undefined)} />

      {/* Error */}
      {error && (
        <div className="mt-4 flex items-start gap-2 p-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 text-sm">
          <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" /> <span>{error}</span>
        </div>
      )}

      {/* Result */}
      {result && (
        <div className="mt-5">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2"><FileText className="w-4 h-4 text-violet-600" /> {result.supplier || "Invoice"}</h2>
              {result.invoice_date && <p className="text-xs text-gray-400">{result.invoice_date}, {result.lines.length} lines, {result.pages} page(s)</p>}
            </div>
          </div>
          {/* summary chips */}
          <div className="flex flex-wrap gap-2 mb-4">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300"><CheckCircle2 className="w-3.5 h-3.5" /> {result.summary.matched} matched</span>
            {(result.summary.review ?? 0) > 0 && <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300"><AlertTriangle className="w-3.5 h-3.5" /> {result.summary.review} need review</span>}
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300"><Sparkles className="w-3.5 h-3.5" /> {result.summary.new} new</span>
            {result.summary.cost_up > 0 && <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300"><TrendingUp className="w-3.5 h-3.5" /> {result.summary.cost_up} cost change</span>}
            {result.summary.below_target > 0 && <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300"><AlertTriangle className="w-3.5 h-3.5" /> {result.summary.below_target} below target</span>}
          </div>

          {/* Invoice actions summary card */}
          {hasActions && (
            <div className="mb-4 p-4 rounded-xl border border-violet-200 dark:border-violet-800 bg-violet-50/50 dark:bg-violet-900/10">
              <p className="text-sm text-gray-700 dark:text-gray-200 font-medium mb-2">Invoice actions</p>
              <p className="text-xs text-gray-500 mb-3">
                {[
                  groups!.new_products.length > 0 ? `${groups!.new_products.length} product${groups!.new_products.length !== 1 ? "s" : ""} not in your shop` : "",
                  groups!.price_changes.length > 0 ? `${groups!.price_changes.length} selling price suggestion${groups!.price_changes.length !== 1 ? "s" : ""}` : "",
                  groups!.cost_changes.length > 0 ? `${groups!.cost_changes.length} cost update${groups!.cost_changes.length !== 1 ? "s" : ""}` : "",
                ].filter(Boolean).join(" \u00B7 ")}
              </p>
              {writebackEnabled ? (
                <button onClick={() => setShowModal(true)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold bg-violet-600 text-white hover:bg-violet-700">
                  Review changes <ArrowRight className="w-3.5 h-3.5" />
                </button>
              ) : (
                <p className="text-xs text-gray-400">Goes live once your shop link is set up</p>
              )}
            </div>
          )}

          {/* no-barcodes note */}
          {result.barcodes_missing && (
            <div className="mb-3 flex items-start gap-2 p-3 rounded-xl bg-violet-50 dark:bg-violet-900/15 border border-violet-200 dark:border-violet-800 text-violet-800 dark:text-violet-300 text-xs">
              <ScanLine className="w-4 h-4 mt-0.5 shrink-0" />
              <span>This invoice has no barcodes printed on it, so items were matched by name only. Invoices that print barcodes match against your stock exactly.</span>
            </div>
          )}
          {/* table */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
                <tr>
                  <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-gray-500">Invoice item</th>
                  <th className="px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-gray-500">Barcode</th>
                  <th className="px-3 py-2.5 text-right text-[11px] font-semibold uppercase tracking-wide text-gray-500">Qty</th>
                  <th className="px-3 py-2.5 text-right text-[11px] font-semibold uppercase tracking-wide text-gray-500">Invoice cost</th>
                  <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-gray-500">Matched product</th>
                  <th className="px-3 py-2.5 text-right text-[11px] font-semibold uppercase tracking-wide text-gray-500">Your cost</th>
                  <th className="px-3 py-2.5 text-right text-[11px] font-semibold uppercase tracking-wide text-gray-500">New margin</th>
                  <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-gray-500">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700/60">
                {result.lines.slice().sort((a, b) => {
                  const rank = (s: string) => s === "matched" ? 0 : s === "review" ? 1 : 2;
                  return rank(a.status) - rank(b.status);
                }).map((l, i) => {
                  const sb = statusBadge(l.status);
                  return (
                    <React.Fragment key={i}>
                    <tr className="hover:bg-gray-50 dark:hover:bg-gray-800/60 align-top">
                      <td className="px-4 py-2.5 text-gray-800 dark:text-gray-100 max-w-[230px] truncate" title={l.invoice_desc}>{l.invoice_desc}</td>
                      <td className="px-3 py-2.5 font-mono text-[11px] text-gray-400 whitespace-nowrap">{l.barcode || "\u2014"}</td>
                      <td className="px-3 py-2.5 text-right text-gray-500 tabular-nums">{l.qty ?? "\u2014"}</td>
                      <td className="px-3 py-2.5 text-right whitespace-nowrap">
                        <div className="text-gray-800 dark:text-gray-200 tabular-nums">{eur(l.invoice_cost)}</div>
                        {l.pack_size && l.unit_cost_new != null
                          ? <div className="text-[10px] text-gray-400">case of {Math.round(l.pack_size)}, {eur(l.unit_cost_new)}/unit</div>
                          : null}
                      </td>
                      <td className="px-4 py-2.5 max-w-[210px]">
                        {l.status === "new"
                          ? <span className="text-violet-500 text-xs italic">Not in your shop yet</span>
                          : <span className="text-gray-600 dark:text-gray-300 block truncate" title={l.matched}>{l.matched}</span>}
                      </td>
                      <td className="px-3 py-2.5 text-right text-gray-400 tabular-nums whitespace-nowrap">{eur(l.old_cost)}</td>
                      <td className={`px-3 py-2.5 text-right tabular-nums whitespace-nowrap font-medium ${l.new_margin == null ? "text-gray-300 dark:text-gray-600" : l.new_margin < 20 ? "text-red-600" : "text-green-600"}`}>{l.new_margin == null ? "\u2014" : l.new_margin + "%"}</td>
                      <td className="px-4 py-2.5 whitespace-nowrap">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-semibold ${sb.cls}`}>{l.status === "review" ? l.flag : sb.label}</span>
                        {l.status !== "review" && <span className="block text-[10px] text-gray-400 mt-0.5">{l.flag}</span>}
                      </td>
                    </tr>
                    {l.status === "review" && l.reason && (
                      <tr>
                        <td colSpan={8} className="px-4 pb-2.5 pt-0">
                          <div className="flex items-start gap-2 text-[11.5px] text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-900/15 border border-amber-200 dark:border-amber-800 rounded-lg px-3 py-2">
                            <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                            <span>{l.reason}</span>
                          </div>
                        </td>
                      </tr>
                    )}
                    {l.note && (
                      <tr>
                        <td colSpan={8} className="px-4 pb-2.5 pt-0">
                          <div className="flex items-start gap-2 text-[11.5px] text-blue-800 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/15 border border-blue-200 dark:border-blue-800 rounded-lg px-3 py-2">
                            <FileText className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                            <span>{l.note}</span>
                          </div>
                        </td>
                      </tr>
                    )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
          {/* legend */}
          <div className="flex flex-wrap gap-x-5 gap-y-1 mt-3 text-[11px] text-gray-500">
            <span><span className="inline-block w-2 h-2 rounded-full bg-green-500 mr-1.5 align-middle"></span><b className="text-gray-600 dark:text-gray-300">Matched</b> barcode and name agree, cost and margin are reliable</span>
            <span><span className="inline-block w-2 h-2 rounded-full bg-orange-500 mr-1.5 align-middle"></span><b className="text-gray-600 dark:text-gray-300">Review</b> matched product looks different, or the invoice price is a case/pack price, so the margin is not shown</span>
            <span><span className="inline-block w-2 h-2 rounded-full bg-violet-500 mr-1.5 align-middle"></span><b className="text-gray-600 dark:text-gray-300">New</b> not in your system yet</span>
          </div>
          {result.usage ? (
            <p className="text-[11px] text-gray-400 mt-2">This scan cost about ${result.usage.est_cost_this_scan.toFixed(4)}. Matching ran free against your live stock. A margin is only shown when the match is reliable.</p>
          ) : (
            <p className="text-[11px] text-gray-400 mt-2">Saved scan from earlier. Matching reflects your stock as it was at scan time.</p>
          )}
        </div>
      )}
      </div>

      {/* Modal */}
      {showModal && groups && (
        <InvoiceActionsModal
          groups={groups}
          writebackEnabled={writebackEnabled}
          onClose={() => setShowModal(false)}
          onResult={(msg, ok) => {
            const suffix = ok
              ? (msg.includes("queued") ? " \u2014 review them on the Price changes page" : " \u2014 track them on the Price changes page")
              : "";
            setResultBanner({ msg: msg + suffix, ok });
          }}
        />
      )}
    </div>
  );
}
