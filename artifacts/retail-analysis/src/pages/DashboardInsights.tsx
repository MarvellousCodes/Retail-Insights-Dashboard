import { useState, useEffect } from "react";
import { apiCall } from "@/lib/api";
import { ArrowRight } from "lucide-react";
import type { NavTab } from "@/App";

interface Props { onNavigate?: (tab: NavTab) => void; }

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const fmtPeriod = (p?: string) => (p && p.length === 6) ? `${MONTHS[parseInt(p.slice(4,6),10)-1]} ${p.slice(0,4)}` : (p || "");
const eur = (n: number) => "€" + Math.round(Math.abs(n || 0)).toLocaleString();

type Dept = { code:string; name:string; avg_margin:number; target:number; loss:number; below:number; trend:string|null; on_target:boolean };

function buildBanners(depts: Dept[]) {
  const out: { tone:"red"|"amber"|"green"; text:string }[] = [];
  const alerting = depts.filter(d => d.below > 0); // already sorted by loss desc
  if (alerting.length) {
    const w = alerting[0];
    out.push({ tone:"red", text:`${w.name} is your biggest leak this month, ${w.below} product${w.below>1?"s":""} below target costing ${eur(w.loss)}/mo (averaging ${w.avg_margin}% against a ${w.target}% target).` });
  }
  const worse = alerting.filter(d => d.trend === "worsening");
  if (worse.length) {
    const w = worse[0];
    out.push({ tone:"amber", text:`${w.name} is slipping versus last month, ${w.below} below target at ${eur(w.loss)}/mo. Worth a look before it grows.` });
  }
  const best = depts.filter(d => d.on_target).sort((a,b)=>b.avg_margin-a.avg_margin)[0];
  if (best) {
    out.push({ tone:"green", text:`${best.name} is your best performer at ${best.avg_margin}%, comfortably above its ${best.target}% target. Nothing to fix there.` });
  }
  return out;
}

