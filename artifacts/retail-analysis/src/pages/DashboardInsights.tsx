import { useState, useEffect } from "react";
import { apiCall } from "@/lib/api";
import { useRevenueMask, RevenueMaskToggle, STARS } from "@/lib/privacy";
import { ArrowRight, TrendingUp, TrendingDown, Lightbulb } from "lucide-react";
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

const PIE_COLORS = ["#7c3aed","#2563eb","#0891b2","#059669","#d97706","#db2777","#64748b","#9333ea"];
const AXIS = "#94a3b8";

export function DashboardInsights({ onNavigate }: Props) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
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

  const trend = (data.sales_trend || []).map((t: any) => ({ ...t, label: fmtPeriod(t.period).slice(0, 3) }));
  const tpItems = (tpm.items || []);

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

        {/* Row A: 12-month trend + yesterday in detail */}
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
        </div>

        {/* Row B: Top products (newest available period) + what-if smart insight */}
        {tpItems.length > 0 && (
          <div className={`${card} p-5`}>
            <div className="flex items-start justify-between mb-3">
              <div>
                <h2 className="text-sm font-black text-gray-900 dark:text-white">Top products</h2>
                <p className="text-xs text-gray-400">Best sellers, {fmtPeriod(tpm.period)} (newest available; product sales arrive monthly)</p>
              </div>
              <button onClick={() => onNavigate?.("turnover")} className="text-violet-600 dark:text-violet-400 hover:text-violet-700"><ArrowRight className="w-4 h-4" /></button>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {/* Bar: sales value */}
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={tpItems.map((p: any) => ({ name: (p.name || "").slice(0, 22), value: p.value }))} layout="vertical" margin={{ left: 10 }}>
                  <XAxis type="number" tickFormatter={(v) => (masked ? "" : eurShort(v))} tick={{ fontSize: 11, fill: AXIS }} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="name" width={150} tick={{ fontSize: 10, fill: AXIS }} axisLine={false} tickLine={false} />
                  <Tooltip formatter={moneyTip} cursor={{ fill: "rgba(37,99,235,0.08)" }} />
                  <Bar dataKey="value" fill="#2563eb" radius={[0,4,4,0]} cursor="pointer" onClick={() => onNavigate?.("turnover")} />
                </BarChart>
              </ResponsiveContainer>
              {/* Pie: share of top sellers */}
              <div>
                <ResponsiveContainer width="100%" height={240}>
                  <PieChart>
                    <Pie data={tpItems.map((p: any) => ({ name: (p.name || "").slice(0, 18), value: p.value }))} dataKey="value" nameKey="name" innerRadius={45} outerRadius={85} paddingAngle={2}>
                      {tpItems.map((_: any, i: number) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                    </Pie>
                    <Tooltip formatter={moneyTip} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex flex-wrap gap-x-3 gap-y-1 justify-center mt-1">
                  {tpItems.map((p: any, i: number) => (
                    <span key={i} className="flex items-center gap-1 text-[10px] text-gray-500 dark:text-gray-400">
                      <span className="w-2 h-2 rounded-full" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />{(p.name || "").slice(0, 16)}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* What-if smart insight */}
            <div className="mt-4 rounded-xl p-4 bg-violet-50 dark:bg-violet-900/15 border border-violet-200 dark:border-violet-800">
              <p className="text-[11px] font-bold uppercase tracking-wide text-violet-700 dark:text-violet-300 mb-1 flex items-center gap-1.5">
                <Lightbulb className="w-3.5 h-3.5" /> Smart insight · what could have happened
              </p>
              {tpm.whatif_total > 0 ? (
                <p className="text-sm text-gray-700 dark:text-gray-200 leading-relaxed">
                  Your top {tpItems.length} products took <b>{M(tpm.total_value || 0)}</b> in {fmtPeriod(tpm.period)}. <b>{tpm.below_target}</b> of them are selling below their department's target margin, so if you had repriced those to target you would have kept an extra <b className="text-violet-700 dark:text-violet-300">{M(tpm.whatif_total)}</b> that month, roughly <b>{M((tpm.whatif_total || 0) * 12)}</b> a year.{" "}
                  <button onClick={() => onNavigate?.("issues")} className="text-violet-700 dark:text-violet-300 underline font-semibold">Review these prices</button>
                </p>
              ) : (
                <p className="text-sm text-gray-700 dark:text-gray-200 leading-relaxed">
                  Your top {tpItems.length} products took <b>{M(tpm.total_value || 0)}</b> in {fmtPeriod(tpm.period)}, and they are all at or above their department targets. These best sellers are pulling their weight, nothing to reprice here.
                </p>
              )}
            </div>
          </div>
        )}
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
