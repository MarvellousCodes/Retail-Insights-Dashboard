import { useState, useEffect } from "react";
import { apiCall } from "@/lib/api";
import { useRevenueMask, RevenueMaskToggle, STARS } from "@/lib/privacy";
import { ArrowRight, TrendingUp, TrendingDown } from "lucide-react";
import type { NavTab } from "@/App";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid,
  Cell, PieChart, Pie,
} from "recharts";

interface Props { onNavigate?: (tab: NavTab) => void; }

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const DOW = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
const fmtPeriod = (p?: string) => (p && p.length === 6) ? `${MONTHS[parseInt(p.slice(4,6),10)-1]} ${p.slice(0,4)}` : (p || "");

function eurShort(n: number) {
  const a = Math.abs(n || 0);
  if (a >= 1e6) return "€" + (n / 1e6).toFixed(a >= 1e7 ? 0 : 1) + "M";
  if (a >= 1e3) return "€" + (n / 1e3).toFixed(a >= 1e4 ? 0 : 1) + "k";
  return "€" + Math.round(n || 0).toLocaleString();
}
function numShort(n: number) {
  const a = Math.abs(n || 0);
  if (a >= 1e6) return (n / 1e6).toFixed(1) + "M";
  if (a >= 1e3) return (n / 1e3).toFixed(1) + "k";
  return Math.round(n || 0).toLocaleString();
}

const PIE_COLORS = ["#7c3aed","#2563eb","#0891b2","#059669","#d97706","#db2777","#64748b"];
const AXIS = "#94a3b8";

