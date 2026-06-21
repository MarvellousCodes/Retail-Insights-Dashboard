import { useState, useEffect } from "react";
import { apiCall } from "@/lib/api";

export function DashboardInsights() {
  const [stats, setStats] = useState<any>({});
  const [margins, setMargins] = useState<any>({});
  const [sales, setSales] = useState<any>({});
  const [trans, setTrans] = useState<any>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      apiCall("/api/stats"),
      apiCall("/api/insights/margins"),
      apiCall("/api/insights/sales"),
      apiCall("/api/insights/transactions"),
    ]).then(([s, m, sl, t]) => {
      setStats(s); setMargins(m); setSales(sl); setTrans(t); setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-8 text-center text-gray-400">Loading insights...</div>;

  const latestMonth = sales.monthly?.[sales.monthly.length - 1];

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Store Overview</h1>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card label="Products" value={(stats.stock||0).toLocaleString()} />
        <Card label="Transactions" value={(stats.transactions||0).toLocaleString()} />
        <Card label="Turnover Records" value={(stats.turnover||0).toLocaleString()} />
        <Card label="Avg Basket" value={`${trans.avg_basket||0} items`} />
        <Card label="Avg Sale" value={`€${trans.avg_value||0}`} />
      </div>

      {/* Monthly Revenue */}
      {latestMonth && (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <h2 className="font-semibold text-gray-900 dark:text-white mb-4">Monthly Revenue (Last 12 Months)</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div><p className="text-xs text-gray-500">Latest Period</p><p className="text-lg font-bold text-violet-600">{latestMonth.period}</p></div>
            <div><p className="text-xs text-gray-500">Revenue</p><p className="text-lg font-bold text-green-600">€{latestMonth.revenue?.toLocaleString()}</p></div>
            <div><p className="text-xs text-gray-500">Profit</p><p className="text-lg font-bold text-emerald-600">€{latestMonth.profit?.toLocaleString()}</p></div>
            <div><p className="text-xs text-gray-500">Items Sold</p><p className="text-lg font-bold text-violet-600">{latestMonth.qty?.toLocaleString()}</p></div>
          </div>
          <div className="flex gap-1 items-end" style={{height: '128px'}}>
            {sales.monthly?.slice(-12).map((m: any, i: number) => {
              const maxR = Math.max(...sales.monthly.slice(-12).map((x:any)=>x.revenue));
              const barH = Math.max(4, Math.round((m.revenue / maxR) * 112));
              return (
              <div key={i} className="flex-1 flex flex-col justify-end items-center h-full">
                <div className="w-full bg-violet-500 rounded-t" style={{height: `${barH}px`}}></div>
                <span className="text-[9px] text-gray-400 mt-1 shrink-0">{m.period.slice(4)}</span>
              </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Margins */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <h2 className="font-semibold text-green-700 dark:text-green-400 mb-3">Highest Margins</h2>
          <div className="space-y-2 text-sm">
            {margins.high_margin?.slice(0,7).map((p:any,i:number) => (
              <div key={i} className="flex justify-between">
                <span className="text-gray-700 dark:text-gray-300 truncate max-w-[200px]">{p.desc}</span>
                <span className="text-green-600 font-medium">{p.margin}%</span>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <h2 className="font-semibold text-red-700 dark:text-red-400 mb-3">Lowest Margins (Action Needed)</h2>
          <div className="space-y-2 text-sm">
            {margins.low_margin?.slice(0,7).map((p:any,i:number) => (
              <div key={i} className="flex justify-between">
                <span className="text-gray-700 dark:text-gray-300 truncate max-w-[200px]">{p.desc}</span>
                <span className="text-red-600 font-medium">{p.margin}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Cashier Performance */}
      {trans.top_cashiers && (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <h2 className="font-semibold text-gray-900 dark:text-white mb-3">Cashier Performance</h2>
          <div className="space-y-2 text-sm">
            {trans.top_cashiers.map((c:any,i:number) => (
              <div key={i} className="flex justify-between items-center">
                <span className="text-gray-700 dark:text-gray-300 font-medium">{c.code}</span>
                <div className="flex gap-4">
                  <span className="text-gray-500">{c.sales} sales</span>
                  <span className="text-violet-600 font-medium">€{c.value.toLocaleString(undefined,{maximumFractionDigits:0})}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Data Pipeline moved to Settings (F7) */}
    </div>
  );
}

function Card({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700">
      <p className="text-2xl font-bold text-violet-600">{value}</p>
      <p className="text-xs text-gray-500">{label}</p>
    </div>
  );
}
