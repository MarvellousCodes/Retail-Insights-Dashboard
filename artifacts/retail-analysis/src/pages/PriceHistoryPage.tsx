import { useState, useEffect, useCallback } from "react";
import { apiCall } from "@/lib/api";
import { TrendingUp, TrendingDown, Search, Loader2, LineChart as LineChartIcon, Sparkles, Layers, ArrowLeft, CheckCircle2 } from "lucide-react";
import { ResponsiveContainer, ComposedChart, Bar, Line, XAxis, YAxis, Tooltip, Legend } from "recharts";

interface PriceEvent {
  product_id: string; description: string; dept: string; period: string;
  price_from: number; price_to: number;
  qty_before: number; qty_after: number; volume_change_pct: number | null;
  profit_before: number; profit_after: number; profit_delta_month: number;
}
interface Opp {
  product_id: string; description: string; dept: string;
  price: number; suggested: number; cost: number;
  margin: number | null; new_margin: number;
  units_month: number; gain_month: number; breakeven_loss_pct: number | null;
}
interface PriceOption { price: number; margin: number; gain_month: number; breakeven_loss_pct: number | null; recommended: boolean; }
interface SeriesPoint { period: string; qty: number; price: number; profit: number; }
interface Verdict {
  product: { id: string; description: string; dept: string; cost: number; price: number; margin: number | null; units_month: number };
  options: PriceOption[]; history_events: PriceEvent[]; series: SeriesPoint[];
}

const eur = (v: number) => "\u20AC" + v.toFixed(2);
const eur0 = (v: number) => "\u20AC" + Math.abs(v).toFixed(0);
const fmtPeriod = (p: string) => {
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return months[parseInt(p.slice(4)) - 1] + " " + p.slice(2, 4);
};

