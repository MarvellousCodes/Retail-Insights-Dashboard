import { useState, useEffect, useCallback } from "react";
import { apiCall, API_BASE } from "@/lib/api";
import { Receipt, ShoppingBasket, Euro, Coins, Download, Layers } from "lucide-react";
import { useRevenueMask, RevenueMaskToggle, STARS } from "@/lib/privacy";

function money(v: number) {
  if (v >= 1_000_000) return "€" + (v / 1_000_000).toFixed(2) + "M";
  if (v >= 1_000) return "€" + (v / 1_000).toFixed(1) + "k";
  return "€" + Number(v).toFixed(0);
}

export function TransactionsPage() {
  const [data, setData] = useState<any>(null);
  const [depts, setDepts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [metric, setMetric] = useState<"count" | "value">("count");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const { masked, toggle } = useRevenueMask();

  const load = useCallback((f?: string, t?: string, first = false) => {
    setLoading(true);
    apiCall(`/api/transactions/summary?from=${f || ""}&to=${t || ""}`).then((d) => {
      setData(d);
      const ef = first ? (d.date_min || "") : (f || "");
      const et = first ? (d.date_max || "") : (t || "");
      if (first) { setFrom(ef); setTo(et); }
      apiCall(`/api/transactions/by-department?from=${ef}&to=${et}`).then((dd) => setDepts(dd.departments || []));
      setLoading(false);
    });
  }, []);

  useEffect(() => { load("", "", true); }, [load]);

  if (loading && !data) return <div className="p-8 text-center text-gray-400">Loading transactions...</div>;

  const byDay = data?.byDay || [];
  const byHour = (data?.byHour || []).filter((h: any) => h.count > 0);
  const maxDay = Math.max(...byDay.map((d: any) => d[metric]), 1);
  const maxHour = Math.max(...byHour.map((h: any) => h[metric]), 1);
  const fmt = (v: number) => masked ? STARS : (metric === "value" ? money(v) : v.toLocaleString());
  const maxDeptVal = Math.max(...depts.map((d) => d.value), 1);
  const exportUrl = `${API_BASE}/api/export/transactions?from=${from}&to=${to}`;

  return (
    <div className="p-4 md:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3 mb-1">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">Transactions</h1>
          <p className="text-xs text-gray-500">Basket size, busiest times, and sales volume by department</p>
        </div>
        <RevenueMaskToggle masked={masked} toggle={toggle} />
      </div>

      {/* date range + export */}
      <div className="flex flex-wrap items-end gap-3 my-4 p-3 bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700">
        <div>
          <label className="block text-[11px] font-semibold text-gray-500 mb-1">From</label>
          <input type="date" value={from} min={data?.date_min || undefined} max={data?.date_max || undefined}
            onChange={(e) => setFrom(e.target.value)}
            className="text-sm px-2.5 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100" />
        </div>
        <div>
          <label className="block text-[11px] font-semibold text-gray-500 mb-1">To</label>
          <input type="date" value={to} min={data?.date_min || undefined} max={data?.date_max || undefined}
            onChange={(e) => setTo(e.target.value)}
            className="text-sm px-2.5 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100" />
        </div>
        <button onClick={() => load(from, to)}
          className="bg-violet-600 hover:bg-violet-700 text-white text-sm font-bold px-4 py-2 rounded-lg">Apply</button>
        <a href={exportUrl}
          className="inline-flex items-center gap-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 text-sm font-bold px-4 py-2 rounded-lg hover:bg-gray-50">
          <Download className="w-4 h-4" /> Export CSV
        </a>
        {data?.date_min && <span className="text-[11px] text-gray-400 ml-auto self-center">Data covers {data.date_min} to {data.date_max}</span>}
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-3 border border-gray-200 dark:border-gray-700 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-violet-100 dark:bg-violet-900/40 flex items-center justify-center"><Receipt className="w-4 h-4 text-violet-600" /></div>
          <div><p className="text-xl font-bold text-gray-900 dark:text-white">{masked ? STARS : (data?.count || 0).toLocaleString()}</p><p className="text-[11px] text-gray-500">Transactions</p></div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-3 border border-gray-200 dark:border-gray-700 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center"><Coins className="w-4 h-4 text-emerald-600" /></div>
          <div><p className="text-xl font-bold text-gray-900 dark:text-white">{masked ? STARS : money(data?.total_value || 0)}</p><p className="text-[11px] text-gray-500">Total value</p></div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-3 border border-gray-200 dark:border-gray-700 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-green-100 dark:bg-green-900/40 flex items-center justify-center"><ShoppingBasket className="w-4 h-4 text-green-600" /></div>
          <div><p className="text-xl font-bold text-gray-900 dark:text-white">{masked ? STARS : (data?.avg_basket ?? 0)}</p><p className="text-[11px] text-gray-500">Avg items / sale</p></div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-3 border border-gray-200 dark:border-gray-700 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center"><Euro className="w-4 h-4 text-amber-600" /></div>
          <div><p className="text-xl font-bold text-gray-900 dark:text-white">{masked ? STARS : `€${data?.avg_value ?? 0}`}</p><p className="text-[11px] text-gray-500">Avg basket value</p></div>
        </div>
      </div>

      {/* metric toggle */}
      <div className="flex gap-2 mb-3">
        <button onClick={() => setMetric("count")} className={`px-3 py-1.5 rounded-lg text-xs font-medium ${metric === "count" ? "bg-violet-600 text-white" : "bg-white dark:bg-gray-800 text-gray-600 border border-gray-200 dark:border-gray-700"}`}>By number of sales</button>
        <button onClick={() => setMetric("value")} className={`px-3 py-1.5 rounded-lg text-xs font-medium ${metric === "value" ? "bg-violet-600 text-white" : "bg-white dark:bg-gray-800 text-gray-600 border border-gray-200 dark:border-gray-700"}`}>By value</button>
      </div>

      <div className="grid md:grid-cols-2 gap-4 mb-4">
        {/* By day of week */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700">
          <h2 className="font-semibold text-sm text-gray-900 dark:text-white mb-3">By day of week</h2>
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
          <h2 className="font-semibold text-sm text-gray-900 dark:text-white mb-3">By hour of day</h2>
          <div className="flex gap-0.5 items-end" style={{ height: "128px" }}>
            {byHour.map((h: any, i: number) => {
              const barH = Math.max(3, Math.round((h[metric] / maxHour) * 108));
              return (
                <div key={i} className="flex-1 flex flex-col justify-end items-center group relative h-full">
                  <div className="absolute -top-5 text-[9px] text-gray-500 opacity-0 group-hover:opacity-100 whitespace-nowrap z-10">{h.hour}:00 · {fmt(h[metric])}</div>
                  <div className="w-full rounded-t bg-fuchsia-500" style={{ height: `${barH}px` }}></div>
                  <span className="text-[8px] text-gray-400 mt-0.5 shrink-0">{h.hour}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Volume by department */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700">
        <h2 className="font-semibold text-sm text-gray-900 dark:text-white mb-1 flex items-center gap-2"><Layers className="w-4 h-4 text-violet-600" /> Volume by department</h2>
        <p className="text-[11px] text-gray-400 mb-3">Sales value and units per department for the selected dates. Transactions are basket level, so this is sales volume by department, not a transaction count per department.</p>
        <div className="space-y-2">
          {depts.slice(0, 14).map((d, i) => (
            <div key={i} className="flex items-center gap-3 text-sm">
              <span className="w-36 shrink-0 truncate text-gray-700 dark:text-gray-200">{d.name}</span>
              <span className="flex-1 h-2.5 rounded-full bg-gray-100 dark:bg-gray-700 overflow-hidden">
                <span className="block h-full rounded-full bg-violet-500" style={{ width: `${Math.round((d.value / maxDeptVal) * 100)}%` }}></span>
              </span>
              <span className="w-20 text-right tabular-nums text-gray-700 dark:text-gray-200 font-medium">{masked ? STARS : money(d.value)}</span>
              <span className="w-24 text-right tabular-nums text-gray-400 text-xs hidden sm:inline">{masked ? STARS : `${d.qty.toLocaleString()} units`}</span>
            </div>
          ))}
          {depts.length === 0 && <p className="text-sm text-gray-400">No department volume available.</p>}
        </div>
      </div>
    </div>
  );
}
