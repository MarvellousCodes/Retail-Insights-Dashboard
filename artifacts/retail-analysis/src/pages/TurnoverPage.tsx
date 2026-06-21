import { useState, useEffect } from "react";
import { apiCall } from "@/lib/api";
import { TrendingUp, Package } from "lucide-react";

function eur(v: number | null) { return v === null || v === undefined ? "—" : `€${Number(v).toFixed(2)}`; }
function marginCls(m: number | null) {
  if (m === null || m === undefined) return "bg-gray-50 text-gray-500";
  return m >= 25 ? "bg-green-50 text-green-700" : m >= 10 ? "bg-amber-50 text-amber-700" : "bg-red-50 text-red-700";
}

function PerfTable({ rows, metric }: { rows: any[]; metric: "revenue" | "qty" }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-violet-50 dark:bg-violet-900/20">
          <tr>
            <th className="px-3 py-2.5 text-left text-xs font-semibold text-violet-700">#</th>
            <th className="px-3 py-2.5 text-left text-xs font-semibold text-violet-700">Product</th>
            <th className="px-3 py-2.5 text-right text-xs font-semibold text-violet-700">Units (12mo)</th>
            <th className="px-3 py-2.5 text-right text-xs font-semibold text-violet-700">Revenue (12mo)</th>
            <th className="px-3 py-2.5 text-center text-xs font-semibold text-violet-700">Margin</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
          {rows.map((p, i) => (
            <tr key={i} className="hover:bg-violet-50/40">
              <td className="px-3 py-2 text-gray-400 text-xs">{i + 1}</td>
              <td className="px-3 py-2 text-gray-800 dark:text-gray-200 truncate max-w-[220px]">{p.name}</td>
              <td className={`px-3 py-2 text-right ${metric === "qty" ? "font-semibold text-violet-600" : "text-gray-500"}`}>{p.qty.toLocaleString()}</td>
              <td className={`px-3 py-2 text-right ${metric === "revenue" ? "font-semibold text-violet-600" : "text-gray-500"}`}>{eur(p.revenue)}</td>
              <td className="px-3 py-2 text-center"><span className={`px-2 py-0.5 rounded-full text-xs font-bold ${marginCls(p.margin)}`}>{p.margin === null ? "—" : p.margin + "%"}</span></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function TurnoverPage() {
  const [data, setData] = useState<any>({ top_value: [], top_volume: [] });
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"revenue" | "volume">("revenue");

  useEffect(() => {
    apiCall("/api/performance").then((d) => { setData(d || {}); setLoading(false); });
  }, []);

  if (loading) return <div className="p-8 text-center text-gray-400">Loading product performance...</div>;

  return (
    <div className="p-4 md:p-6">
      <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">Sales — Product Performance</h1>
      <p className="text-xs text-gray-500 mb-4">Best sellers over the last 12 months — by revenue and by units sold</p>

      <div className="flex gap-2 mb-4">
        <button onClick={() => setTab("revenue")} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium ${tab === "revenue" ? "bg-violet-600 text-white" : "bg-white dark:bg-gray-800 text-gray-600 border border-gray-200 dark:border-gray-700"}`}><TrendingUp className="w-3.5 h-3.5" /> Top by Revenue</button>
        <button onClick={() => setTab("volume")} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium ${tab === "volume" ? "bg-violet-600 text-white" : "bg-white dark:bg-gray-800 text-gray-600 border border-gray-200 dark:border-gray-700"}`}><Package className="w-3.5 h-3.5" /> Top by Units</button>
      </div>

      {tab === "revenue"
        ? <PerfTable rows={data.top_value || []} metric="revenue" />
        : <PerfTable rows={data.top_volume || []} metric="qty" />}

      <p className="text-xs text-gray-400 mt-3 text-center">Top 15 active products. Revenue & units summed from the last 12 months of turnover data.</p>
    </div>
  );
}