function SeriesChart({ series }: { series: SeriesPoint[] }) {
  if (!series.length) return null;
  return (
    <div className="h-56">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={series} margin={{ top: 5, right: 5, bottom: 0, left: 0 }}>
          <XAxis dataKey="period" tickFormatter={fmtPeriod} tick={{ fontSize: 10 }} interval="preserveStartEnd" />
          <YAxis yAxisId="qty" tick={{ fontSize: 10 }} width={40} />
          <YAxis yAxisId="price" orientation="right" tick={{ fontSize: 10 }} width={44} tickFormatter={(v) => "\u20AC" + v} domain={["auto", "auto"]} />
          <Tooltip labelFormatter={(p) => fmtPeriod(String(p))} contentStyle={{ fontSize: 12, borderRadius: 8 }}
            formatter={(v: any, name: string) => name === "price" ? [eur(Number(v)), "avg price"] : [v, name === "qty" ? "units sold" : name]} />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          <Bar yAxisId="qty" dataKey="qty" name="units sold" fill="#c4b5fd" radius={[3, 3, 0, 0]} />
          <Line yAxisId="price" dataKey="price" name="price" stroke="#7c3aed" strokeWidth={2.5} dot={false} type="stepAfter" />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

function VerdictPanel({ pid, onBack }: { pid: string; onBack: () => void }) {
  const [v, setV] = useState<Verdict | null>(null);
  const [picked, setPicked] = useState<number | null>(null);
  useEffect(() => {
    setV(null); setPicked(null);
    apiCall(`/api/price-check/verdict?id=${encodeURIComponent(pid)}`).then((d) => {
      if (!d.error) { setV(d); const rec = (d.options || []).find((o: PriceOption) => o.recommended); setPicked(rec ? rec.price : null); }
    }).catch(() => {});
  }, [pid]);

  if (!v) return <div className="text-sm text-gray-400 flex items-center gap-2 py-8"><Loader2 className="w-4 h-4 animate-spin" /> Working it out...</div>;
  const p = v.product;
  const ev = v.history_events[0];
  const chosen = v.options.find((o) => o.price === picked);
  return (
    <div>
      <button onClick={onBack} className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-violet-600 mb-3"><ArrowLeft className="w-3.5 h-3.5" /> Back to the list</button>
      <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5">
        <div className="flex flex-wrap items-baseline justify-between gap-2 mb-1">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">{p.description}</h2>
          <span className="text-xs text-gray-400">{p.dept}</span>
        </div>
        <p className="text-xs text-gray-500 mb-4">Cost {eur(p.cost)} &middot; selling at {eur(p.price)} &middot; margin {p.margin != null ? p.margin.toFixed(1) + "%" : "n/a"} &middot; ~{Math.round(p.units_month)} units a month</p>

        {/* real history verdict */}
        {ev ? (
          <div className={`mb-4 rounded-xl p-3.5 text-sm ${ev.profit_delta_month >= 0 ? "bg-green-50 dark:bg-green-900/15 text-green-800 dark:text-green-300" : "bg-amber-50 dark:bg-amber-900/15 text-amber-800 dark:text-amber-300"}`}>
            <b>What happened last time:</b> you moved this from {eur(ev.price_from)} to {eur(ev.price_to)} in {fmtPeriod(ev.period)}.
            Volume went {ev.volume_change_pct != null ? `${ev.volume_change_pct > 0 ? "up" : "down"} ${Math.abs(ev.volume_change_pct)}%` : "unmeasured"} and
            monthly profit went {ev.profit_delta_month >= 0 ? "up" : "down"} about {eur0(ev.profit_delta_month)}.
          </div>
        ) : (
          <div className="mb-4 rounded-xl p-3.5 text-sm bg-gray-50 dark:bg-gray-900/40 text-gray-500">
            No clear price change found in the last 30 months for this product, so there is no before and after story yet. The options below show the maths instead.
          </div>
        )}

        {/* shelf price picker */}
        <p className="text-xs font-semibold text-gray-700 dark:text-gray-200 mb-2">Pick a shelf price</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
          {v.options.map((o) => (
            <button key={o.price} onClick={() => setPicked(o.price)}
              className={`rounded-xl border p-3.5 text-center transition ${picked === o.price ? "border-violet-500 bg-violet-50 dark:bg-violet-900/25 shadow-sm" : "border-gray-200 dark:border-gray-700 hover:border-violet-300"}`}>
              <span className="block text-xl font-black text-gray-900 dark:text-white">{eur(o.price)}</span>
              <span className="block text-[11px] text-gray-500 mt-0.5">margin {o.margin.toFixed(1)}%</span>
              {o.recommended && <span className="inline-block mt-1.5 text-[10px] font-bold text-violet-700 dark:text-violet-300 bg-violet-100 dark:bg-violet-900/40 rounded-full px-2 py-0.5">suggested</span>}
            </button>
          ))}
        </div>
        {chosen && (
          <div className="mb-4 rounded-xl border border-gray-100 dark:border-gray-700 p-3.5 flex flex-wrap gap-x-6 gap-y-2 text-sm">
            <span className={chosen.gain_month >= 0 ? "text-green-600 font-semibold" : "text-red-600 font-semibold"}>
              {chosen.gain_month >= 0 ? "+" : "\u2212"}{eur0(chosen.gain_month)} a month if sales hold
            </span>
            {chosen.breakeven_loss_pct != null && (
              <span className="text-gray-600 dark:text-gray-300">you could lose up to <b>{chosen.breakeven_loss_pct}%</b> of sales before being worse off</span>
            )}
            <span className="text-gray-400 text-xs self-center">about {eur0(chosen.gain_month * 12)} a year</span>
          </div>
        )}

        <p className="text-xs font-semibold text-gray-700 dark:text-gray-200 mb-2">Price and sales, month by month</p>
        <SeriesChart series={v.series} />
        <p className="text-[11px] text-gray-400 mt-2">Price is the average selling price from your sales records each month. Promotions blend in, and seasons colour before and after comparisons.</p>
      </div>
    </div>
  );
}

export function PriceHistoryPage() {
  const [tab, setTab] = useState<"opps" | "sweep" | "history">("opps");
  const [opps, setOpps] = useState<any>(null);
  const [ov, setOv] = useState<any>(null);
  const [depts, setDepts] = useState<any[]>([]);
  const [sweep, setSweep] = useState<any>(null);
  const [sweepDept, setSweepDept] = useState("");
  const [viewing, setViewing] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [series, setSeries] = useState<SeriesPoint[]>([]);
  const [productName, setProductName] = useState("");
  const [matches, setMatches] = useState<{ id: string; description: string }[]>([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    apiCall("/api/price-check/opportunities").then(setOpps).catch(() => {});
    apiCall("/api/price-history/overview").then(setOv).catch(() => {});
    apiCall("/api/price-check/sweep").then((d) => setDepts(d.departments || [])).catch(() => {});
  }, []);

  const loadSweep = useCallback((code: string) => {
    setSweepDept(code); setSweep(null);
    apiCall(`/api/price-check/sweep?dept=${encodeURIComponent(code)}`).then(setSweep).catch(() => {});
  }, []);

  const search = useCallback(async (query: string) => {
    const text = query.trim();
    if (text.length < 2 || busy) return;
    setBusy(true);
    try {
      const d = await apiCall(`/api/price-history/product?q=${encodeURIComponent(text)}`);
      if (d.series) { setSeries(d.series); setProductName(d.product?.description || text); setMatches(d.matches || []); }
    } catch { /* noop */ }
    setBusy(false);
  }, [busy]);

  const OppRow = ({ o }: { o: Opp }) => (
    <button onClick={() => setViewing(o.product_id)}
      className="w-full text-left rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-3.5 hover:border-violet-300 dark:hover:border-violet-700 transition flex flex-wrap items-center justify-between gap-2">
      <div className="min-w-0">
        <span className="block text-sm font-semibold text-gray-900 dark:text-white truncate">{o.description}</span>
        <span className="block text-xs text-gray-500 mt-0.5">{eur(o.price)} {"\u2192"} <b>{eur(o.suggested)}</b> &middot; margin {o.margin != null ? o.margin.toFixed(0) : "?"}% {"\u2192"} {o.new_margin.toFixed(0)}%{o.breakeven_loss_pct != null ? ` \u00B7 can lose ${o.breakeven_loss_pct}% of sales` : ""} &middot; {o.dept}</span>
      </div>
      <span className="text-sm font-bold text-green-600 whitespace-nowrap">+{eur0(o.gain_month)}/mo</span>
    </button>
  );

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-2.5 mb-1">
        <LineChartIcon className="w-6 h-6 text-violet-600" />
        <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">Price check</h1>
      </div>
      <p className="text-xs text-gray-500 mb-4">Where a price rise looks safe, what happened the last time you changed a price, and the numbers to decide with. Fuel, lottery and price point lines are never suggested for a rise.</p>

      <div className="inline-flex bg-gray-100 dark:bg-gray-800 rounded-xl p-1 mb-5">
        {([["opps", "Opportunities", Sparkles], ["sweep", "Category sweep", Layers], ["history", "Price history", TrendingUp]] as any[]).map(([id, label, Icon]) => (
          <button key={id} onClick={() => { setTab(id); setViewing(null); }}
            className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm transition ${tab === id ? "bg-white dark:bg-gray-900 text-gray-900 dark:text-white font-semibold shadow-sm" : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"}`}>
            <Icon className="w-3.5 h-3.5" /> {label}
          </button>
        ))}
      </div>

      {viewing ? (
        <VerdictPanel pid={viewing} onBack={() => setViewing(null)} />
      ) : tab === "opps" ? (
        !opps ? <div className="text-sm text-gray-400 flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Finding safe rises...</div> : (
          <>
            <p className="text-xs text-gray-500 mb-3"><b className="text-gray-700 dark:text-gray-200">{opps.total_found}</b> worthwhile rises found, worth about <b className="text-green-600">+{eur0(opps.total_gain_month)}</b> a month together if sales hold. Click one for the full picture.</p>
            <div className="space-y-2">{(opps.opportunities || []).map((o: Opp) => <OppRow key={o.product_id} o={o} />)}</div>
          </>
        )
      ) : tab === "sweep" ? (
        <>
          <div className="flex flex-wrap gap-1.5 mb-4">
            {depts.map((d) => (
              <button key={d.code} onClick={() => loadSweep(d.code)}
                className={`px-3 py-1.5 rounded-full text-xs border transition ${sweepDept === d.code ? "bg-violet-100 dark:bg-violet-900/40 border-violet-300 dark:border-violet-700 text-violet-700 dark:text-violet-300 font-semibold" : "border-gray-200 dark:border-gray-700 text-gray-500 hover:border-violet-300"}`}>
                {d.name}
              </button>
            ))}
          </div>
          {!sweepDept ? <p className="text-sm text-gray-400">Pick a department to see every worthwhile rise in it.</p>
            : !sweep ? <div className="text-sm text-gray-400 flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Sweeping...</div> : (
            <>
              <p className="text-xs text-gray-500 mb-3"><b className="text-gray-700 dark:text-gray-200">{sweep.count}</b> rises in this department, about <b className="text-green-600">+{eur0(sweep.total_gain_month)}</b> a month together.</p>
              <div className="space-y-2">{(sweep.items || []).map((o: any) => <OppRow key={o.product_id} o={o} />)}</div>
            </>
          )}
        </>
      ) : (
        <>
          {ov && (
            <div className="grid md:grid-cols-2 gap-5 mb-6">
              <div>
                <h2 className="flex items-center gap-1.5 text-sm font-bold text-green-700 dark:text-green-400 mb-2"><TrendingUp className="w-4 h-4" /> Changes that paid off</h2>
                <div className="space-y-2">{ov.top_positive.map((e: PriceEvent) => (
                  <button key={e.product_id} onClick={() => setViewing(e.product_id)} className="w-full text-left rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-3 hover:border-violet-300 transition">
                    <div className="flex justify-between gap-2"><span className="text-sm font-semibold truncate text-gray-900 dark:text-white">{e.description}</span><span className="text-sm font-bold text-green-600 whitespace-nowrap">+{eur0(e.profit_delta_month)}/mo</span></div>
                    <span className="text-xs text-gray-500">{eur(e.price_from)} {"\u2192"} {eur(e.price_to)} in {fmtPeriod(e.period)}{e.volume_change_pct != null ? ` \u00B7 volume ${e.volume_change_pct > 0 ? "+" : ""}${e.volume_change_pct}%` : ""}</span>
                  </button>))}
                </div>
              </div>
              <div>
                <h2 className="flex items-center gap-1.5 text-sm font-bold text-red-700 dark:text-red-400 mb-2"><TrendingDown className="w-4 h-4" /> Changes that backfired</h2>
                <div className="space-y-2">{ov.top_negative.map((e: PriceEvent) => (
                  <button key={e.product_id} onClick={() => setViewing(e.product_id)} className="w-full text-left rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-3 hover:border-violet-300 transition">
                    <div className="flex justify-between gap-2"><span className="text-sm font-semibold truncate text-gray-900 dark:text-white">{e.description}</span><span className="text-sm font-bold text-red-600 whitespace-nowrap">{"\u2212"}{eur0(e.profit_delta_month)}/mo</span></div>
                    <span className="text-xs text-gray-500">{eur(e.price_from)} {"\u2192"} {eur(e.price_to)} in {fmtPeriod(e.period)}{e.volume_change_pct != null ? ` \u00B7 volume ${e.volume_change_pct > 0 ? "+" : ""}${e.volume_change_pct}%` : ""}</span>
                  </button>))}
                </div>
              </div>
            </div>
          )}
          <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
            <h2 className="text-sm font-bold text-gray-900 dark:text-white mb-1">Look up any product</h2>
            <div className="flex gap-2 mb-3 mt-2">
              <input value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") search(q); }}
                placeholder="e.g. buckfast, red bull, sliced pan..."
                className="flex-1 h-10 px-3.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" />
              <button onClick={() => search(q)} disabled={q.trim().length < 2 || busy}
                className="inline-flex items-center gap-2 px-4 h-10 rounded-xl bg-violet-600 text-white text-sm font-semibold hover:bg-violet-700 transition disabled:opacity-50">
                {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />} View
              </button>
            </div>
            {matches.length > 1 && (
              <div className="flex flex-wrap gap-1.5 mb-3">
                {matches.map((m) => (
                  <button key={m.id} onClick={() => search(m.description)}
                    className={`px-2.5 py-1 rounded-full text-[11px] border transition ${m.description === productName ? "bg-violet-100 dark:bg-violet-900/40 border-violet-300 dark:border-violet-700 text-violet-700 dark:text-violet-300" : "border-gray-200 dark:border-gray-700 text-gray-500 hover:border-violet-300"}`}>
                    {m.description}
                  </button>
                ))}
              </div>
            )}
            {series.length > 0 && (<><p className="text-xs font-semibold text-gray-700 dark:text-gray-200 mb-2">{productName}</p><SeriesChart series={series} /></>)}
          </div>
        </>
      )}
    </div>
  );
}