export function DashboardInsights({ onNavigate }: Props) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [shopOnly, setShopOnly] = useState(false);
  const { masked, toggle } = useRevenueMask();
  const M = (n: number) => (masked ? STARS : eurShort(n));

  useEffect(() => {
    setLoading(true);
    apiCall("/api/dashboard/overview")
      .then((d) => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading && !data) return <div className="p-8 text-center text-gray-400">Loading your shop…</div>;
  if (!data || data.error) return <div className="p-8 text-center text-gray-400">No data available yet.</div>;

  const ld = data.latest_day || {};
  const yd = data.yesterday_detail || {};
  const tpm = data.top_products_month || {};
  const tm = data.this_month || {};
  const am = data.avg_margin || {};
  const risk = data.margin_at_risk || {};
  const counts = data.counts || {};
  const mh = data.margin_health || {};

  const trend = (data.sales_trend || []).map((t: any) => ({ ...t, label: fmtPeriod(t.period).slice(0, 3) }));
  const deptAll = data.revenue_by_dept || [];
  const deptsFiltered = shopOnly ? deptAll.filter((d: any) => !d.nonrepriceable) : deptAll;
  const top6 = deptsFiltered.slice(0, 6);
  const otherVal = deptsFiltered.slice(6).reduce((s: number, d: any) => s + d.value, 0);
  const pieData = [...top6.map((d: any) => ({ name: d.name, value: d.value })), ...(otherVal > 0 ? [{ name: "Other", value: otherVal }] : [])];
  const topDepts = deptsFiltered.slice(0, 8).map((d: any) => ({ name: d.name, value: d.value }));
  const topProducts = (data.top_products || []).map((p: any) => ({ name: p.name, units: p.units, revenue: p.revenue }));
  const dow = (data.by_dow || []).map((r: any) => ({ name: DOW[r.dow] ?? r.dow, value: r.value }));
  const hours = (data.by_hour || []).map((r: any) => ({ name: `${r.hour}`, value: r.value }));
  const health = [
    { name: "Healthy", value: mh.healthy || 0, color: "#059669" },
    { name: "Low margin", value: mh.low || 0, color: "#d97706" },
    { name: "Below cost", value: mh.below_cost || 0, color: "#dc2626" },
    { name: "Not set up", value: mh.missing_price || 0, color: "#94a3b8" },
  ].filter((s) => s.value > 0);

  const moneyTip = (v: any) => (masked ? STARS : eurShort(Number(v)));
  const card = "bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm";

  return (
    <div className="min-h-full bg-gray-50 dark:bg-gray-900 fade-up">
      <div className="px-6 py-6 max-w-[1280px] mx-auto space-y-5">

        {/* Header */}
        <div className="flex items-end justify-between flex-wrap gap-3">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Overview</p>
            <h1 className="text-2xl font-black text-gray-900 dark:text-white">Your shop at a glance</h1>
            <p className="text-xs text-gray-400 mt-0.5">Latest data: {fmtPeriod(tm.period)} · newest trading day {ld.date || "n/a"}</p>
          </div>
          <RevenueMaskToggle masked={masked} toggle={toggle} />
        </div>

        {/* KPI cards */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <Kpi onClick={() => onNavigate?.("transactions")} top="violet" label="Latest day sales"
               value={M(ld.value)} sub={ld.vs_weekday_avg_pct == null ? `${Math.round(ld.items||0)} items` : `${ld.vs_weekday_avg_pct > 0 ? "+" : ""}${ld.vs_weekday_avg_pct}% vs usual ${DOW[new Date(ld.date).getDay() === 0 ? 6 : new Date(ld.date).getDay()-1] || ""}`}
               subGood={(ld.vs_weekday_avg_pct||0) >= 0} />
          <Kpi onClick={() => onNavigate?.("turnover")} top="blue" label="This month"
               value={M(tm.value)} sub={tm.pct == null ? "" : `${tm.pct > 0 ? "+" : ""}${tm.pct}% vs last month`} subGood={(tm.pct||0) >= 0} />
          <Kpi onClick={() => onNavigate?.("margins")} top="green" label="Avg margin"
               value={am.pct == null ? "n/a" : `${am.pct}%`} sub={`target ${am.target}%`} subGood={(am.pct||0) >= (am.target||30)} />
          <Kpi onClick={() => onNavigate?.("issues")} top="red" label="Margin at risk"
               value={M(risk.euro)} sub={`${risk.products_below||0} lines below target`} subGood={false} />
          <Kpi onClick={() => onNavigate?.("reports")} top="gray" label="Active products"
               value={(counts.active_products||0).toLocaleString()} sub="in your range" />
        </div>

        {/* Row 2: trend + revenue mix */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className={`${card} lg:col-span-2 p-5`}>
            <h2 className="text-sm font-black text-gray-900 dark:text-white mb-1">Sales, last 12 months</h2>
            <p className="text-xs text-gray-400 mb-3">Click a month to open transactions</p>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={trend} onClick={() => onNavigate?.("turnover")}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: AXIS }} axisLine={false} tickLine={false} />
                <YAxis tickFormatter={(v) => (masked ? "" : eurShort(v))} tick={{ fontSize: 11, fill: AXIS }} axisLine={false} tickLine={false} width={48} />
                <Tooltip formatter={moneyTip} cursor={{ fill: "rgba(124,58,237,0.08)" }} />
                <Bar dataKey="value" fill="#7c3aed" radius={[4,4,0,0]} cursor="pointer" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className={`${card} p-5`}>
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-sm font-black text-gray-900 dark:text-white">Revenue mix</h2>
              <label className="flex items-center gap-1.5 text-[11px] text-gray-500 dark:text-gray-400 cursor-pointer">
                <input type="checkbox" checked={shopOnly} onChange={(e) => setShopOnly(e.target.checked)} className="accent-violet-600" />
                Shop only
              </label>
            </div>
            <p className="text-xs text-gray-400 mb-2">{shopOnly ? "Excludes fuel, vouchers, lottery" : "All departments"}</p>
            <ResponsiveContainer width="100%" height={210}>
              <PieChart>
                <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={45} outerRadius={80} paddingAngle={2}
                     onClick={() => onNavigate?.("departments")} cursor="pointer">
                  {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={moneyTip} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1">
              {pieData.map((d: any, i: number) => (
                <span key={i} className="flex items-center gap-1 text-[11px] text-gray-500 dark:text-gray-400">
                  <span className="w-2 h-2 rounded-full" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />{d.name}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Row 3: yesterday in detail + top products this month */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <ChartCard title="Yesterday in detail" note={yd.date ? `Newest trading day, ${yd.date}` : "Newest trading day"} onGo={() => onNavigate?.("transactions")}>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div className="rounded-xl border border-gray-100 dark:border-gray-700 p-3">
                <p className="text-[10px] uppercase tracking-wide text-gray-400">Takings</p>
                <p className="text-xl font-black text-gray-900 dark:text-white">{M(yd.total || 0)}</p>
                <p className="text-[11px] text-gray-400">{Math.round(yd.items || 0)} items sold</p>
              </div>
              <div className="rounded-xl border border-gray-100 dark:border-gray-700 p-3">
                <p className="text-[10px] uppercase tracking-wide text-gray-400">Busiest hour</p>
                <p className="text-xl font-black text-gray-900 dark:text-white">{yd.busiest_hour != null ? `${yd.busiest_hour}:00` : "n/a"}</p>
                <p className="text-[11px] text-gray-400">{yd.busiest_hour_value != null ? `${M(yd.busiest_hour_value)} in that hour` : ""}</p>
              </div>
            </div>
            <div className={`rounded-xl p-3 text-sm ${(yd.vs_last_year_pct || 0) >= 0 ? "bg-green-50 dark:bg-green-900/15 text-green-700 dark:text-green-400" : "bg-red-50 dark:bg-red-900/15 text-red-700 dark:text-red-400"}`}>
              {yd.vs_last_year_pct == null
                ? "No matching day last year to compare against."
                : <>Same day last year: {M(yd.last_year_total || 0)}. Yesterday was <b>{yd.vs_last_year_pct > 0 ? "+" : ""}{yd.vs_last_year_pct}%</b> {yd.vs_last_year_pct >= 0 ? "ahead" : "behind"}.</>}
            </div>
          </ChartCard>
          <ChartCard title="Top products" note={tpm.period ? `By sales value, ${fmtPeriod(tpm.period)} (product sales arrive monthly)` : "By sales value, latest month"} onGo={() => onNavigate?.("turnover")}>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={(tpm.items || []).map((p: any) => ({ name: p.name.slice(0, 22), value: p.value }))} layout="vertical" margin={{ left: 10 }}>
                <XAxis type="number" tickFormatter={(v) => (masked ? "" : eurShort(v))} tick={{ fontSize: 11, fill: AXIS }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" width={150} tick={{ fontSize: 10, fill: AXIS }} axisLine={false} tickLine={false} />
                <Tooltip formatter={moneyTip} cursor={{ fill: "rgba(37,99,235,0.08)" }} />
                <Bar dataKey="value" fill="#2563eb" radius={[0,4,4,0]} cursor="pointer" onClick={() => onNavigate?.("turnover")} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        {/* Row 4: day of week + hour + margin health */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <ChartCard title="Sales by day" note="Busiest trading days" onGo={() => onNavigate?.("transactions")}>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={dow}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: AXIS }} axisLine={false} tickLine={false} />
                <YAxis tickFormatter={(v) => (masked ? "" : eurShort(v))} tick={{ fontSize: 10, fill: AXIS }} axisLine={false} tickLine={false} width={44} />
                <Tooltip formatter={moneyTip} cursor={{ fill: "rgba(124,58,237,0.08)" }} />
                <Bar dataKey="value" fill="#7c3aed" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
          <ChartCard title="Sales by hour" note="Busiest times of day" onGo={() => onNavigate?.("transactions")}>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={hours}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 9, fill: AXIS }} interval={2} axisLine={false} tickLine={false} />
                <YAxis tickFormatter={(v) => (masked ? "" : eurShort(v))} tick={{ fontSize: 10, fill: AXIS }} axisLine={false} tickLine={false} width={44} />
                <Tooltip formatter={moneyTip} cursor={{ fill: "rgba(8,145,178,0.08)" }} />
                <Bar dataKey="value" fill="#0891b2" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
          <ChartCard title="Margin health" note="Click to review issues" onGo={() => onNavigate?.("issues")}>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={health} dataKey="value" nameKey="name" innerRadius={40} outerRadius={75} paddingAngle={2}
                     onClick={() => onNavigate?.("issues")} cursor="pointer">
                  {health.map((s, i) => <Cell key={i} fill={s.color} />)}
                </Pie>
                <Tooltip formatter={(v: any) => `${v} products`} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-wrap gap-x-3 gap-y-1">
              {health.map((s, i) => (
                <span key={i} className="flex items-center gap-1 text-[11px] text-gray-500 dark:text-gray-400">
                  <span className="w-2 h-2 rounded-full" style={{ background: s.color }} />{s.name} ({s.value})
                </span>
              ))}
            </div>
          </ChartCard>
        </div>
      </div>
    </div>
  );
}

function Kpi({ onClick, top, label, value, sub, subGood }:
  { onClick?: () => void; top: "red"|"violet"|"amber"|"gray"|"blue"|"green"; label: string; value: string; sub: string; subGood?: boolean }) {
  const topCls = { red:"border-t-red-500", violet:"border-t-violet-500", amber:"border-t-amber-500", gray:"border-t-gray-400", blue:"border-t-blue-500", green:"border-t-green-500" }[top];
  return (
    <button onClick={onClick} className={`text-left bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 border-t-4 ${topCls} shadow-sm p-4 hover:shadow-md hover:-translate-y-0.5 transition-all`}>
      <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">{label}</p>
      <p className="text-2xl font-black mt-1 text-gray-900 dark:text-white">{value}</p>
      {sub && (
        <p className={`text-xs mt-0.5 flex items-center gap-1 ${subGood === undefined ? "text-gray-400" : subGood ? "text-green-600 dark:text-green-400" : "text-red-500 dark:text-red-400"}`}>
          {subGood !== undefined && (subGood ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />)}{sub}
        </p>
      )}
    </button>
  );
}

function ChartCard({ title, note, onGo, children }:
  { title: string; note: string; onGo?: () => void; children: React.ReactNode }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm p-5">
      <div className="flex items-start justify-between mb-2">
        <div>
          <h2 className="text-sm font-black text-gray-900 dark:text-white">{title}</h2>
          <p className="text-xs text-gray-400">{note}</p>
        </div>
        {onGo && <button onClick={onGo} className="text-violet-600 dark:text-violet-400 hover:text-violet-700"><ArrowRight className="w-4 h-4" /></button>}
      </div>
      {children}
    </div>
  );
}
