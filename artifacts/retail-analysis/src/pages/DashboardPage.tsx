import { TrendingDown, Upload, AlertTriangle, Tag, FileText, BarChart2 } from "lucide-react";
import type { Product, MarginAlert, PriceAnomaly, DeptThreshold } from "@/App";

interface DashboardPageProps {
  products: Product[];
  marginAlerts: MarginAlert[];
  priceAnomalies: PriceAnomaly[];
  thresholds: DeptThreshold[];
  onNewUpload: () => void;
}

export function DashboardPage({ products, marginAlerts, priceAnomalies, thresholds, onNewUpload }: DashboardPageProps) {
  if (products.length === 0) {
    return (
      <div className="min-h-full bg-[#f4faf6] flex items-center justify-center fade-up">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-5">
            <BarChart2 className="w-8 h-8 text-green-400" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Ready to analyse your products</h2>
          <p className="text-sm text-gray-500 mb-6 leading-relaxed">
            Upload a CSV export from your EPOS or stock system to automatically check margins, detect price errors, and see which products need attention.
          </p>
          <button
            onClick={onNewUpload}
            className="inline-flex items-center gap-2 bg-[#16a34a] text-white text-sm font-semibold px-6 py-3 rounded-xl hover:bg-[#15803d] transition-colors shadow-md shadow-green-900/20"
          >
            <Upload className="w-4 h-4" />
            Upload CSV to get started
          </button>
          <div className="mt-8 grid grid-cols-3 gap-4 text-left">
            {[
              { title: "Margin Checking", desc: "Automatically flags products below your department thresholds — no manual checking." },
              { title: "Price Anomaly Detection", desc: "Spots products where the selling price or margin looks wrong before they cost you." },
              { title: "Attention Report", desc: "Get a ranked list of the top 10, 50, or 150 items that need fixing today." },
            ].map(({ title, desc }) => (
              <div key={title} className="bg-white rounded-2xl p-4 shadow-[0_2px_8px_rgba(0,0,0,0.05)]">
                <p className="text-xs font-bold text-gray-800 mb-1">{title}</p>
                <p className="text-xs text-gray-400 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const manualCount = products.filter((p) => p.isManualEntry).length;
  const criticalCount = marginAlerts.filter((a) => a.severity === "Critical").length;
  const avgMargin = products.length > 0
    ? Math.round((products.reduce((s, p) => s + p.margin, 0) / products.length) * 10) / 10
    : 0;

  // Dept breakdown
  const deptMap: Record<string, { margins: number[]; alerts: number }> = {};
  products.forEach((p) => {
    const dept = p.department || p.category || "Other";
    if (!deptMap[dept]) deptMap[dept] = { margins: [], alerts: 0 };
    deptMap[dept].margins.push(p.margin);
  });
  marginAlerts.forEach((a) => {
    const dept = a.product.department || a.product.category || "Other";
    if (deptMap[dept]) deptMap[dept].alerts++;
  });
  const depts = Object.entries(deptMap)
    .map(([dept, { margins, alerts }]) => ({
      dept,
      avg: Math.round((margins.reduce((s, m) => s + m, 0) / margins.length) * 10) / 10,
      count: margins.length,
      alerts,
      threshold: thresholds.find((t) => t.department.toLowerCase() === dept.toLowerCase())?.minMargin ?? 20,
    }))
    .sort((a, b) => a.avg - b.avg);

  // Top flagged products
  const topFlagged = [...marginAlerts]
    .sort((a, b) => {
      const sevOrder = { Critical: 0, High: 1, Medium: 2, Low: 3 };
      return sevOrder[a.severity] - sevOrder[b.severity] || b.gap - a.gap;
    })
    .slice(0, 8);

  return (
    <div className="min-h-full bg-[#f4faf6] fade-up">
      <div className="px-7 py-6 max-w-[1200px] mx-auto">

        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-sm text-gray-500 mt-0.5">{products.length} products analysed</p>
          </div>
          <button
            onClick={onNewUpload}
            className="flex items-center gap-2 bg-[#16a34a] text-white text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-[#15803d] transition-colors shadow-md shadow-green-900/20"
          >
            <Upload className="w-4 h-4" />
            New Upload
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-5">
          {[
            { label: "Below Margin", value: marginAlerts.length, sub: `${criticalCount} critical`, icon: <TrendingDown className="w-4 h-4 text-red-500" />, bg: "bg-red-50", color: "text-red-700" },
            { label: "Price Anomalies", value: priceAnomalies.length, sub: "data entry issues", icon: <AlertTriangle className="w-4 h-4 text-amber-500" />, bg: "bg-amber-50", color: "text-amber-700" },
            { label: "Avg Margin", value: `${avgMargin}%`, sub: "across all products", icon: <Tag className="w-4 h-4 text-blue-500" />, bg: "bg-blue-50", color: "text-blue-700" },
            { label: "Manual Entries", value: manualCount, sub: "non-approved suppliers", icon: <FileText className="w-4 h-4 text-purple-500" />, bg: "bg-purple-50", color: "text-purple-700" },
          ].map(({ label, value, sub, icon, bg, color }) => (
            <div key={label} className="bg-white rounded-2xl shadow-[0_2px_10px_rgba(0,0,0,0.06)] p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{label}</span>
                <div className={`w-8 h-8 rounded-lg ${bg} flex items-center justify-center`}>{icon}</div>
              </div>
              <p className={`text-2xl font-black ${color}`}>{value}</p>
              <p className="text-xs text-gray-400 mt-0.5">{sub}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-5 mb-5">
          {/* Dept Margin Breakdown */}
          <div className="bg-white rounded-2xl shadow-[0_2px_10px_rgba(0,0,0,0.06)] p-5">
            <h2 className="text-sm font-bold text-gray-900 mb-1">Margin by Department</h2>
            <p className="text-xs text-gray-400 mb-4">vs your configured thresholds</p>
            <div className="space-y-3.5">
              {depts.slice(0, 8).map(({ dept, avg, count, alerts, threshold }) => {
                const below = avg < threshold;
                return (
                  <div key={dept}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-gray-700">{dept}</span>
                        {alerts > 0 && (
                          <span className="text-[9px] bg-red-50 text-red-600 font-bold px-1.5 py-0.5 rounded-full">{alerts}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-gray-400">target {threshold}%</span>
                        <span className={`text-xs font-bold ${below ? "text-red-600" : "text-green-700"}`}>{avg}%</span>
                      </div>
                    </div>
                    <div className="relative h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`absolute top-0 left-0 h-full rounded-full transition-all duration-500 ${below ? "bg-red-400" : "bg-green-500"}`}
                        style={{ width: `${Math.max(1, Math.min(100, avg))}%` }}
                      />
                      <div
                        className="absolute top-0 h-full w-0.5 bg-gray-400 opacity-40"
                        style={{ left: `${Math.min(100, threshold)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Top flagged products */}
          <div className="bg-white rounded-2xl shadow-[0_2px_10px_rgba(0,0,0,0.06)] overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <h2 className="text-sm font-bold text-gray-900">Top Items Needing Attention</h2>
              <p className="text-xs text-gray-400 mt-0.5">Ranked by severity and margin gap</p>
            </div>
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left px-5 py-2.5 text-[10px] font-semibold text-gray-500 uppercase tracking-wide">Product</th>
                  <th className="text-center px-3 py-2.5 text-[10px] font-semibold text-gray-500 uppercase tracking-wide">Margin</th>
                  <th className="text-center px-3 py-2.5 text-[10px] font-semibold text-gray-500 uppercase tracking-wide">Target</th>
                  <th className="text-right px-5 py-2.5 text-[10px] font-semibold text-gray-500 uppercase tracking-wide">Severity</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {topFlagged.map((alert, i) => {
                  const sevColor = alert.severity === "Critical" ? "text-red-600 bg-red-50" : alert.severity === "High" ? "text-orange-600 bg-orange-50" : "text-amber-600 bg-amber-50";
                  return (
                    <tr key={i} className="hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-3">
                        <p className="font-semibold text-gray-800 truncate max-w-[160px]">{alert.product.name}</p>
                        <p className="text-[10px] text-gray-400">{alert.product.department || alert.product.category}</p>
                      </td>
                      <td className="px-3 py-3 text-center">
                        <span className={`font-bold ${alert.product.margin < 0 ? "text-red-700" : "text-amber-600"}`}>{alert.product.margin}%</span>
                      </td>
                      <td className="px-3 py-3 text-center text-gray-400">{alert.threshold}%</td>
                      <td className="px-5 py-3 text-right">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${sevColor}`}>{alert.severity}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
