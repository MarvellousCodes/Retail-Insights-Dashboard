import {
  PieChart, Pie, Cell, Tooltip, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, ResponsiveContainer, LineChart, Line,
} from "recharts";
import { TrendingDown, Upload, AlertTriangle, Package, FileText, BarChart2 } from "lucide-react";
import type { AnalysisResult } from "@/App";

function formatEuro(n: number) {
  return `€${n.toLocaleString("en-IE")}`;
}

function formatDate(d: Date) {
  return d.toLocaleDateString("en-IE", { day: "2-digit", month: "short", year: "numeric" });
}

const COLORS = ["#2563eb", "#f59e0b", "#ef4444", "#10b981", "#8b5cf6", "#06b6d4"];
const ISSUE_COLORS: Record<string, string> = {
  "Margin too low": "#ef4444",
  "Cost mismatch": "#f59e0b",
  "Pricing inconsistency": "#2563eb",
  "Suspicious entry": "#8b5cf6",
};

function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: any[]; label?: string }) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white shadow-lg rounded-xl px-3 py-2 text-sm border border-gray-100">
        <p className="font-semibold text-gray-800 mb-1">{label}</p>
        {payload.map((p: any, i: number) => (
          <p key={i} style={{ color: p.stroke || p.fill }} className="font-medium">
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
  if (results.length === 0) {
    return (
      <div className="min-h-full flex items-center justify-center">
        <div className="text-center fade-up">
          <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
            <BarChart2 className="w-8 h-8 text-gray-300" />
          </div>
          <h2 className="text-lg font-bold text-gray-800">No data yet</h2>
          <p className="text-sm text-gray-400 mt-1 mb-5">Upload your first report to see insights.</p>
          <button
            onClick={onNewUpload}
            className="inline-flex items-center gap-2 bg-blue-600 text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-blue-700 transition-colors"
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

  const categoryMap: Record<string, number> = {};
  allRows.forEach((row) => {
    categoryMap[row.category] = (categoryMap[row.category] || 0) + row.estimatedLoss;
  });
  const categoryData = Object.entries(categoryMap)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  const issueMap: Record<string, number> = {};
  allRows.forEach((row) => {
    issueMap[row.issue] = (issueMap[row.issue] || 0) + 1;
  });
  const issueData = Object.entries(issueMap)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  const productMap: Record<string, number> = {};
  allRows.forEach((row) => {
    productMap[row.product] = (productMap[row.product] || 0) + row.estimatedLoss;
  });
  const productData = Object.entries(productMap)
    .map(([name, loss]) => ({ name, loss }))
    .sort((a, b) => b.loss - a.loss)
    .slice(0, 8);

  const trendData = [...results]
    .sort((a, b) => a.uploadedAt.getTime() - b.uploadedAt.getTime())
    .map((r) => ({
      name: formatDate(r.uploadedAt),
      loss: r.totalLoss,
    }));

  return (
    <div className="p-8 fade-up">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            Overview across {results.length} report{results.length !== 1 ? "s" : ""}
          </p>
        </div>
        <button
          onClick={onNewUpload}
          className="flex items-center gap-2 bg-blue-600 text-white text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-blue-700 transition-colors shadow-sm"
        >
          <Upload className="w-4 h-4" />
          New Upload
        </button>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: "Total Loss", value: formatEuro(totalLoss), icon: <TrendingDown className="w-5 h-5 text-red-500" />, bg: "bg-red-50", sub: "Across all reports" },
          { label: "Reports Uploaded", value: String(results.length), icon: <FileText className="w-5 h-5 text-blue-500" />, bg: "bg-blue-50", sub: "Total files analysed" },
          { label: "Total Issues", value: String(totalIssues), icon: <AlertTriangle className="w-5 h-5 text-amber-500" />, bg: "bg-amber-50", sub: "Pricing, margin & more" },
          { label: "Avg Loss / Report", value: formatEuro(avgLoss), icon: <Package className="w-5 h-5 text-purple-500" />, bg: "bg-purple-50", sub: "Per file average" },
        ].map(({ label, value, icon, bg, sub }) => (
          <div key={label} className="bg-white rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.05)] p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{label}</span>
              <div className={`w-8 h-8 rounded-lg ${bg} flex items-center justify-center`}>{icon}</div>
            </div>
            <p className="text-2xl font-extrabold text-gray-900">{value}</p>
            <p className="text-xs text-gray-400 mt-0.5">{sub}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-5 mb-5">
        <div className="bg-white rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.05)] p-5">
          <h2 className="text-sm font-semibold text-gray-800 mb-1">Loss by Category</h2>
          <p className="text-xs text-gray-400 mb-4">Which product categories are bleeding the most</p>
          <div className="flex items-center gap-4">
            <ResponsiveContainer width="50%" height={160}>
              <PieChart>
                <Pie data={categoryData} cx="50%" cy="50%" innerRadius={42} outerRadius={70} paddingAngle={3} dataKey="value">
                  {categoryData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: number) => formatEuro(v)} contentStyle={{ borderRadius: 12, border: "1px solid #f3f4f6", fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-col gap-2 flex-1">
              {categoryData.map(({ name, value }, i) => (
                <div key={name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                    <span className="text-xs text-gray-600">{name}</span>
                  </div>
                  <span className="text-xs font-semibold text-gray-800">{formatEuro(value)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.05)] p-5">
          <h2 className="text-sm font-semibold text-gray-800 mb-1">Issues by Type</h2>
          <p className="text-xs text-gray-400 mb-4">How issues are distributed across reports</p>
          <div className="flex items-center gap-4">
            <ResponsiveContainer width="50%" height={160}>
              <PieChart>
                <Pie data={issueData} cx="50%" cy="50%" outerRadius={70} paddingAngle={3} dataKey="value">
                  {issueData.map((entry, i) => (
                    <Cell key={i} fill={ISSUE_COLORS[entry.name] ?? COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #f3f4f6", fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-col gap-2 flex-1">
              {issueData.map(({ name, value }, i) => (
                <div key={name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ background: ISSUE_COLORS[name] ?? COLORS[i % COLORS.length] }} />
                    <span className="text-xs text-gray-600 leading-tight">{name}</span>
                  </div>
                  <span className="text-xs font-semibold text-gray-800">{value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-5 mb-5">
        <div className="bg-white rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.05)] p-5">
          <h2 className="text-sm font-semibold text-gray-800 mb-1">Top Losing Products</h2>
          <p className="text-xs text-gray-400 mb-4">Cumulative estimated loss per product</p>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={productData} layout="vertical" margin={{ left: 10, right: 30 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f3f4f6" />
              <XAxis type="number" tickFormatter={(v) => `€${v}`} tick={{ fontSize: 10, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: "#6b7280" }} axisLine={false} tickLine={false} width={80} />
              <Tooltip content={<ChartTooltip />} />
              <Bar dataKey="loss" fill="#2563eb" radius={[0, 4, 4, 0]} barSize={14} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.05)] p-5">
          <h2 className="text-sm font-semibold text-gray-800 mb-1">Loss Over Time</h2>
          <p className="text-xs text-gray-400 mb-4">Total loss discovered per upload</p>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={trendData} margin={{ left: 0, right: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={(v) => `€${v}`} tick={{ fontSize: 10, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
              <Tooltip content={<ChartTooltip />} />
              <Line type="monotone" dataKey="loss" stroke="#2563eb" strokeWidth={2.5} dot={{ fill: "#2563eb", strokeWidth: 0, r: 4 }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.05)] overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-gray-800">Upload History</h2>
            <p className="text-xs text-gray-400 mt-0.5">All previous reports</p>
          </div>
          <span className="text-xs text-gray-400">{results.length} reports</span>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">File</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Uploaded</th>
              <th className="text-center px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Issues</th>
              <th className="text-center px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Worst Category</th>
              <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Total Loss</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {results.map((r) => (
              <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                      <FileText className="w-4 h-4 text-blue-500" />
                    </div>
                    <span className="font-medium text-gray-800 text-sm">{r.fileName || "Report"}</span>
                  </div>
                </td>
                <td className="px-5 py-3.5 text-gray-500 text-sm">{formatDate(r.uploadedAt)}</td>
                <td className="px-5 py-3.5 text-center">
                  <span className="inline-block bg-amber-50 text-amber-700 text-xs font-semibold px-2.5 py-1 rounded-full">
                    {r.pricingIssues + r.inconsistencies + r.suspiciousEntries} issues
                  </span>
                </td>
                <td className="px-5 py-3.5 text-center text-sm text-gray-500">{r.mostAffectedCategory}</td>
                <td className="px-5 py-3.5 text-right font-bold text-red-600 text-sm">{formatEuro(r.totalLoss)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
