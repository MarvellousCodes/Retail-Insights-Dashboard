import { useState, useEffect, useRef, useCallback } from "react";
import { apiCall } from "@/lib/api";
import {
  ScanLine, UploadCloud, Loader2, CheckCircle2, AlertTriangle, Sparkles,
  FileText, TrendingUp, Gauge,
} from "lucide-react";

interface Line {
  invoice_desc: string; barcode: string; qty: number | null;
  invoice_cost: number | null; line_total: number | null;
  status: "matched" | "review" | "new"; matched?: string;
  matched_by?: "barcode" | "name"; confidence?: "high" | "low";
  old_cost?: number | null; cost_delta?: number | null; new_margin?: number | null;
  unit_cost_new?: number | null; pack_size?: number | null;
  case_cost_old?: number | null; case_cost_new?: number | null;
  flag: string;
}
interface ScanResult {
  supplier: string; invoice_date: string; pages: number;
  lines: Line[];
  summary: { matched: number; review?: number; new: number; cost_up: number; below_target: number };
  usage: { today: number; daily_limit: number; month_cost: number; monthly_ceiling: number; est_cost_this_scan: number };
}
interface Usage { today: number; daily_limit: number; month_cost: number; monthly_ceiling: number; configured: boolean; }

function eur(v: number | null | undefined) {
  return v === null || v === undefined ? "—" : `€${Number(v).toFixed(2)}`;
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

export function InvoiceScannerPage(_props?: { existingProducts?: any[]; onAddToSystem?: (f: any) => void }) {
  const [usage, setUsage] = useState<Usage | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [fileName, setFileName] = useState("");
  const [result, setResult] = useState<ScanResult | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);

  const loadUsage = useCallback(() => { apiCall("/api/invoice/usage").then(setUsage).catch(() => {}); }, []);
  useEffect(() => { loadUsage(); }, [loadUsage]);

  const onFile = useCallback(async (file: File | undefined) => {
    if (!file) return;
    setError(""); setResult(null); setFileName(file.name);
    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = reader.result as string;
      setBusy(true);
      try {
        const d = await apiCall("/api/invoice/scan", { method: "POST", body: JSON.stringify({ image: dataUrl }) });
        if (d.error) { setError(d.error); }
        else { setResult(d); if (d.usage) setUsage((u) => ({ ...(u as Usage), ...d.usage, configured: true })); }
      } catch {
        setError("Scan failed - please try again.");
      }
      setBusy(false);
    };
    reader.readAsDataURL(file);
  }, []);

  const u = usage;
  const pctBudget = u ? Math.min(100, Math.round((u.month_cost / u.monthly_ceiling) * 100)) : 0;

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-2.5 mb-1">
        <ScanLine className="w-6 h-6 text-violet-600" />
        <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">Invoice Scanner</h1>
      </div>
      <p className="text-xs text-gray-500 mb-5">Upload a supplier invoice (photo or PDF). It reads every line, matches against your stock, and flags cost rises &amp; new margin leaks.</p>

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
          {!u.configured && <span className="text-red-600">⚠ not configured</span>}
        </div>
      )}

      {/* Upload zone */}
      <div onClick={() => fileRef.current?.click()}
        className="border-2 border-dashed border-violet-300 dark:border-violet-800 rounded-2xl p-8 text-center cursor-pointer hover:bg-violet-50/50 dark:hover:bg-violet-900/10 transition">
        {busy ? (
          <div className="flex flex-col items-center gap-2 text-violet-600">
            <Loader2 className="w-8 h-8 animate-spin" />
            <span className="text-sm font-semibold">Reading {fileName}…</span>
            <span className="text-xs text-gray-400">extracting line items &amp; matching your stock</span>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <UploadCloud className="w-9 h-9 text-violet-500" />
            <span className="text-sm font-semibold text-gray-800 dark:text-gray-100">Tap to upload or photograph an invoice</span>
            <span className="text-xs text-gray-400">JPG / PNG / PDF · one invoice at a time</span>
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
              {result.invoice_date && <p className="text-xs text-gray-400">{result.invoice_date} · {result.lines.length} lines · {result.pages} page(s)</p>}
            </div>
          </div>
          {/* summary chips */}
          <div className="flex flex-wrap gap-2 mb-4">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300"><CheckCircle2 className="w-3.5 h-3.5" /> {result.summary.matched} matched</span>
            {(result.summary.review ?? 0) > 0 && <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300"><AlertTriangle className="w-3.5 h-3.5" /> {result.summary.review} need review</span>}
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300"><Sparkles className="w-3.5 h-3.5" /> {result.summary.new} new</span>
            {result.summary.cost_up > 0 && <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300"><TrendingUp className="w-3.5 h-3.5" /> {result.summary.cost_up} price change</span>}
            {result.summary.below_target > 0 && <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300"><AlertTriangle className="w-3.5 h-3.5" /> {result.summary.below_target} below target</span>}
          </div>
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
                {result.lines.map((l, i) => {
                  const sb = statusBadge(l.status);
                  return (
                    <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-800/60 align-top">
                      <td className="px-4 py-2.5 text-gray-800 dark:text-gray-100 max-w-[230px] truncate" title={l.invoice_desc}>{l.invoice_desc}</td>
                      <td className="px-3 py-2.5 font-mono text-[11px] text-gray-400 whitespace-nowrap">{l.barcode || "—"}</td>
                      <td className="px-3 py-2.5 text-right text-gray-500 tabular-nums">{l.qty ?? "—"}</td>
                      <td className="px-3 py-2.5 text-right whitespace-nowrap">
                        <div className="text-gray-800 dark:text-gray-200 tabular-nums">{eur(l.invoice_cost)}</div>
                        {l.pack_size && l.unit_cost_new != null
                          ? <div className="text-[10px] text-gray-400">case of {Math.round(l.pack_size)} · {eur(l.unit_cost_new)}/unit</div>
                          : null}
                      </td>
                      <td className="px-4 py-2.5 max-w-[210px]">
                        {l.status === "new"
                          ? <span className="text-violet-500 text-xs italic">not on your system</span>
                          : <span className="text-gray-600 dark:text-gray-300 block truncate" title={l.matched}>{l.matched}</span>}
                      </td>
                      <td className="px-3 py-2.5 text-right text-gray-400 tabular-nums whitespace-nowrap">{eur(l.old_cost)}</td>
                      <td className={`px-3 py-2.5 text-right tabular-nums whitespace-nowrap font-medium ${l.new_margin == null ? "text-gray-300 dark:text-gray-600" : l.new_margin < 20 ? "text-red-600" : "text-green-600"}`}>{l.new_margin == null ? "—" : l.new_margin + "%"}</td>
                      <td className="px-4 py-2.5 whitespace-nowrap">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-semibold ${sb.cls}`}>{sb.label}</span>
                        <span className="block text-[10px] text-gray-400 mt-0.5">{l.flag}</span>
                      </td>
                    </tr>
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
          <p className="text-[11px] text-gray-400 mt-2">This scan cost about ${result.usage.est_cost_this_scan.toFixed(4)}. Matching ran free against your live stock. A margin is only shown when the match is reliable.</p>
        </div>
      )}
    </div>
  );
}
