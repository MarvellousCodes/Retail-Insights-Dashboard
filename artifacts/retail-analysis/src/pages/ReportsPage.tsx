import { useState } from "react";
import { Upload, Download, FileText } from "lucide-react";
import type { Product, MarginAlert, PriceAnomaly } from "@/App";

interface ReportsPageProps {
  products: Product[];
  marginAlerts: MarginAlert[];
  priceAnomalies: PriceAnomaly[];
  fixedIds: Set<string>;
  onNewUpload: () => void;
}

function fmt(n: number) { return `€${n.toFixed(2)}`; }

const TOP_N_OPTIONS = [10, 25, 50, 100, -1];

export function ReportsPage({ products, marginAlerts, priceAnomalies, fixedIds, onNewUpload }: ReportsPageProps) {
  const [topN, setTopN] = useState(25);

  if (products.length === 0) {
    return (
      <div className="min-h-full bg-gray-50 flex items-center justify-center fade-up">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 rounded-full bg-violet-100 flex items-center justify-center mx-auto mb-4">
            <FileText className="w-8 h-8 text-violet-400" />
          </div>
          <h2 className="text-lg font-black text-gray-800">No data yet</h2>
          <p className="text-sm text-gray-400 mt-1 mb-5">Upload a CSV file to generate your attention report.</p>
          <button onClick={onNewUpload} className="inline-flex items-center gap-2 bg-violet-600 text-white text-sm font-bold px-5 py-2.5 rounded-xl hover:bg-violet-700 transition-colors shadow-md shadow-violet-600/25">
            <Upload className="w-4 h-4" /> Upload CSV
          </button>
        </div>
      </div>
    );
  }

  const active = marginAlerts.filter((a) => !fixedIds.has(a.product.id));

  const items = [...active].sort(
    (a, b) => {
      const o = { Critical: 0, High: 1, Medium: 2, Low: 3 };
      return o[a.severity] - o[b.severity] || b.gap - a.gap;
    }
  );

  const displayed = topN === -1 ? items : items.slice(0, topN);

  const deptMap: Record<string, { margins: number[]; alerts: number }> = {};
  products.forEach((p) => {
    const k = p.category || p.department || "Other";
    if (!deptMap[k]) deptMap[k] = { margins: [], alerts: 0 };
    deptMap[k].margins.push(p.margin);
  });
  active.forEach((a) => {
    const k = a.product.category || a.product.department || "Other";
    if (deptMap[k]) deptMap[k].alerts++;
  });
  const depts = Object.entries(deptMap)
    .map(([dept, { margins, alerts }]) => ({
      dept,
      avg: Math.round((margins.reduce((s, m) => s + m, 0) / margins.length) * 10) / 10,
      count: margins.length,
      alerts,
    }))
    .sort((a, b) => a.avg - b.avg);

  const exportCSV = () => {
    const rows = [
      ["#", "Product", "SKU", "Category", "Cost", "Sell Price", "Margin %", "Target %", "Gap", "Recommended Price", "Rounded Price", "Profit Impact", "Severity"],
      ...displayed.map((item, i) => [
        i + 1,
        item.product.name,
        item.product.sku,
        item.product.category || item.product.department,
        item.product.costPrice.toFixed(2),
        item.product.sellingPrice.toFixed(2),
        item.product.margin.toFixed(1),
        item.threshold.toFixed(0),
        item.gap.toFixed(1),
        item.recommendedPrice.toFixed(2),
        item.roundedPrice.toFixed(2),
        item.profitImpact.toFixed(2),
        item.severity,
      ]),
    ];
    const csv = rows.map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `profit-report-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-full bg-gray-50 fade-up">
      <div className="px-7 py-6 max-w-[1200px] mx-auto">

        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-black text-gray-900">Reports</h1>
            <p className="text-sm text-gray-400 mt-0.5">{products.length} products · {items.length} active issues</p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={onNewUpload} className="flex items-center gap-2 text-xs font-bold text-gray-600 border border-gray-200 bg-white px-4 py-2.5 rounded-xl hover:border-violet-300 hover:text-violet-600">
              <Upload className="w-3.5 h-3.5" /> New Upload
            </button>
            <button onClick={exportCSV} className="flex items-center gap-2 bg-violet-600 text-white text-xs font-bold px-4 py-2.5 rounded-xl hover:bg-violet-700 shadow-sm shadow-violet-600/25">
              <Download className="w-3.5 h-3.5" /> Export CSV
            </button>
          </div>
        </div>

        {/* Dept breakdown */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-5">
          <h2 className="text-sm font-black text-gray-900 mb-4">Average Margin by Category</h2>
          <div className="space-y-3">
            {depts.map(({ dept, avg, count, alerts }) => (
              <div key={dept} className="flex items-center gap-4">
                <div className="w-36 text-xs font-semibold text-gray-700 truncate shrink-0">{dept}</div>
                <div className="flex-1 h-5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${avg < 0 ? "bg-red-500" : avg < 20 ? "bg-amber-400" : "bg-green-500"}`}
                    style={{ width: `${Math.max(2, Math.min(100, avg))}%` }}
                  />
                </div>
                <span className={`text-xs font-black w-12 text-right shrink-0 ${avg < 0 ? "text-red-600" : avg < 20 ? "text-amber-600" : "text-green-700"}`}>{avg}%</span>
                <span className="text-[10px] text-gray-400 w-20 shrink-0">{count} products</span>
                {alerts > 0 && <span className="text-[10px] bg-red-50 text-red-600 font-black px-2 py-0.5 rounded-full shrink-0">{alerts} flags</span>}
              </div>
            ))}
          </div>
        </div>

        {/* Attention report */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-black text-gray-900">Attention Report</h2>
              <p className="text-xs text-gray-400 mt-0.5">Products ranked by urgency and profit impact</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400">Show top</span>
              <div className="flex gap-1">
                {TOP_N_OPTIONS.map((n) => (
                  <button key={n} onClick={() => setTopN(n)}
                    className={["px-2.5 py-1 rounded-lg text-xs font-bold transition-all",
                      topN === n ? "bg-violet-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-violet-50 hover:text-violet-700"].join(" ")}>
                    {n === -1 ? "All" : n}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                {["#", "Product", "Category", "Cost", "Sell", "Margin", "Target", "Recommended", "Rounded", "Impact", "Severity"].map((h) => (
                  <th key={h} className={`py-3 text-[10px] font-bold text-gray-400 uppercase tracking-wide ${h === "#" || h === "Severity" ? "px-5" : "px-3"} ${["Cost", "Sell", "Recommended", "Rounded", "Impact"].includes(h) ? "text-right" : ["Margin", "Target", "Severity"].includes(h) ? "text-center" : "text-left"}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {displayed.map((item, i) => {
                const sevCls = item.severity === "Critical" ? "bg-red-50 text-red-600" : item.severity === "High" ? "bg-orange-50 text-orange-600" : item.severity === "Medium" ? "bg-amber-50 text-amber-600" : "bg-blue-50 text-blue-500";
                return (
                  <tr key={item.product.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3 text-xs text-gray-400 font-medium">{i + 1}</td>
                    <td className="px-3 py-3">
                      <p className="text-xs font-bold text-gray-900">{item.product.name}</p>
                      {item.product.sku && <p className="text-[10px] text-gray-400">{item.product.sku}</p>}
                    </td>
                    <td className="px-3 py-3 text-xs text-gray-500">{item.product.category || item.product.department || "—"}</td>
                    <td className="px-3 py-3 text-right text-xs text-gray-600">{fmt(item.product.costPrice)}</td>
                    <td className="px-3 py-3 text-right text-xs text-gray-600">{fmt(item.product.sellingPrice)}</td>
                    <td className="px-3 py-3 text-center">
                      <span className={`text-xs font-black px-2 py-0.5 rounded-full ${item.product.margin < 0 ? "bg-red-100 text-red-700" : "bg-orange-100 text-orange-700"}`}>{item.product.margin}%</span>
                    </td>
                    <td className="px-3 py-3 text-center text-xs text-gray-400">{item.threshold}%</td>
                    <td className="px-3 py-3 text-right text-xs text-gray-500">{fmt(item.recommendedPrice)}</td>
                    <td className="px-3 py-3 text-right text-xs font-black text-violet-700">{fmt(item.roundedPrice)}</td>
                    <td className="px-3 py-3 text-right">
                      {item.profitImpact > 0 && <span className="text-xs font-black text-green-600">+{fmt(item.profitImpact)}</span>}
                    </td>
                    <td className="px-5 py-3 text-center"><span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${sevCls}`}>{item.severity}</span></td>
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
