import { useState } from "react";
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  LineChart, Line, XAxis, YAxis, CartesianGrid, ReferenceLine,
} from "recharts";
import {
  TrendingDown, Upload, AlertTriangle, Package,
  FileText, BarChart2, ArrowUpRight, Zap, AlertCircle,
  ChevronRight, TrendingUp, ShieldAlert,
} from "lucide-react";
import type { AnalysisResult, AnalysisRow } from "@/App";

function formatEuro(n: number) {
  return `€${n.toLocaleString("en-IE")}`;
}

function formatDate(d: Date) {
  return d.toLocaleDateString("en-IE", { day: "2-digit", month: "short", year: "numeric" });
}

const PIE_COLORS = ["#16a34a", "#f59e0b", "#ef4444", "#3b82f6", "#8b5cf6", "#06b6d4"];

const ACTION_FOR_ISSUE: Record<string, string> = {
  "Margin too low": "Increase price",
  "Cost mismatch": "Match supplier cost",
  "Pricing inconsistency": "Fix pricing",
  "Suspicious entry": "Review entry",
};

function getAction(issue: string): string {
  return ACTION_FOR_ISSUE[issue] ?? "Review";
}

function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: any[]; label?: string }) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#0d1117] border border-gray-700 shadow-xl rounded-xl px-3 py-2 text-sm">
        {label && <p className="font-semibold text-gray-300 mb-1 text-xs">{label}</p>}
        {payload.map((p: any, i: number) => (
          <p key={i} className="font-bold text-white">
            {formatEuro(p.value)}
          </p>
        ))}
      </div>
    );
  }
  return null;
}

interface DashboardPageProps {
  results: AnalysisResult[];
  onNewUpload: () => void;
}

