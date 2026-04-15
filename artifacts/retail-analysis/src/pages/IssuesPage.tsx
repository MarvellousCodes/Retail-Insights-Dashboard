import { useState } from "react";
import {
  AlertTriangle, Tag, AlertCircle, PackageX,
  CheckCircle2, Upload, Filter, ArrowUpDown, ChevronRight,
} from "lucide-react";
import type { Product, MarginAlert, PriceAnomaly } from "@/App";

type IssueFilter = "all" | "margin" | "price" | "manual";
type SortKey = "severity" | "margin" | "gap" | "name";

const SEV_ORDER = { Critical: 0, High: 1, Medium: 2, Low: 3 };

function formatEuro(n: number) {
  return `€${n.toFixed(2)}`;
}

function MarginBadge({ margin }: { margin: number }) {
  const color = margin < 0 ? "text-red-700 bg-red-50" : margin < 10 ? "text-red-600 bg-red-50" : margin < 20 ? "text-amber-600 bg-amber-50" : "text-green-700 bg-green-50";
  return <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${color}`}>{margin}%</span>;
}

function SeverityDot({ sev }: { sev: string }) {
  const color = sev === "Critical" ? "bg-red-500" : sev === "High" ? "bg-orange-400" : sev === "Medium" ? "bg-amber-400" : "bg-blue-400";
  const text = sev === "Critical" ? "text-red-600" : sev === "High" ? "text-orange-600" : sev === "Medium" ? "text-amber-600" : "text-blue-500";
  return (
    <span className={`flex items-center gap-1 text-[10px] font-bold ${text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${color} inline-block`} /> {sev}
    </span>
  );
}

interface IssuesPageProps {
  products: Product[];
  marginAlerts: MarginAlert[];
  priceAnomalies: PriceAnomaly[];
  onNewUpload: () => void;
}

export function IssuesPage({ products, marginAlerts, priceAnomalies, onNewUpload }: IssuesPageProps) {
  const [filter, setFilter] = useState<IssueFilter>("all");
  const [sort, setSort] = useState<SortKey>("severity");
  const [desc, setDesc] = useState(true);

  if (products.length === 0) {
    return (
      <div className="min-h-full bg-[#f4faf6] flex items-center justify-center fade-up">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-8 h-8 text-gray-300" />
          </div>
          <h2 className="text-lg font-bold text-gray-800">No data yet</h2>
          <p className="text-sm text-gray-400 mt-1 mb-5">Upload a CSV file to detect margin issues and price anomalies.</p>
          <button
            onClick={onNewUpload}
            className="inline-flex items-center gap-2 bg-[#16a34a] text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-[#15803d] transition-colors shadow-md"
          >
            <Upload className="w-4 h-4" />
            Upload CSV
          </button>
        </div>
      </div>
    );
  }

  const manualIssues = products.filter((p) => p.isManualEntry);
  const priceAnomalyIds = new Set(priceAnomalies.map((a) => a.product.id));

  type Row = {
    product: Product;
    issueType: "margin" | "price" | "manual";
    severity: "Critical" | "High" | "Medium" | "Low";
    threshold?: number;
    gap?: number;
    reason?: string;
    recommendation: string;
  };

  const rows: Row[] = [];

  marginAlerts.forEach((alert) => {
    const action =
      alert.product.margin < 0
        ? "Selling below cost — reprice immediately or remove from sale"
        : `Increase price or reduce cost to reach ${alert.threshold}% margin`;
    rows.push({
      product: alert.product,
      issueType: "margin",
      severity: alert.severity,
      threshold: alert.threshold,
      gap: alert.gap,
      recommendation: action,
    });
  });

  priceAnomalies.forEach((anomaly) => {
    if (rows.some((r) => r.product.id === anomaly.product.id && r.issueType === "margin")) return;
    rows.push({
      product: anomaly.product,
      issueType: "price",
      severity: anomaly.severity,
      reason: anomaly.reason,
      recommendation: "Review cost and selling price entries for accuracy",
    });
  });

  manualIssues.forEach((p) => {
    if (rows.some((r) => r.product.id === p.id)) return;
    rows.push({
      product: p,
      issueType: "manual",
      severity: "Low",
      recommendation: "Verify this non-approved supplier product meets margin targets",
    });
  });

  const filtered =
    filter === "all" ? rows :
    filter === "margin" ? rows.filter((r) => r.issueType === "margin") :
    filter === "price" ? rows.filter((r) => r.issueType === "price") :
    rows.filter((r) => r.issueType === "manual");

  const sorted = [...filtered].sort((a, b) => {
    let cmp = 0;
    if (sort === "severity") cmp = SEV_ORDER[a.severity] - SEV_ORDER[b.severity];
    else if (sort === "margin") cmp = a.product.margin - b.product.margin;
    else if (sort === "gap") cmp = (b.gap ?? 0) - (a.gap ?? 0);
    else if (sort === "name") cmp = a.product.name.localeCompare(b.product.name);
    return desc ? cmp : -cmp;
  });

  const toggleSort = (key: SortKey) => {
    if (sort === key) setDesc((d) => !d);
    else { setSort(key); setDesc(true); }
  };

  return (
    <div className="min-h-full bg-[#f4faf6] fade-up">
      <div className="px-7 py-6 max-w-[1200px] mx-auto">

        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Issues</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {products.length} products analysed — {rows.length} issues found
            </p>
          </div>
          <button
            onClick={onNewUpload}
            className="flex items-center gap-2 bg-[#0d1117] text-white text-xs font-semibold px-4 py-2.5 rounded-xl hover:bg-gray-800 transition-colors"
          >
            <Upload className="w-3.5 h-3.5" />
            New Upload
          </button>
        </div>

        {/* Summary strip */}
        <div className="grid grid-cols-4 gap-3 mb-5">
          {[
            { label: "Below Margin", value: marginAlerts.length, color: "text-red-600", bg: "bg-red-50", icon: <Tag className="w-4 h-4 text-red-500" /> },
            { label: "Price Anomalies", value: priceAnomalies.length, color: "text-orange-600", bg: "bg-orange-50", icon: <AlertCircle className="w-4 h-4 text-orange-500" /> },
            { label: "Manual Entries", value: manualIssues.length, color: "text-blue-700", bg: "bg-blue-50", icon: <PackageX className="w-4 h-4 text-blue-500" /> },
            { label: "Total Issues", value: rows.length, color: "text-gray-800", bg: "bg-gray-100", icon: <AlertTriangle className="w-4 h-4 text-gray-500" /> },
          ].map(({ label, value, color, bg, icon }) => (
            <div key={label} className="bg-white rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.05)] px-4 py-3.5 flex items-center gap-3">
              <div className={`w-8 h-8 rounded-lg ${bg} flex items-center justify-center shrink-0`}>{icon}</div>
              <div>
                <p className={`text-xl font-black ${color}`}>{value}</p>
                <p className="text-[10px] text-gray-400 font-medium">{label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-4 h-4 text-gray-400" />
          {(["all", "margin", "price", "manual"] as const).map((f) => {
            const labels = { all: `All (${rows.length})`, margin: `Below Margin (${marginAlerts.length})`, price: `Price Anomalies (${priceAnomalies.length})`, manual: `Manual Entry (${manualIssues.length})` };
            return (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={[
                  "px-3 py-1.5 rounded-lg text-xs font-semibold transition-all",
                  filter === f ? "bg-[#0d1117] text-white" : "bg-white text-gray-600 border border-gray-200 hover:border-gray-300",
                ].join(" ")}
              >
                {labels[f]}
              </button>
            );
          })}
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl shadow-[0_2px_10px_rgba(0,0,0,0.06)] overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left px-5 py-3 text-[10px] font-semibold text-gray-500 uppercase tracking-wide">
                  <button className="flex items-center gap-1 hover:text-gray-700" onClick={() => toggleSort("name")}>Product <ArrowUpDown className="w-3 h-3" /></button>
                </th>
                <th className="text-left px-4 py-3 text-[10px] font-semibold text-gray-500 uppercase tracking-wide">Dept / Category</th>
                <th className="text-right px-4 py-3 text-[10px] font-semibold text-gray-500 uppercase tracking-wide">Cost</th>
                <th className="text-right px-4 py-3 text-[10px] font-semibold text-gray-500 uppercase tracking-wide">Sell</th>
                <th className="text-center px-4 py-3 text-[10px] font-semibold text-gray-500 uppercase tracking-wide">
                  <button className="flex items-center gap-1 hover:text-gray-700 mx-auto" onClick={() => toggleSort("margin")}>Margin <ArrowUpDown className="w-3 h-3" /></button>
                </th>
                <th className="text-center px-4 py-3 text-[10px] font-semibold text-gray-500 uppercase tracking-wide">Threshold</th>
                <th className="text-center px-4 py-3 text-[10px] font-semibold text-gray-500 uppercase tracking-wide">
                  <button className="flex items-center gap-1 hover:text-gray-700 mx-auto" onClick={() => toggleSort("severity")}>Severity <ArrowUpDown className="w-3 h-3" /></button>
                </th>
                <th className="text-left px-4 py-3 text-[10px] font-semibold text-gray-500 uppercase tracking-wide">Recommended Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {sorted.map((row, i) => (
                <tr key={i} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-3.5">
                    <div>
                      <p className="font-semibold text-gray-900 text-xs">{row.product.name}</p>
                      {row.product.sku && <p className="text-[10px] text-gray-400">{row.product.sku}</p>}
                      {row.product.isManualEntry && (
                        <span className="text-[9px] font-bold bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded-full">Manual</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3.5 text-xs text-gray-500">
                    {row.product.department || row.product.category || "—"}
                  </td>
                  <td className="px-4 py-3.5 text-right text-xs text-gray-600">{formatEuro(row.product.costPrice)}</td>
                  <td className="px-4 py-3.5 text-right text-xs text-gray-600">{formatEuro(row.product.sellingPrice)}</td>
                  <td className="px-4 py-3.5 text-center"><MarginBadge margin={row.product.margin} /></td>
                  <td className="px-4 py-3.5 text-center text-xs text-gray-400">
                    {row.threshold != null ? `${row.threshold}%` : "—"}
                  </td>
                  <td className="px-4 py-3.5 text-center"><SeverityDot sev={row.severity} /></td>
                  <td className="px-4 py-3.5">
                    <span className="text-xs text-[#16a34a] font-semibold flex items-center gap-1">
                      <ChevronRight className="w-3 h-3 shrink-0" />
                      {row.recommendation}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {sorted.length === 0 && (
            <div className="text-center py-12 text-gray-400">
              <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-green-400" />
              <p className="text-sm font-semibold">No issues in this category</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
