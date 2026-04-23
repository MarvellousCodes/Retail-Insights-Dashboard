import { useState, useRef } from "react";
import {
  Upload, CheckCircle2, AlertCircle, Tag, PackageX,
  AlertTriangle, ArrowUpDown, Filter, Search, X,
  Pencil, RotateCcw,
} from "lucide-react";
import type { Product, MarginAlert, PriceAnomaly } from "@/App";
import { SourceSelector, type SourceControls } from "@/components/SourceSelector";

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
  productOverrides: Record<string, number>;
  onMarkFixed: (id: string) => void;
  onSetProductOverride: (id: string, margin: number | null) => void;
  onNewUpload: () => void;
  sourceControls: SourceControls;
}

// ─── Inline target editor ─────────────────────────────────────────────────────

function TargetCell({
  productId, current, isOverride, onSave, onClear,
}: {
  productId: string;
  current: number;
  isOverride: boolean;
  onSave: (id: string, val: number) => void;
  onClear: (id: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(String(current));
  const inputRef = useRef<HTMLInputElement>(null);

  const commit = () => {
    const n = parseFloat(val);
    if (!isNaN(n) && n >= 0 && n <= 100) { onSave(productId, n); }
    setEditing(false);
  };

  if (editing) {
    return (
      <div className="flex items-center gap-1 justify-center">
        <input
          ref={inputRef}
          type="number" min="0" max="100" step="0.5"
          value={val}
          onChange={(e) => setVal(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") commit(); if (e.key === "Escape") setEditing(false); }}
          onBlur={commit}
          autoFocus
          className="w-14 text-xs font-black text-center border border-violet-400 rounded-lg px-1.5 py-1 focus:outline-none focus:ring-2 focus:ring-violet-200"
        />
        <span className="text-[10px] text-gray-400">%</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1 justify-center group">
      <span className={`text-xs font-black ${isOverride ? "text-violet-700" : "text-gray-400"}`}>
        {current}%
      </span>
      {isOverride && (
        <span className="text-[9px] bg-violet-100 text-violet-600 font-black px-1 py-0.5 rounded">custom</span>
      )}
      <button
        onClick={() => { setVal(String(current)); setEditing(true); }}
        className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-300 hover:text-violet-600 ml-0.5"
        title="Edit target"
      >
        <Pencil className="w-3 h-3" />
      </button>
      {isOverride && (
        <button
          onClick={() => onClear(productId)}
          className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-300 hover:text-red-400"
          title="Reset to department default"
        >
          <RotateCcw className="w-3 h-3" />
        </button>
      )}
    </div>
  );
}

// ─── Product search table ─────────────────────────────────────────────────────

function ProductSearchTable({
  products, productOverrides, onSetProductOverride,
}: {
  products: Product[];
  productOverrides: Record<string, number>;
  onSetProductOverride: (id: string, margin: number | null) => void;
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-100">
            <th className="text-left px-5 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-wide">Product</th>
            <th className="text-left px-4 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-wide">SKU</th>
            <th className="text-left px-4 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-wide">Category</th>
            <th className="text-right px-4 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-wide">Cost</th>
            <th className="text-right px-4 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-wide">Selling</th>
            <th className="text-center px-4 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-wide">Current Margin</th>
            <th className="text-center px-4 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-wide">
              Margin Target
              <span className="text-[9px] text-violet-500 ml-1 normal-case">(hover to edit)</span>
            </th>
            <th className="text-left px-4 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-wide">Supplier</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {products.map((p) => {
            const isOverride = productOverrides[p.id] != null;
            const target = productOverrides[p.id] ?? 20;
            return (
              <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-5 py-3">
                  <p className="text-xs font-bold text-gray-900">{p.name}</p>
                  {p.isManualEntry && <span className="text-[9px] text-violet-500 font-bold">Manual</span>}
                </td>
                <td className="px-4 py-3 text-xs text-gray-400 font-mono">{p.sku || "—"}</td>
                <td className="px-4 py-3 text-xs text-gray-500">{p.category || p.department || "—"}</td>
                <td className="px-4 py-3 text-right text-xs text-gray-600">{fmt(p.costPrice)}</td>
                <td className="px-4 py-3 text-right text-xs text-gray-600">{fmt(p.sellingPrice)}</td>
                <td className="px-4 py-3 text-center"><MarginPill margin={p.margin} /></td>
                <td className="px-4 py-3">
                  <TargetCell
                    productId={p.id}
                    current={target}
                    isOverride={isOverride}
                    onSave={onSetProductOverride}
                    onClear={(id) => onSetProductOverride(id, null)}
                  />
                </td>
                <td className="px-4 py-3 text-xs text-gray-400">{p.supplier || "—"}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {products.length === 0 && (
        <div className="text-center py-10 text-gray-400">
          <Search className="w-6 h-6 mx-auto mb-2" />
          <p className="text-sm">No products match your search</p>
        </div>
      )}
    </div>
  );
}

// ─── Main Issues Page ─────────────────────────────────────────────────────────

export function IssuesPage({
  products, marginAlerts, priceAnomalies, fixedIds,
  productOverrides, onMarkFixed, onSetProductOverride, onNewUpload, sourceControls,
}: IssuesPageProps) {
  const [filter, setFilter] = useState<IssueFilter>("all");
  const [sort, setSort] = useState<SortKey>("severity");
  const [desc, setDesc] = useState(true);
  const [search, setSearch] = useState("");

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

  // ── Search mode: show ALL products filtered by query ──
  const isSearching = search.trim().length > 0;
  if (isSearching) {
    const q = search.toLowerCase();
    const matched = products.filter((p) =>
      p.name.toLowerCase().includes(q) ||
      (p.sku && p.sku.toLowerCase().includes(q)) ||
      (p.category && p.category.toLowerCase().includes(q)) ||
      (p.department && p.department.toLowerCase().includes(q)) ||
      (p.supplier && p.supplier.toLowerCase().includes(q))
    );
    return (
      <div className="min-h-full bg-gray-50 fade-up">
        <div className="px-7 py-6 max-w-[1200px] mx-auto">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h1 className="text-xl font-black text-gray-900">Product Search</h1>
              <p className="text-sm text-gray-400 mt-0.5">{matched.length} of {products.length} products — hover a target to edit it</p>
            </div>
            <div className="flex items-center gap-2">
              <SourceSelector {...sourceControls} />
              <button onClick={onNewUpload} className="flex items-center gap-2 bg-violet-600 text-white text-xs font-bold px-4 py-2.5 rounded-xl hover:bg-violet-700 transition-colors shadow-sm">
                <Upload className="w-3.5 h-3.5" /> New Upload
              </button>
            </div>
          </div>
          {/* Search bar */}
          <div className="relative mb-4">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, SKU, category, supplier..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-10 py-2.5 text-sm border border-violet-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-200 bg-white"
              autoFocus
            />
            <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="bg-violet-50 border border-violet-200 rounded-xl px-4 py-2.5 mb-4 flex items-center gap-2">
            <Pencil className="w-3.5 h-3.5 text-violet-500 shrink-0" />
            <p className="text-xs text-violet-700">Hover any <strong>Margin Target</strong> cell to set a custom target for that individual product — it overrides the department default without affecting anything else.</p>
          </div>
          <ProductSearchTable
            products={matched}
            productOverrides={productOverrides}
            onSetProductOverride={onSetProductOverride}
          />
        </div>
      </div>
    );
  }

  // ── Normal issues view ──
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
  const overrideCount = Object.keys(productOverrides).length;

  return (
    <div className="min-h-full bg-gray-50 fade-up">
      <div className="px-7 py-6 max-w-[1200px] mx-auto">

        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 className="text-xl font-black text-gray-900">Issues</h1>
            <p className="text-sm text-gray-400 mt-0.5">
              {products.length} products · {active.length} active issues · {fmt(recoverableProfit)} recoverable
              {overrideCount > 0 && <span className="ml-2 text-violet-600 font-semibold">· {overrideCount} custom target{overrideCount !== 1 ? "s" : ""}</span>}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <SourceSelector {...sourceControls} />
            <button onClick={onNewUpload} className="flex items-center gap-2 bg-violet-600 text-white text-xs font-bold px-4 py-2.5 rounded-xl hover:bg-violet-700 transition-colors shadow-sm">
              <Upload className="w-3.5 h-3.5" /> New Upload
            </button>
          </div>
        </div>

        {/* Search bar */}
        <div className="relative mb-5">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search all products by name, SKU, category, supplier..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-200 focus:border-violet-300 bg-white transition-colors"
          />
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
                <th className="text-center px-4 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-wide">
                  Margin Target
                  <span className="text-[9px] text-violet-500 ml-1 normal-case">(hover to edit)</span>
                </th>
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
                    <div>
                      <p className="text-xs font-bold text-gray-900">{row.product.name}</p>
                      <p className="text-[10px] text-gray-400 mt-0.5">
                        {row.product.category || row.product.department || "—"}
                        {row.product.sku ? ` · ${row.product.sku}` : ""}
                        {row.product.isManualEntry && " · Manual"}
                      </p>
                      {(row.issueType === "price" || row.issueType === "both") && row.reason && (
                        <p className="text-[10px] text-orange-500 font-semibold mt-0.5">{row.reason}</p>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3.5 text-right text-xs text-gray-600">{fmt(row.product.costPrice)}</td>
                  <td className="px-4 py-3.5 text-right text-xs text-gray-600">{fmt(row.product.sellingPrice)}</td>
                  <td className="px-4 py-3.5 text-center"><MarginPill margin={row.product.margin} threshold={row.threshold} /></td>
                  <td className="px-4 py-3.5">
                    {row.threshold != null ? (
                      <TargetCell
                        productId={row.product.id}
                        current={row.threshold}
                        isOverride={productOverrides[row.product.id] != null}
                        onSave={onSetProductOverride}
                        onClear={(id) => onSetProductOverride(id, null)}
                      />
                    ) : <span className="text-center block text-gray-300 text-xs">—</span>}
                  </td>
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
