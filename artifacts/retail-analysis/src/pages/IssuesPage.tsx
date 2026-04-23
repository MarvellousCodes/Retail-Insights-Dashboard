import { useState } from "react";
import {
  Upload, CheckCircle2, AlertCircle, Tag, PackageX,
  AlertTriangle, ArrowUpDown, Filter,
} from "lucide-react";
import type { Product, MarginAlert, PriceAnomaly } from "@/App";

type IssueFilter = "all" | "margin" | "price" | "manual" | "fixed";
type SortKey = "severity" | "margin" | "gap" | "name" | "impact";

const SEV_ORDER = { Critical: 0, High: 1, Medium: 2, Low: 3 };

function fmt(n: number) { return `€${n.toFixed(2)}`; }

function SevBadge({ sev }: { sev: string }) {
  const cls =
    sev === "Critical" ? "bg-red-50 text-red-600" :
    sev === "High" ? "bg-orange-50 text-orange-600" :
    sev === "Medium" ? "bg-amber-50 text-amber-600" :
    "bg-blue-50 text-blue-500";
  return <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${cls}`}>{sev}</span>;
}

function MarginPill({ margin, threshold }: { margin: number; threshold?: number }) {
  const below = threshold != null && margin < threshold;
  const cls = margin < 0 ? "bg-red-100 text-red-700" : below ? "bg-orange-100 text-orange-700" : "bg-green-100 text-green-700";
  return <span className={`text-xs font-black px-2.5 py-1 rounded-full ${cls}`}>{margin}%</span>;
}

interface IssuesPageProps {
  products: Product[];
  marginAlerts: MarginAlert[];
  priceAnomalies: PriceAnomaly[];
  fixedIds: Set<string>;
  onMarkFixed: (id: string) => void;
  onNewUpload: () => void;
}

export function IssuesPage({ products, marginAlerts, priceAnomalies, fixedIds, onMarkFixed, onNewUpload }: IssuesPageProps) {
  const [filter, setFilter] = useState<IssueFilter>("all");
  const [sort, setSort] = useState<SortKey>("severity");
  const [desc, setDesc] = useState(true);

  if (products.length === 0) {
    return (
      <div className="min-h-full bg-gray-50 flex items-center justify-center fade-up">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 rounded-full bg-violet-100 flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-8 h-8 text-violet-400" />
          </div>
          <h2 className="text-lg font-black text-gray-800">No data yet</h2>
          <p className="text-sm text-gray-400 mt-1 mb-5">Upload a CSV to detect margin issues and price anomalies.</p>
          <button onClick={onNewUpload} className="inline-flex items-center gap-2 bg-violet-600 text-white text-sm font-bold px-5 py-2.5 rounded-xl hover:bg-violet-700 transition-colors shadow-md shadow-violet-600/25">
            <Upload className="w-4 h-4" /> Upload CSV
          </button>
        </div>
      </div>
    );
  }

  const active = marginAlerts.filter((a) => !fixedIds.has(a.product.id));
  const fixed = marginAlerts.filter((a) => fixedIds.has(a.product.id));
  const manual = products.filter((p) => p.isManualEntry && !fixedIds.has(p.id));

  // Build a lookup of anomalies by product id
  const anomalyMap = new Map(priceAnomalies.map((a) => [a.product.id, a]));

  type Row = {
    key: string;
    product: Product;
    issueType: "margin" | "price" | "both" | "manual";
    severity: "Critical" | "High" | "Medium" | "Low";
    threshold?: number;
    gap?: number;
    recommendedPrice?: number;
    roundedPrice?: number;
    profitImpact?: number;
    reason?: string;
    isFixed: boolean;
  };

  const rows: Row[] = [];
  const addedIds = new Set<string>();

  // Margin alert rows — tag as "both" if they also have an anomaly
  active.forEach((a) => {
    const anomaly = anomalyMap.get(a.product.id);
    rows.push({
      key: a.product.id + "-margin",
      product: a.product,
      issueType: anomaly ? "both" : "margin",
      severity: anomaly && anomaly.severity === "Critical" ? "Critical" : a.severity,
      threshold: a.threshold,
      gap: a.gap,
      recommendedPrice: a.recommendedPrice,
      roundedPrice: a.roundedPrice,
      profitImpact: a.profitImpact,
      reason: anomaly?.reason,
      isFixed: false,
    });
    addedIds.add(a.product.id);
  });

  // Pure price-anomaly rows (not already in margin alerts)
  priceAnomalies.forEach((a) => {
    if (addedIds.has(a.product.id) || fixedIds.has(a.product.id)) return;
    rows.push({
      key: a.product.id + "-price",
      product: a.product,
      issueType: "price",
      severity: a.severity,
      reason: a.reason,
      isFixed: false,
    });
    addedIds.add(a.product.id);
  });

  manual.forEach((p) => {
    if (rows.some((r) => r.product.id === p.id)) return;
    rows.push({
      key: p.id + "-manual",
      product: p,
      issueType: "manual",
      severity: "Low",
      isFixed: false,
    });
  });

  fixed.forEach((a) => {
    rows.push({
      key: a.product.id + "-fixed",
      product: a.product,
      issueType: "margin",
      severity: a.severity,
      threshold: a.threshold,
      gap: a.gap,
      recommendedPrice: a.recommendedPrice,
      roundedPrice: a.roundedPrice,
      profitImpact: a.profitImpact,
      isFixed: true,
    });
  });

  const filtered =
    filter === "all" ? rows.filter((r) => !r.isFixed) :
    filter === "margin" ? rows.filter((r) => (r.issueType === "margin" || r.issueType === "both") && !r.isFixed) :
    filter === "price" ? rows.filter((r) => (r.issueType === "price" || r.issueType === "both") && !r.isFixed) :
    filter === "manual" ? rows.filter((r) => r.issueType === "manual" && !r.isFixed) :
    rows.filter((r) => r.isFixed);

  const sorted = [...filtered].sort((a, b) => {
    let cmp = 0;
    if (sort === "severity") cmp = SEV_ORDER[a.severity] - SEV_ORDER[b.severity];
    else if (sort === "margin") cmp = a.product.margin - b.product.margin;
    else if (sort === "gap") cmp = (b.gap ?? 0) - (a.gap ?? 0);
    else if (sort === "name") cmp = a.product.name.localeCompare(b.product.name);
    else if (sort === "impact") cmp = (b.profitImpact ?? 0) - (a.profitImpact ?? 0);
    return desc ? cmp : -cmp;
  });

  const toggleSort = (key: SortKey) => {
    if (sort === key) setDesc((d) => !d);
    else { setSort(key); setDesc(true); }
  };

  const allActiveCount = rows.filter((r) => !r.isFixed).length;
  const recoverableProfit = active.reduce((s, a) => s + Math.max(0, a.profitImpact), 0);

  return (
    <div className="min-h-full bg-gray-50 fade-up">
      <div className="px-7 py-6 max-w-[1200px] mx-auto">

        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 className="text-xl font-black text-gray-900">Issues</h1>
            <p className="text-sm text-gray-400 mt-0.5">
              {products.length} products · {active.length} active issues · {fmt(recoverableProfit)} recoverable
            </p>
          </div>
          <button onClick={onNewUpload} className="flex items-center gap-2 bg-violet-600 text-white text-xs font-bold px-4 py-2.5 rounded-xl hover:bg-violet-700 transition-colors shadow-sm">
            <Upload className="w-3.5 h-3.5" /> New Upload
          </button>
        </div>

        {/* KPI strip */}
        <div className="grid grid-cols-4 gap-3 mb-5">
          {[
            { label: "Below Margin", value: rows.filter(r => (r.issueType === "margin" || r.issueType === "both") && !r.isFixed).length, icon: <Tag className="w-4 h-4 text-red-500" />, bg: "bg-red-50", color: "text-red-700" },
            { label: "Price Anomalies", value: rows.filter(r => (r.issueType === "price" || r.issueType === "both") && !r.isFixed).length, icon: <AlertCircle className="w-4 h-4 text-orange-500" />, bg: "bg-orange-50", color: "text-orange-700" },
            { label: "Manual Entries", value: manual.length, icon: <PackageX className="w-4 h-4 text-violet-500" />, bg: "bg-violet-50", color: "text-violet-700" },
            { label: "Marked Fixed", value: fixedIds.size, icon: <CheckCircle2 className="w-4 h-4 text-green-500" />, bg: "bg-green-50", color: "text-green-700" },
          ].map(({ label, value, icon, bg, color }) => (
            <div key={label} className="bg-white rounded-2xl border border-gray-100 px-4 py-3.5 flex items-center gap-3 shadow-sm">
              <div className={`w-8 h-8 rounded-xl ${bg} flex items-center justify-center shrink-0`}>{icon}</div>
              <div>
                <p className={`text-xl font-black ${color}`}>{value}</p>
                <p className="text-[10px] text-gray-400 font-medium">{label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-4 h-4 text-gray-300" />
          {(["all", "margin", "price", "manual", "fixed"] as const).map((f) => {
            const counts: Record<IssueFilter, number> = {
              all: allActiveCount,
              margin: rows.filter(r => (r.issueType === "margin" || r.issueType === "both") && !r.isFixed).length,
              price: rows.filter(r => (r.issueType === "price" || r.issueType === "both") && !r.isFixed).length,
              manual: rows.filter(r => r.issueType === "manual" && !r.isFixed).length,
              fixed: rows.filter(r => r.isFixed).length,
            };
            const labels: Record<IssueFilter, string> = {
              all: "All Issues", margin: "Below Margin", price: "Price Anomalies", manual: "Manual Entry", fixed: "Fixed",
            };
            return (
              <button key={f} onClick={() => setFilter(f)}
                className={["px-3 py-1.5 rounded-lg text-xs font-bold transition-all",
                  filter === f ? "bg-violet-600 text-white shadow-sm" : "bg-white text-gray-500 border border-gray-200 hover:border-violet-300 hover:text-violet-600"].join(" ")}>
                {labels[f]} {counts[f] > 0 && <span className={filter === f ? "opacity-70" : "text-gray-400"}>({counts[f]})</span>}
              </button>
            );
          })}
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left px-5 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-wide">
                  <button className="flex items-center gap-1 hover:text-gray-600" onClick={() => toggleSort("name")}>Product <ArrowUpDown className="w-3 h-3" /></button>
                </th>
                <th className="text-right px-4 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-wide">Cost</th>
                <th className="text-right px-4 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-wide">Selling</th>
                <th className="text-center px-4 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-wide">
                  <button className="flex items-center gap-1 hover:text-gray-600 mx-auto" onClick={() => toggleSort("margin")}>Current Margin <ArrowUpDown className="w-3 h-3" /></button>
                </th>
                <th className="text-center px-4 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-wide">Margin Target</th>
                <th className="text-right px-4 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-wide">Recommended</th>
                <th className="text-right px-4 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-wide">
                  <button className="flex items-center gap-1 hover:text-gray-600" onClick={() => toggleSort("impact")}>Impact <ArrowUpDown className="w-3 h-3" /></button>
                </th>
                <th className="text-center px-4 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-wide">
                  <button className="flex items-center gap-1 hover:text-gray-600 mx-auto" onClick={() => toggleSort("severity")}>Severity <ArrowUpDown className="w-3 h-3" /></button>
                </th>
                <th className="text-center px-4 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-wide">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {sorted.map((row) => (
                <tr key={row.key} className={`transition-colors ${row.isFixed ? "opacity-50 bg-gray-50/60" : "hover:bg-gray-50"}`}>
                  <td className="px-5 py-3.5">
                    <div className="flex items-start gap-1.5">
                      <div>
                        <p className="text-xs font-bold text-gray-900">{row.product.name}</p>
                        <p className="text-[10px] text-gray-400 mt-0.5">
                          {row.product.category || row.product.department || "—"}
                          {row.product.isManualEntry && " · Manual"}
                        </p>
                        {(row.issueType === "price" || row.issueType === "both") && row.reason && (
                          <p className="text-[10px] text-orange-500 font-semibold mt-0.5">{row.reason}</p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3.5 text-right text-xs text-gray-600">{fmt(row.product.costPrice)}</td>
                  <td className="px-4 py-3.5 text-right text-xs text-gray-600">{fmt(row.product.sellingPrice)}</td>
                  <td className="px-4 py-3.5 text-center"><MarginPill margin={row.product.margin} threshold={row.threshold} /></td>
                  <td className="px-4 py-3.5 text-center text-xs text-gray-400">{row.threshold != null ? `${row.threshold}%` : "—"}</td>
                  <td className="px-4 py-3.5 text-right">
                    {row.roundedPrice != null ? (
                      <div>
                        <p className="text-xs font-black text-violet-700">{fmt(row.roundedPrice)}</p>
                        {row.recommendedPrice !== row.roundedPrice && (
                          <p className="text-[10px] text-gray-400">calc: {fmt(row.recommendedPrice!)}</p>
                        )}
                      </div>
                    ) : <span className="text-gray-300">—</span>}
                  </td>
                  <td className="px-4 py-3.5 text-right">
                    {row.profitImpact != null && row.profitImpact > 0 ? (
                      <span className="text-xs font-black text-green-600">+{fmt(row.profitImpact)}</span>
                    ) : <span className="text-gray-300 text-xs">—</span>}
                  </td>
                  <td className="px-4 py-3.5 text-center"><SevBadge sev={row.severity} /></td>
                  <td className="px-4 py-3.5 text-center">
                    {row.isFixed ? (
                      <span className="inline-flex items-center gap-1 text-[10px] text-green-600 font-bold">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Fixed
                      </span>
                    ) : (
                      <button
                        onClick={() => onMarkFixed(row.product.id)}
                        className="text-[11px] font-bold text-violet-600 border border-violet-200 bg-violet-50 px-3 py-1 rounded-lg hover:bg-violet-600 hover:text-white hover:border-violet-600 transition-all"
                      >
                        Mark Fixed
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {sorted.length === 0 && (
            <div className="text-center py-12">
              <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-green-400" />
              <p className="text-sm font-bold text-green-700">
                {filter === "fixed" ? "No fixed items yet" : "No issues in this category"}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
