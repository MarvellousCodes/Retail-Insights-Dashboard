import { useState } from "react";
import { Upload, Download, FileText } from "lucide-react";
import type { Product, MarginAlert, PriceAnomaly, DeptThreshold } from "@/App";

const TOP_N_OPTIONS = [10, 25, 50, 100, -1];

interface ReportsPageProps {
  products: Product[];
  marginAlerts: MarginAlert[];
  priceAnomalies: PriceAnomaly[];
  onNewUpload: () => void;
}

function formatEuro(n: number) {
  return `€${n.toFixed(2)}`;
}

function MarginCell({ margin, threshold }: { margin: number; threshold?: number }) {
  const below = threshold != null && margin < threshold;
  return (
    <span className={`font-bold text-xs ${margin < 0 ? "text-red-700" : below ? "text-amber-600" : "text-green-700"}`}>
      {margin}%
    </span>
  );
}

export function ReportsPage({ products, marginAlerts, priceAnomalies, onNewUpload }: ReportsPageProps) {
  const [topN, setTopN] = useState(25);

  if (products.length === 0) {
    return (
      <div className="min-h-full bg-[#f4faf6] flex items-center justify-center fade-up">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
            <FileText className="w-8 h-8 text-gray-300" />
          </div>
          <h2 className="text-lg font-bold text-gray-800">No data yet</h2>
          <p className="text-sm text-gray-400 mt-1 mb-5">Upload a CSV file to generate your attention report.</p>
          <button onClick={onNewUpload} className="inline-flex items-center gap-2 bg-[#16a34a] text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-[#15803d] transition-colors shadow-md">
            <Upload className="w-4 h-4" /> Upload CSV
          </button>
        </div>
      </div>
    );
  }

  const SEV_ORDER: Record<string, number> = { Critical: 0, High: 1, Medium: 2, Low: 3 };

  type AttentionItem = {
    product: Product;
    severity: "Critical" | "High" | "Medium" | "Low";
    threshold?: number;
    gap?: number;
    reason: string;
    action: string;
  };

  const items: AttentionItem[] = [];

  marginAlerts.forEach((a) => {
    items.push({
      product: a.product,
      severity: a.severity,
      threshold: a.threshold,
      gap: a.gap,
      reason: a.product.margin < 0 ? "Selling below cost" : `${a.gap.toFixed(1)}% below ${a.threshold}% threshold`,
      action: a.product.margin < 0 ? "Reprice immediately" : "Increase price or reduce cost",
    });
  });

  priceAnomalies.forEach((a) => {
    if (items.some((i) => i.product.id === a.product.id)) return;
    items.push({
      product: a.product,
      severity: a.severity,
      reason: a.reason,
      action: "Fix data entry error",
    });
  });

  items.sort((a, b) => SEV_ORDER[a.severity] - SEV_ORDER[b.severity] || (b.gap ?? 0) - (a.gap ?? 0));

  const displayed = topN === -1 ? items : items.slice(0, topN);

  // Department breakdown
  const deptMap: Record<string, { total: number; count: number; alerts: number }> = {};
  products.forEach((p) => {
    const dept = p.department || p.category || "Uncategorised";
    if (!deptMap[dept]) deptMap[dept] = { total: 0, count: 0, alerts: 0 };
    deptMap[dept].total += p.margin;
    deptMap[dept].count++;
  });
  marginAlerts.forEach((a) => {
    const dept = a.product.department || a.product.category || "Uncategorised";
    if (deptMap[dept]) deptMap[dept].alerts++;
  });

  const depts = Object.entries(deptMap)
    .map(([dept, { total, count, alerts }]) => ({ dept, avg: Math.round((total / count) * 10) / 10, count, alerts }))
    .sort((a, b) => a.avg - b.avg);

  const exportCSV = () => {
    const rows = [
      ["Product", "SKU", "Department", "Cost", "Sell Price", "Margin %", "Threshold %", "Gap", "Severity", "Recommended Action"],
      ...displayed.map((item) => [
        item.product.name,
        item.product.sku,
        item.product.department || item.product.category,
        item.product.costPrice.toFixed(2),
        item.product.sellingPrice.toFixed(2),
        item.product.margin.toFixed(1),
        item.threshold?.toFixed(0) ?? "",
        item.gap?.toFixed(1) ?? "",
        item.severity,
        item.action,
      ]),
    ];
    const csv = rows.map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `attention-report-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-full bg-[#f4faf6] fade-up">
      <div className="px-7 py-6 max-w-[1200px] mx-auto">

        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Reports</h1>
            <p className="text-sm text-gray-500 mt-0.5">{products.length} products analysed — {items.length} items need attention</p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={onNewUpload} className="flex items-center gap-2 text-xs font-semibold text-gray-600 border border-gray-200 px-4 py-2.5 rounded-xl hover:bg-gray-50">
              <Upload className="w-3.5 h-3.5" /> New Upload
            </button>
            <button onClick={exportCSV} className="flex items-center gap-2 bg-[#16a34a] text-white text-xs font-semibold px-4 py-2.5 rounded-xl hover:bg-[#15803d] shadow-sm">
              <Download className="w-3.5 h-3.5" /> Export CSV
            </button>
          </div>
        </div>

        {/* Department breakdown */}
        <div className="bg-white rounded-2xl shadow-[0_2px_10px_rgba(0,0,0,0.06)] p-5 mb-5">
          <h2 className="text-sm font-bold text-gray-900 mb-4">Average Margin by Department</h2>
          <div className="space-y-3">
            {depts.map(({ dept, avg, count, alerts }) => (
              <div key={dept} className="flex items-center gap-4">
                <div className="w-32 text-xs font-semibold text-gray-700 truncate shrink-0">{dept}</div>
                <div className="flex-1 h-5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${avg < 0 ? "bg-red-500" : avg < 20 ? "bg-amber-400" : "bg-green-500"}`}
                    style={{ width: `${Math.max(2, Math.min(100, avg))}%` }}
                  />
                </div>
                <span className={`text-xs font-bold w-12 text-right shrink-0 ${avg < 0 ? "text-red-600" : avg < 20 ? "text-amber-600" : "text-green-700"}`}>{avg}%</span>
                <span className="text-[10px] text-gray-400 w-20 shrink-0">{count} products</span>
                {alerts > 0 && (
                  <span className="text-[10px] bg-red-50 text-red-600 font-bold px-2 py-0.5 rounded-full shrink-0">{alerts} flags</span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Attention Report */}
        <div className="bg-white rounded-2xl shadow-[0_2px_10px_rgba(0,0,0,0.06)] overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-gray-900">Attention Report</h2>
              <p className="text-xs text-gray-400 mt-0.5">Products that need your attention, ranked by urgency</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400">Show top</span>
              <div className="flex gap-1">
                {TOP_N_OPTIONS.map((n) => (
                  <button
                    key={n}
                    onClick={() => setTopN(n)}
                    className={[
                      "px-2.5 py-1 rounded-lg text-xs font-semibold transition-all",
                      topN === n ? "bg-[#0d1117] text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200",
                    ].join(" ")}
                  >
                    {n === -1 ? "All" : n}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left px-5 py-3 text-[10px] font-semibold text-gray-500 uppercase tracking-wide">#</th>
                <th className="text-left px-4 py-3 text-[10px] font-semibold text-gray-500 uppercase tracking-wide">Product</th>
                <th className="text-left px-4 py-3 text-[10px] font-semibold text-gray-500 uppercase tracking-wide">Department</th>
                <th className="text-right px-4 py-3 text-[10px] font-semibold text-gray-500 uppercase tracking-wide">Cost</th>
                <th className="text-right px-4 py-3 text-[10px] font-semibold text-gray-500 uppercase tracking-wide">Sell</th>
                <th className="text-center px-4 py-3 text-[10px] font-semibold text-gray-500 uppercase tracking-wide">Margin</th>
                <th className="text-center px-4 py-3 text-[10px] font-semibold text-gray-500 uppercase tracking-wide">Severity</th>
                <th className="text-left px-4 py-3 text-[10px] font-semibold text-gray-500 uppercase tracking-wide">Reason</th>
                <th className="text-left px-4 py-3 text-[10px] font-semibold text-gray-500 uppercase tracking-wide">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {displayed.map((item, i) => {
                const sevColor = item.severity === "Critical" ? "bg-red-50 text-red-600" : item.severity === "High" ? "bg-orange-50 text-orange-600" : item.severity === "Medium" ? "bg-amber-50 text-amber-600" : "bg-blue-50 text-blue-500";
                return (
                  <tr key={i} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3 text-xs text-gray-400 font-medium">{i + 1}</td>
                    <td className="px-4 py-3">
                      <p className="text-xs font-bold text-gray-900">{item.product.name}</p>
                      {item.product.sku && <p className="text-[10px] text-gray-400">{item.product.sku}</p>}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">{item.product.department || item.product.category || "—"}</td>
                    <td className="px-4 py-3 text-right text-xs text-gray-600">{formatEuro(item.product.costPrice)}</td>
                    <td className="px-4 py-3 text-right text-xs text-gray-600">{formatEuro(item.product.sellingPrice)}</td>
                    <td className="px-4 py-3 text-center"><MarginCell margin={item.product.margin} threshold={item.threshold} /></td>
                    <td className="px-4 py-3 text-center">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${sevColor}`}>{item.severity}</span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500 max-w-[160px]">{item.reason}</td>
                    <td className="px-4 py-3 text-xs font-semibold text-[#16a34a]">{item.action}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