export function DashboardInsights({ onNavigate }: Props) {
  const [sel, setSel] = useState<string | null>(null);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    apiCall(`/api/dashboard${sel ? `?period=${sel}` : ""}`)
      .then((d) => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [sel]);

  if (loading && !data) return <div className="p-8 text-center text-gray-400">Loading margin report…</div>;
  if (!data || data.error) return <div className="p-8 text-center text-gray-400">No margin data available yet.</div>;

  const k = data.kpi || {};
  const leaks: any[] = data.leakages || [];
  const depts: Dept[] = data.department_health || [];
  const period: string = data.period;
  const banners = buildBanners(depts);
  const delta = k.delta;
  const deltaText = delta == null ? "" :
    delta > 0.5 ? `${eur(delta)} better than ${fmtPeriod(data.prev_period)}` :
    delta < -0.5 ? `${eur(delta)} worse than ${fmtPeriod(data.prev_period)}` :
    `about the same as ${fmtPeriod(data.prev_period)}`;
  const deltaGood = delta != null && delta > 0.5;

  const toneCls = {
    red:   { wrap:"border-red-200 bg-red-50 dark:bg-red-950/30 dark:border-red-900", dot:"bg-red-500" },
    amber: { wrap:"border-amber-200 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-900", dot:"bg-amber-500" },
    green: { wrap:"border-green-200 bg-green-50 dark:bg-green-950/30 dark:border-green-900", dot:"bg-green-500" },
  };

  return (
    <div className="min-h-full bg-gray-50 dark:bg-gray-900 fade-up">
      <div className="px-6 py-6 max-w-[1280px] mx-auto space-y-5">

        {/* Header + month selector */}
        <div className="flex items-end justify-between flex-wrap gap-3">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Monthly margin report</p>
            <h1 className="text-2xl font-black text-gray-900 dark:text-white">{fmtPeriod(period)}</h1>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <span className="text-xs text-gray-400">Month</span>
            <select value={sel ?? period} onChange={(e)=>setSel(e.target.value)}
              className="text-sm font-semibold px-3 py-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-100 focus:outline-none focus:border-violet-400">
              {(data.periods||[]).map((p:string)=>(<option key={p} value={p}>{fmtPeriod(p)}</option>))}
            </select>
          </label>
        </div>

        {/* KPI cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Kpi top="red"   label="Monthly margin loss" value={`-${eur(k.margin_loss)}`} valueCls="text-red-600 dark:text-red-400"
               sub={deltaText} subCls={deltaGood?"text-green-600 dark:text-green-400":"text-red-500"} />
          <Kpi top="violet" label="Products below target" value={(k.products_below||0).toLocaleString()}
               sub="across all departments" />
          <Kpi top="amber" label="Departments with alerts" value={`${k.depts_with_alerts||0} of ${k.depts_total||0}`}
               sub="need attention" />
          <Kpi top="gray"  label="Projected annual loss" value={`-${eur(k.projected_annual_loss)}`} valueCls="text-gray-900 dark:text-white"
               sub="if no prices change" />
        </div>

        {/* Auto-generated insight banners */}
        {banners.length > 0 && (
          <div className="space-y-2">
            {banners.map((b,i)=>(
              <div key={i} className={`flex items-start gap-3 rounded-xl border px-4 py-3 ${toneCls[b.tone].wrap}`}>
                <span className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${toneCls[b.tone].dot}`} />
                <p className="text-sm text-gray-700 dark:text-gray-200">{b.text}</p>
              </div>
            ))}
          </div>
        )}
        {k.data_issues > 0 && (
          <p className="text-xs text-gray-400">{k.data_issues} product{k.data_issues>1?"s":""} excluded from this report as cost data to check (cost looks higher than price).</p>
        )}

        {/* Leakages + Department health */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Top margin leakages */}
          <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
            <div className="px-5 pt-5 pb-2">
              <h2 className="text-sm font-black text-gray-900 dark:text-white">Top margin leakages</h2>
              <p className="text-xs text-gray-400">Ranked by monthly revenue impact</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-[11px] uppercase tracking-wide text-gray-400 border-b border-gray-100 dark:border-gray-700">
                    <th className="text-left font-semibold pl-5 py-2 w-8">#</th>
                    <th className="text-left font-semibold py-2">Product</th>
                    <th className="text-left font-semibold py-2">Department</th>
                    <th className="text-left font-semibold py-2">Margin</th>
                    <th className="text-left font-semibold py-2">Target</th>
                    <th className="text-right font-semibold pr-5 py-2 text-red-500">Monthly loss</th>
                  </tr>
                </thead>
                <tbody>
                  {leaks.slice(0,12).map((l,i)=>(
                    <tr key={i} className="border-b border-gray-50 dark:border-gray-700/50">
                      <td className="pl-5 py-2.5 text-gray-400">{i+1}</td>
                      <td className="py-2.5 font-semibold text-gray-800 dark:text-gray-100">{l.product}</td>
                      <td className="py-2.5 text-gray-500 dark:text-gray-400">{l.dept}</td>
                      <td className="py-2.5 font-bold text-red-600 dark:text-red-400">{l.margin}%</td>
                      <td className="py-2.5 text-gray-400">{l.target}%</td>
                      <td className="pr-5 py-2.5 text-right">
                        <span className="inline-block text-xs font-semibold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 rounded-md px-2 py-0.5">-{eur(l.loss)}/mo</span>
                      </td>
                    </tr>
                  ))}
                  {leaks.length === 0 && (
                    <tr><td colSpan={6} className="px-5 py-8 text-center text-gray-400 text-sm">No products below target this month. Nice.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
            {data.leakages_total > 12 && (
              <button onClick={()=>onNavigate?.("reports")}
                className="w-full flex items-center justify-center gap-2 px-5 py-3 text-sm font-semibold text-violet-700 dark:text-violet-300 bg-violet-50 dark:bg-violet-950/40 hover:bg-violet-100 dark:hover:bg-violet-900/50 border-t border-gray-100 dark:border-gray-700 transition-colors">
                Fix all {data.leakages_total} in Issues <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Department health */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm p-5">
            <h2 className="text-sm font-black text-gray-900 dark:text-white">Department health</h2>
            <p className="text-xs text-gray-400 mb-3">Avg margin vs target · monthly loss</p>
            <div className="space-y-3 max-h-[520px] overflow-y-auto pr-1">
              {depts.map((d)=>{
                const trendCls = d.trend==="improving" ? "text-green-600 dark:text-green-400"
                  : d.trend==="worsening" ? "text-red-600 dark:text-red-400" : "text-gray-400";
                const trendTxt = d.trend==="improving" ? "↓ improving" : d.trend==="worsening" ? "↑ worsening" : d.trend==="steady" ? "steady" : "";
                return (
                  <div key={d.code} className="border-b border-gray-50 dark:border-gray-700/50 pb-2.5 last:border-0">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className={`w-2 h-2 rounded-full shrink-0 ${d.on_target?"bg-green-500":"bg-red-400"}`} />
                        <span className="text-sm font-semibold text-gray-800 dark:text-gray-100 truncate">{d.name}</span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {d.loss>0 && <span className="text-xs font-semibold text-red-600 dark:text-red-400">-{eur(d.loss)}/mo</span>}
                        {trendTxt && <span className={`text-[11px] ${trendCls}`}>{trendTxt}</span>}
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-1 pl-4">
                      <span className="text-xs text-gray-500 dark:text-gray-400"><b className="text-gray-700 dark:text-gray-200">{d.avg_margin}%</b> avg · target {d.target}%</span>
                      {d.on_target
                        ? <span className="text-[10px] font-semibold text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-950/40 rounded-full px-2 py-0.5">On target</span>
                        : <span className="text-[10px] font-semibold text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-950/40 rounded-full px-2 py-0.5">{d.below} below</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Kpi({ top, label, value, sub, valueCls, subCls }:
  { top:"red"|"violet"|"amber"|"gray"; label:string; value:string; sub:string; valueCls?:string; subCls?:string }) {
  const topCls = { red:"border-t-red-500", violet:"border-t-violet-500", amber:"border-t-amber-500", gray:"border-t-gray-400" }[top];
  return (
    <div className={`bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 border-t-4 ${topCls} shadow-sm p-4`}>
      <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">{label}</p>
      <p className={`text-2xl font-black mt-1 ${valueCls || "text-gray-900 dark:text-white"}`}>{value}</p>
      <p className={`text-xs mt-0.5 ${subCls || "text-gray-400"}`}>{sub}</p>
    </div>
  );
}