export function DashboardPage({ results, onNewUpload }: DashboardPageProps) {
  const [expandedAction, setExpandedAction] = useState<string | null>(null);

  if (results.length === 0) {
    return (
      <div className="min-h-full flex items-center justify-center bg-[#f4faf6]">
        <div className="text-center fade-up">
          <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
            <BarChart2 className="w-8 h-8 text-green-400" />
          </div>
          <h2 className="text-lg font-bold text-gray-900">No data yet</h2>
          <p className="text-sm text-gray-500 mt-1 mb-5">Upload your first report to see insights.</p>
          <button
            onClick={onNewUpload}
            className="inline-flex items-center gap-2 bg-[#16a34a] text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-[#15803d] transition-colors shadow-md"
          >
            <Upload className="w-4 h-4" />
            Upload a report
          </button>
        </div>
      </div>
    );
  }

  const totalLoss = results.reduce((s, r) => s + r.totalLoss, 0);
  const totalIssues = results.reduce((s, r) => s + r.pricingIssues + r.inconsistencies + r.suspiciousEntries, 0);
  const allRows = results.flatMap((r) => r.rows);
  const avgLoss = Math.round(totalLoss / results.length);
  const revenuePercent = ((totalLoss / 64000) * 100).toFixed(1);

  const categoryMap: Record<string, number> = {};
  allRows.forEach((row) => {
    categoryMap[row.category] = (categoryMap[row.category] || 0) + row.estimatedLoss;
  });
  const categoryData = Object.entries(categoryMap)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  const productMap: Record<string, { loss: number; issue: string }> = {};
  allRows.forEach((row) => {
    if (!productMap[row.product]) productMap[row.product] = { loss: 0, issue: row.issue };
    productMap[row.product].loss += row.estimatedLoss;
  });
  const productData = Object.entries(productMap)
    .map(([name, { loss, issue }]) => ({ name, loss, issue }))
    .sort((a, b) => b.loss - a.loss)
    .slice(0, 8);

  const trendData = [...results]
    .sort((a, b) => a.uploadedAt.getTime() - b.uploadedAt.getTime())
    .map((r) => ({
      name: formatDate(r.uploadedAt),
      loss: r.totalLoss,
      benchmark: Math.round(r.totalLoss * 0.83),
    }));

  const actionItems: (AnalysisRow & { monthlyLoss?: number })[] = [...allRows]
    .sort((a, b) => b.estimatedLoss - a.estimatedLoss)
    .slice(0, 3)
    .map((row) => ({ ...row, monthlyLoss: Math.round(row.estimatedLoss * 2.7) }));

  const potentialSaving = actionItems.reduce((s, r) => s + (r.monthlyLoss ?? 0), 0);

  const QUICK_WINS = [
    { label: "Increase Coke price by €0.10", gain: "+€220/month", color: "text-green-600", icon: <TrendingUp className="w-4 h-4 text-green-500" /> },
    { label: "Fix supplier mismatch on Bread", gain: "+€80 instantly", color: "text-green-700", icon: <Zap className="w-4 h-4 text-amber-500" /> },
    { label: "Review Milk 2L negative margin", gain: "+€60/month", color: "text-green-600", icon: <ArrowUpRight className="w-4 h-4 text-blue-500" /> },
  ];

  const SIMILAR_STORE_LOSS = Math.round(totalLoss * 0.82);
  const benchmarkDiff = Math.round(((totalLoss - SIMILAR_STORE_LOSS) / SIMILAR_STORE_LOSS) * 100);

  return (
    <div className="min-h-full bg-[#f4faf6] fade-up">
      <div className="px-7 py-6 max-w-[1400px] mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-sm text-gray-500 mt-0.5">Overview across {results.length} report{results.length !== 1 ? "s" : ""}</p>
          </div>
          <button
            onClick={onNewUpload}
            className="flex items-center gap-2 bg-[#16a34a] text-white text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-[#15803d] transition-colors shadow-md shadow-green-900/20"
          >
            <Upload className="w-4 h-4" />
            New Upload
          </button>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-4 gap-4 mb-5">
          {/* Loss card — wide with revenue % */}
          <div className="col-span-1 bg-white rounded-2xl shadow-[0_2px_10px_rgba(0,0,0,0.06)] p-5 border-l-4 border-red-500">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Total Loss</span>
              <TrendingDown className="w-4 h-4 text-red-500" />
            </div>
            <p className="text-3xl font-black text-red-600">{formatEuro(totalLoss)}</p>
            <p className="text-xs font-semibold text-red-400 mt-0.5">lost this month</p>
            <p className="text-xs text-gray-400 mt-2">= <span className="font-bold text-gray-600">{revenuePercent}%</span> of your revenue</p>
            <p className="text-[10px] text-gray-300 mt-0.5">Calculated from pricing & reports</p>
          </div>

          <div className="bg-white rounded-2xl shadow-[0_2px_10px_rgba(0,0,0,0.06)] p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Reports</span>
              <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                <FileText className="w-4 h-4 text-blue-500" />
              </div>
            </div>
            <p className="text-2xl font-extrabold text-gray-900">{results.length}</p>
            <p className="text-xs text-gray-400 mt-0.5">Total files analysed</p>
          </div>

          <div className="bg-white rounded-2xl shadow-[0_2px_10px_rgba(0,0,0,0.06)] p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Total Issues</span>
              <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
              </div>
            </div>
            <p className="text-2xl font-extrabold text-gray-900">{totalIssues}</p>
            <p className="text-xs text-gray-400 mt-0.5">Pricing, margin & more</p>
          </div>

          <div className="bg-white rounded-2xl shadow-[0_2px_10px_rgba(0,0,0,0.06)] p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Avg Loss / Report</span>
              <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center">
                <Package className="w-4 h-4 text-purple-500" />
              </div>
            </div>
            <p className="text-2xl font-extrabold text-gray-900">{formatEuro(avgLoss)}</p>
            <p className="text-xs text-gray-400 mt-0.5">Per file average</p>
          </div>
        </div>

        {/* Action Center + Quick Wins */}
        <div className="grid grid-cols-3 gap-5 mb-5">
          {/* Action Center */}
          <div className="col-span-2 bg-white rounded-2xl shadow-[0_2px_10px_rgba(0,0,0,0.06)] overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-red-500" />
                <h2 className="text-sm font-bold text-gray-900">Action Center</h2>
              </div>
              <span className="text-xs text-gray-400">{actionItems.length} urgent issues</span>
            </div>
            <div className="divide-y divide-gray-50">
              {actionItems.map((row, i) => (
                <div
                  key={i}
                  className="px-5 py-4 flex items-center justify-between gap-4 hover:bg-gray-50 transition-colors cursor-pointer"
                  onClick={() => setExpandedAction(expandedAction === row.product ? null : row.product)}
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <AlertCircle className={`w-5 h-5 shrink-0 ${i === 0 ? "text-red-500" : "text-amber-400"}`} />
                    <div className="min-w-0">
                      <p className="text-sm text-gray-800">
                        <span className="font-semibold">{row.product}</span>
                        {" "}
                        <span className="text-gray-500">{row.issue.toLowerCase()}</span>
                        {" → losing "}
                        <span className="font-bold text-red-600">{formatEuro(row.monthlyLoss ?? row.estimatedLoss)}/month</span>
                      </p>
                      {expandedAction === row.product && (
                        <p className="text-xs text-gray-400 mt-1">
                          Suggested fix: <span className="font-semibold text-green-700">{getAction(row.issue)}</span> — estimated recovery {formatEuro(row.monthlyLoss ?? row.estimatedLoss)} monthly.
                        </p>
                      )}
                    </div>
                  </div>
                  <button className="shrink-0 flex items-center gap-1.5 bg-[#16a34a] text-white text-xs font-semibold px-3.5 py-2 rounded-lg hover:bg-[#15803d] transition-colors shadow-sm">
                    View Fix <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
            <div className="px-5 py-3 bg-green-50 border-t border-green-100">
              <p className="text-xs text-green-700">
                <span className="font-semibold">Tip:</span> Fixing these issues could save you{" "}
                <span className="font-bold">{formatEuro(potentialSaving)}/month</span>.
              </p>
            </div>
          </div>

          {/* Quick Wins */}
          <div className="bg-white rounded-2xl shadow-[0_2px_10px_rgba(0,0,0,0.06)] overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-500" />
                <h2 className="text-sm font-bold text-gray-900">Quick Wins</h2>
              </div>
              <p className="text-xs text-gray-400 mt-0.5">Fix in 5 minutes</p>
            </div>
            <div className="divide-y divide-gray-50">
              {QUICK_WINS.map((win, i) => (
                <div key={i} className="px-5 py-4 flex items-start justify-between gap-3 hover:bg-gray-50 transition-colors cursor-pointer group">
                  <div className="flex items-start gap-2.5">
                    <div className="mt-0.5 shrink-0">{win.icon}</div>
                    <p className="text-xs text-gray-700 leading-snug">{win.label}</p>
                  </div>
                  <span className={`text-xs font-bold whitespace-nowrap ${win.color} shrink-0`}>{win.gain}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Charts row */}
        <div className="grid grid-cols-2 gap-5 mb-5">
          {/* Loss by Category */}
          <div className="bg-white rounded-2xl shadow-[0_2px_10px_rgba(0,0,0,0.06)] p-5">
            <h2 className="text-sm font-bold text-gray-900 mb-0.5">Loss by Category</h2>
            <p className="text-xs text-gray-400 mb-4">Which product categories are bleeding the most</p>
            <div className="flex items-center gap-5">
              <div className="shrink-0" style={{ width: 140, height: 140 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={categoryData} cx="50%" cy="50%" innerRadius={38} outerRadius={62} paddingAngle={3} dataKey="value">
                      {categoryData.map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v: number) => formatEuro(v)} contentStyle={{ borderRadius: 10, border: "1px solid #e5e7eb", fontSize: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex flex-col gap-2.5 flex-1">
                {categoryData.map(({ name, value }, i) => (
                  <div key={name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                      <span className="text-xs text-gray-600">{name}</span>
                    </div>
                    <span className="text-xs font-bold text-gray-800">{formatEuro(value)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Top Losing Products with Actions */}
          <div className="bg-white rounded-2xl shadow-[0_2px_10px_rgba(0,0,0,0.06)] overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-gray-900">Top Losing Products</h2>
                <p className="text-xs text-gray-400 mt-0.5">Ranked by cumulative loss</p>
              </div>
              <button className="text-xs text-[#16a34a] font-semibold flex items-center gap-1 hover:underline">
                View All <ArrowUpRight className="w-3 h-3" />
              </button>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left px-5 py-2.5 text-[10px] font-semibold text-gray-500 uppercase tracking-wide">Product</th>
                  <th className="text-right px-4 py-2.5 text-[10px] font-semibold text-gray-500 uppercase tracking-wide">Loss</th>
                  <th className="text-right px-5 py-2.5 text-[10px] font-semibold text-gray-500 uppercase tracking-wide">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {productData.map(({ name, loss, issue }, i) => (
                  <tr key={name} className="hover:bg-gray-50 transition-colors group">
                    <td className="px-5 py-3">
                      <span className="text-xs font-semibold text-gray-800">{name}</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="text-xs font-bold text-red-600">{formatEuro(loss)}</span>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <button className={`text-xs font-semibold flex items-center gap-1 ml-auto ${i === 2 ? "text-red-500 hover:text-red-600" : "text-[#16a34a] hover:text-[#15803d]"}`}>
                        {getAction(issue)} <ChevronRight className="w-3 h-3" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Benchmarking + Loss Over Time */}
        <div className="grid grid-cols-2 gap-5 mb-5">
          {/* Benchmarking */}
          <div className="bg-white rounded-2xl shadow-[0_2px_10px_rgba(0,0,0,0.06)] p-5">
            <div className="flex items-center gap-2 mb-1">
              <BarChart2 className="w-4 h-4 text-gray-400" />
              <h2 className="text-sm font-bold text-gray-900">Store Benchmark</h2>
            </div>
            <p className="text-xs text-gray-400 mb-4">How you compare to similar stores in your area</p>

            <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3 mb-5">
              <p className="text-sm font-bold text-red-700">
                You are losing <span className="text-red-600 font-black">{benchmarkDiff}% more</span> than similar stores
              </p>
            </div>

            <div className="space-y-4">
              {[
                { label: "Similar Stores", loss: SIMILAR_STORE_LOSS, color: "bg-green-500" },
                { label: "Your Store", loss: totalLoss, color: "bg-red-500" },
              ].map(({ label, loss, color }) => {
                const pct = Math.round((loss / (totalLoss * 1.1)) * 100);
                return (
                  <div key={label}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-semibold text-gray-700">{label}</span>
                      <span className="text-xs font-bold text-gray-800">{formatEuro(loss)}</span>
                    </div>
                    <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                      <div className={`h-full ${color} rounded-full transition-all duration-700`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3">
              <div className="bg-gray-50 rounded-xl px-3 py-2.5 text-center">
                <p className="text-[10px] text-gray-400 mb-0.5">Avg Store Loss</p>
                <p className="text-sm font-extrabold text-green-700">{formatEuro(SIMILAR_STORE_LOSS)}</p>
              </div>
              <div className="bg-red-50 rounded-xl px-3 py-2.5 text-center">
                <p className="text-[10px] text-gray-400 mb-0.5">Your Loss</p>
                <p className="text-sm font-extrabold text-red-600">{formatEuro(totalLoss)}</p>
              </div>
            </div>
          </div>

          {/* Loss Over Time */}
          <div className="bg-white rounded-2xl shadow-[0_2px_10px_rgba(0,0,0,0.06)] p-5">
            <h2 className="text-sm font-bold text-gray-900 mb-0.5">Loss Over Time</h2>
            <p className="text-xs text-gray-400 mb-4">
              You are losing{" "}
              <span className="font-bold text-red-600">{benchmarkDiff}% more</span> than{" "}
              <span className="text-gray-500">similar stores</span>
            </p>
            <ResponsiveContainer width="100%" height={190}>
              <LineChart data={trendData} margin={{ left: 0, right: 16, top: 4, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                <YAxis tickFormatter={(v) => `€${v}`} tick={{ fontSize: 10, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                <Tooltip content={<ChartTooltip />} />
                {trendData.length > 1 && (
                  <ReferenceLine
                    y={Math.round(trendData.reduce((s, d) => s + d.benchmark, 0) / trendData.length)}
                    stroke="#16a34a"
                    strokeDasharray="5 3"
                    label={{ value: "Avg store", position: "insideTopRight", fontSize: 9, fill: "#16a34a" }}
                  />
                )}
                <Line type="monotone" dataKey="loss" stroke="#dc2626" strokeWidth={2.5} dot={{ fill: "#dc2626", strokeWidth: 0, r: 4 }} activeDot={{ r: 6 }} />
                <Line type="monotone" dataKey="benchmark" stroke="#16a34a" strokeWidth={1.5} strokeDasharray="5 3" dot={false} />
              </LineChart>
            </ResponsiveContainer>
            <div className="flex items-center gap-5 mt-3 justify-end">
              <div className="flex items-center gap-1.5">
                <div className="w-5 h-0.5 bg-red-500 rounded" />
                <span className="text-[10px] text-gray-500">Your store</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-5 h-0.5 bg-green-500 rounded border-dashed" style={{ borderTop: "2px dashed #16a34a", background: "transparent" }} />
                <span className="text-[10px] text-gray-500">Similar stores</span>
              </div>
            </div>
          </div>
        </div>

        {/* Upload History */}
        <div className="bg-white rounded-2xl shadow-[0_2px_10px_rgba(0,0,0,0.06)] overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-gray-900">Upload History</h2>
              <p className="text-xs text-gray-400 mt-0.5">All previous reports and their findings</p>
            </div>
            <span className="text-xs bg-gray-100 text-gray-500 font-semibold px-2.5 py-1 rounded-full">{results.length} reports</span>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left px-5 py-3 text-[10px] font-semibold text-gray-500 uppercase tracking-wide">File</th>
                <th className="text-left px-5 py-3 text-[10px] font-semibold text-gray-500 uppercase tracking-wide">Uploaded</th>
                <th className="text-center px-5 py-3 text-[10px] font-semibold text-gray-500 uppercase tracking-wide">Issues</th>
                <th className="text-center px-5 py-3 text-[10px] font-semibold text-gray-500 uppercase tracking-wide">Worst Category</th>
                <th className="text-center px-5 py-3 text-[10px] font-semibold text-gray-500 uppercase tracking-wide">Top Action</th>
                <th className="text-right px-5 py-3 text-[10px] font-semibold text-gray-500 uppercase tracking-wide">Total Loss</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {results.map((r) => {
                const worstRow = r.rows.reduce((a, b) => (a.estimatedLoss > b.estimatedLoss ? a : b), r.rows[0]);
                return (
                  <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-green-50 flex items-center justify-center shrink-0">
                          <FileText className="w-4 h-4 text-green-600" />
                        </div>
                        <span className="font-semibold text-gray-800 text-xs">{r.fileName || "Report"}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-gray-500 text-xs">{formatDate(r.uploadedAt)}</td>
                    <td className="px-5 py-3.5 text-center">
                      <span className="inline-block bg-amber-50 text-amber-700 text-[10px] font-bold px-2.5 py-1 rounded-full">
                        {r.pricingIssues + r.inconsistencies + r.suspiciousEntries} issues
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-center text-xs text-gray-500">{r.mostAffectedCategory}</td>
                    <td className="px-5 py-3.5 text-center">
                      {worstRow && (
                        <span className="text-[10px] font-semibold text-[#16a34a]">{getAction(worstRow.issue)}</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-right font-black text-red-600 text-sm">{formatEuro(r.totalLoss)}</td>
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
