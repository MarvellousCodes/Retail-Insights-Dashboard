import { useState, useEffect } from "react";
import { apiCall } from "@/lib/api";
import { Receipt, ShoppingBasket, Euro } from "lucide-react";

export function TransactionsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [metric, setMetric] = useState<"count" | "value">("count");

  useEffect(() => {
    apiCall("/api/trading-patterns").then((d) => { setData(d); setLoading(false); });
  }, []);

  if (loading) return <div className="p-8 text-center text-gray-400">Loading trading patterns...</div>;

  const byDay = data?.byDay || [];
  const byHour = (data?.byHour || []).filter((h: any) => h.count > 0);
  const maxDay = Math.max(...byDay.map((d: any) => d[metric]), 1);
  const maxHour = Math.max(...byHour.map((h: any) => h[metric]), 1);
  const fmt = (v: number) => metric === "value" ? `€${(v / 1000).toFixed(0)}K` : v.toLocaleString();

  return (
    <div className="p-4 md:p-6">
      <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">Transactions — Trading Patterns</h1>
      <p className="text-xs text-gray-500 mb-4">When your store is busiest — sales by day of week and hour</p>

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-3 border border-gray-200 dark:border-gray-700 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-violet-100 flex items-center justify-center"><Receipt className="w-4 h-4 text-violet-600" /></div>
          <div><p className="text-xl font-bold text-gray-900 dark:text-white">{data.count.toLocaleString()}</p><p className="text-[11px] text-gray-500">Transactions</p></div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-3 border border-gray-200 dark:border-gray-700 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-green-100 flex items-center justify-center"><ShoppingBasket className="w-4 h-4 text-green-600" /></div>
          <div><p className="text-xl font-bold text-gray-900 dark:text-white">{data.avg_basket}</p><p className="text-[11px] text-gray-500">Avg items / sale</p></div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-3 border border-gray-200 dark:border-gray-700 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-amber-100 flex items-center justify-center"><Euro className="w-4 h-4 text-amber-600" /></div>
          <div><p className="text-xl font-bold text-gray-900 dark:text-white">€{data.avg_value}</p><p className="text-[11px] text-gray-500">Avg basket value</p></div>
        </div>
      </div>

      {/* metric toggle */}
      <div className="flex gap-2 mb-3">
        <button onClick={() => setMetric("count")} className={`px-3 py-1.5 rounded-lg text-xs font-medium ${metric === "count" ? "bg-violet-600 text-white" : "bg-white dark:bg-gray-800 text-gray-600 border border-gray-200 dark:border-gray-700"}`}>By # sales</button>
        <button onClick={() => setMetric("value")} className={`px-3 py-1.5 rounded-lg text-xs font-medium ${metric === "value" ? "bg-violet-600 text-white" : "bg-white dark:bg-gray-800 text-gray-600 border border-gray-200 dark:border-gray-700"}`}>By € value</button>
      </div>

      {/* By day of week */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700 mb-4">
        <h2 className="font-semibold text-sm text-gray-900 dark:text-white mb-3">By Day of Week</h2>
        <div className="flex gap-2 items-end" style={{ height: "128px" }}>
          {byDay.map((d: any, i: number) => {
            const barH = Math.max(4, Math.round((d[metric] / maxDay) * 108));
            return (
              <div key={i} className="flex-1 flex flex-col justify-end items-center group relative h-full">
                <div className="absolute -top-5 text-[9px] text-gray-500 opacity-0 group-hover:opacity-100 whitespace-nowrap">{fmt(d[metric])}</div>
                <div className="w-full rounded-t bg-violet-500" style={{ height: `${barH}px` }}></div>
                <span className="text-[10px] text-gray-500 mt-1 shrink-0">{d.day}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* By hour */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700">
        <h2 className="font-semibold text-sm text-gray-900 dark:text-white mb-3">By Hour of Day</h2>
        <div className="flex gap-0.5 items-end" style={{ height: "112px" }}>
          {byHour.map((h: any, i: number) => {
            const barH = Math.max(3, Math.round((h[metric] / maxHour) * 92));
            return (
              <div key={i} className="flex-1 flex flex-col justify-end items-center group relative h-full">
                <div className="absolute -top-5 text-[9px] text-gray-500 opacity-0 group-hover:opacity-100 whitespace-nowrap z-10">{h.hour}:00 · {fmt(h[metric])}</div>
                <div className="w-full rounded-t bg-fuchsia-500" style={{ height: `${barH}px` }}></div>
                <span className="text-[8px] text-gray-400 mt-0.5 shrink-0">{h.hour}</span>
              </div>
            );
          })}
        </div>
        <p className="text-[10px] text-gray-400 mt-2">Hour of day (24h)</p>
      </div>
    </div>
  );
}
