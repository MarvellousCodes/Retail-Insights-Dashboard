import { Upload, TrendingDown, TrendingUp, AlertTriangle, Tag, ArrowRight, Shield } from "lucide-react";
import type { Product, MarginAlert, PriceAnomaly, DeptThreshold } from "@/App";

function fmt(n: number) { return `€${n.toFixed(2)}`; }

// Small inline sparkline: draws a smooth line (and optional filled area) from a
// numeric series. Series can have any length; we normalise to the svg viewBox.
function Sparkline({
  values,
  stroke,
  fill,
  width = 120,
  height = 36,
  strokeWidth = 1.75,
}: {
  values: number[];
  stroke: string;
  fill?: string;
  width?: number;
  height?: number;
  strokeWidth?: number;
}) {
  if (values.length === 0) return <svg width={width} height={height} />;
  const pts = values.length === 1 ? [values[0], values[0]] : values;
  const min = Math.min(...pts);
  const max = Math.max(...pts);
  const range = max - min || 1;
  const stepX = width / (pts.length - 1 || 1);
  const coords = pts.map((v, i) => {
    const x = i * stepX;
    // Leave 2px padding top/bottom so the stroke isn't clipped
    const y = height - 2 - ((v - min) / range) * (height - 4);
    return [x, y] as const;
  });
  const linePath = coords
    .map(([x, y], i) => (i === 0 ? `M ${x} ${y}` : `L ${x} ${y}`))
    .join(" ");
  const areaPath = fill
    ? `${linePath} L ${width} ${height} L 0 ${height} Z`
    : null;
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="overflow-visible">
      {areaPath && <path d={areaPath} fill={fill} opacity={0.18} />}
      <path d={linePath} fill="none" stroke={stroke} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

interface DashboardPageProps {
  products: Product[];
  marginAlerts: MarginAlert[];
  priceAnomalies: PriceAnomaly[];
  thresholds: DeptThreshold[];
  fixedIds: Set<string>;
  onNewUpload: () => void;
  sourceControls: import("@/components/SourceSelector").SourceControls;
}

import { SourceSelector } from "@/components/SourceSelector";

export function DashboardPage({ products, marginAlerts, priceAnomalies, thresholds, fixedIds, onNewUpload, sourceControls }: DashboardPageProps) {
  if (products.length === 0) {
    const hasSources = sourceControls.sources.length > 0;
    if (hasSources) {
      // Sources exist but none selected — keep header + selector visible so user can re-enable
      return (
        <div className="min-h-full bg-gray-50 fade-up">
          <div className="px-7 py-6 max-w-[1600px] mx-auto">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h1 className="text-xl font-black text-gray-900">Dashboard</h1>
                <p className="text-sm text-gray-400 mt-0.5">No sources selected — pick at least one to view your data</p>
              </div>
              <div className="flex items-center gap-2">
                <SourceSelector {...sourceControls} />
                <button onClick={onNewUpload} className="flex items-center gap-2 bg-violet-600 text-white text-xs font-bold px-4 py-2.5 rounded-xl hover:bg-violet-700 transition-colors shadow-sm">
                  <Upload className="w-3.5 h-3.5" /> New Upload
                </button>
              </div>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm py-16 text-center">
              <div className="w-14 h-14 rounded-2xl bg-violet-100 flex items-center justify-center mx-auto mb-3">
                <TrendingUp className="w-7 h-7 text-violet-400" />
              </div>
              <h2 className="text-base font-black text-gray-800">No active sources</h2>
              <p className="text-sm text-gray-400 mt-1">Open the source selector above and tick the files you want to include.</p>
            </div>
          </div>
        </div>
      );
    }
    // True empty state — no sources uploaded yet
    return (
      <div className="min-h-full bg-gray-50 flex items-center justify-center fade-up">
        <div className="text-center max-w-md px-4">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-violet-600 to-fuchsia-600 flex items-center justify-center mx-auto mb-5 shadow-xl shadow-violet-600/40">
            <Shield className="w-10 h-10 text-white" strokeWidth={2.5} />
          </div>
          <h2 className="text-4xl font-black mb-1 bg-gradient-to-r from-violet-600 via-fuchsia-600 to-violet-600 bg-clip-text text-transparent tracking-tight">
            RetailGuard
          </h2>
          <p className="text-xs font-bold text-violet-500 uppercase tracking-[0.2em] mb-4">Profit Optimisation</p>
          <p className="text-sm text-gray-500 mb-7 leading-relaxed">
            Upload a CSV with your products to automatically detect below-margin items,
            calculate recommended prices, and see exactly how much profit you can recover.
          </p>
          <button
            onClick={onNewUpload}
            className="inline-flex items-center gap-2 bg-violet-600 text-white text-sm font-bold px-6 py-3 rounded-xl hover:bg-violet-700 transition-colors shadow-md shadow-violet-600/25"
          >
            <Upload className="w-4 h-4" />
            Upload CSV to get started
          </button>
          <div className="mt-10 grid grid-cols-3 gap-3 text-left">
            {[
              { title: "Auto Margin Check", desc: "Instantly flags every product below your target margin per category." },
              { title: "Recommended Price", desc: "Calculates the exact price to hit target, rounded to retail-friendly .49 or .99." },
              { title: "Profit Recovery", desc: "Shows the total profit you can reclaim by fixing below-margin products." },
            ].map(({ title, desc }) => (
              <div key={title} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                <div className="w-6 h-1 rounded-full bg-violet-500 mb-3" />
                <p className="text-xs font-bold text-gray-800 mb-1">{title}</p>
                <p className="text-[11px] text-gray-400 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const activeAlerts = marginAlerts.filter((a) => !fixedIds.has(a.product.id));
  const recoverableProfit = activeAlerts.reduce((s, a) => s + Math.max(0, a.profitImpact), 0);
  const avgMargin = products.length > 0
    ? Math.round((products.reduce((s, p) => s + p.margin, 0) / products.length) * 10) / 10
    : 0;
  const criticalCount = activeAlerts.filter((a) => a.severity === "Critical").length;
  const fixedCount = fixedIds.size;

  const priorityActions = activeAlerts.slice(0, 5);

  // ── Build deterministic sparkline series from real product data ──
  // Bucket products by category/department to get ~16 data points, then derive:
  //  - belowSeries:  count of below-target products per bucket  (red, downward feel)
  //  - marginSeries: average margin % per bucket                 (green)
  //  - profitSeries: cumulative recoverable profit               (violet, rising)
  //  - anomalySeries:count of price anomalies per bucket         (orange)
  const buckets = (() => {
    const map = new Map<string, Product[]>();
    products.forEach((p) => {
      const k = p.category || p.department || "Other";
      if (!map.has(k)) map.set(k, []);
      map.get(k)!.push(p);
    });
    return Array.from(map.values());
  })();
  const belowSeries = buckets.map((b) =>
    b.filter((p) => activeAlerts.some((a) => a.product.id === p.id)).length,
  );
  const marginSeries = buckets.map(
    (b) => Math.round((b.reduce((s, p) => s + p.margin, 0) / b.length) * 10) / 10,
  );
  const profitSeries = (() => {
    const sorted = [...activeAlerts].sort((a, b) => b.profitImpact - a.profitImpact);
    const out: number[] = [];
    let cum = 0;
    const n = Math.max(8, Math.min(24, sorted.length));
    const step = Math.max(1, Math.floor(sorted.length / n));
    for (let i = 0; i < sorted.length; i += step) {
      cum += Math.max(0, sorted[i].profitImpact);
      out.push(cum);
    }
    return out.length > 1 ? out : [0, recoverableProfit];
  })();
  const anomalySeries = buckets.map(
    (b) => b.filter((p) => priceAnomalies.some((x) => x.product.id === p.id)).length,
  );

  return (
    <div className="min-h-full bg-gray-50 fade-up">
      <div className="px-7 py-6 w-full max-w-[1600px] mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 className="text-2xl font-black text-gray-900">Dashboard</h1>
            <p className="text-sm text-gray-400 mt-0.5">{products.length} products analysed</p>
          </div>
          <div className="flex items-center gap-2">
            <SourceSelector {...sourceControls} />
            <button onClick={onNewUpload} className="flex items-center gap-2 bg-violet-600 text-white text-xs font-bold px-4 py-2.5 rounded-xl hover:bg-violet-700 transition-colors shadow-sm shadow-violet-600/25">
              <Upload className="w-3.5 h-3.5" /> New Upload
            </button>
          </div>
        </div>

        {/* Total recoverable banner — now with sparkline */}
        {recoverableProfit > 0 && (
          <div className="relative bg-violet-700 rounded-2xl px-6 py-5 mb-6 flex items-center justify-between shadow-lg shadow-violet-600/25 overflow-hidden">
            <div className="relative z-10">
              <p className="text-violet-200 text-[10px] font-semibold uppercase tracking-widest">Total Recoverable Profit</p>
              <p className="text-white text-4xl font-black mt-1">{fmt(recoverableProfit)}</p>
              <p className="text-violet-200 text-xs mt-1">per unit across {activeAlerts.length} products</p>
            </div>
            <div className="relative z-10 text-right">
              <p className="text-violet-100 text-sm font-bold">{fixedCount} issue{fixedCount !== 1 ? "s" : ""} marked fixed</p>
              <p className="text-violet-200 text-sm mt-0.5">{criticalCount} critical remaining</p>
            </div>
            {/* Large decorative sparkline behind the text */}
            <div className="absolute right-0 top-0 h-full w-[55%] pointer-events-none opacity-90">
              <Sparkline
                values={profitSeries}
                stroke="#c4b5fd"
                fill="#a78bfa"
                strokeWidth={2}
                width={600}
                height={110}
              />
            </div>
          </div>
        )}

        {/* Overview heading */}
        <h2 className="text-xs font-black text-gray-900 uppercase tracking-wide mb-3">Overview</h2>

        {/* KPI cards with sparklines */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          {[
            {
              label: "Below Target Margin",
              value: activeAlerts.length,
              sub: `${criticalCount} critical`,
              icon: <TrendingDown className="w-4 h-4" />,
              color: activeAlerts.length > 0 ? "text-red-600" : "text-green-600",
              iconBg: activeAlerts.length > 0 ? "bg-red-50 text-red-500" : "bg-green-50 text-green-500",
              series: belowSeries,
              stroke: "#ef4444",
              fill: "#fecaca",
            },
            {
              label: "Average Margin",
              value: `${avgMargin}%`,
              sub: avgMargin >= 20 ? "above 20% target" : "below 20% target",
              icon: <Tag className="w-4 h-4" />,
              color: avgMargin >= 20 ? "text-green-600" : "text-amber-600",
              iconBg: avgMargin >= 20 ? "bg-green-50 text-green-500" : "bg-amber-50 text-amber-500",
              series: marginSeries,
              stroke: "#10b981",
              fill: "#a7f3d0",
            },
            {
              label: "Recoverable Profit",
              value: fmt(recoverableProfit),
              sub: "per unit if all fixed",
              icon: <TrendingUp className="w-4 h-4" />,
              color: "text-violet-700",
              iconBg: "bg-violet-50 text-violet-600",
              series: profitSeries,
              stroke: "#7c3aed",
              fill: "#c4b5fd",
            },
            {
              label: "Price Anomalies",
              value: priceAnomalies.length,
              sub: "data entry issues",
              icon: <AlertTriangle className="w-4 h-4" />,
              color: priceAnomalies.length > 0 ? "text-orange-600" : "text-green-600",
              iconBg: priceAnomalies.length > 0 ? "bg-orange-50 text-orange-500" : "bg-green-50 text-green-500",
              series: anomalySeries,
              stroke: "#f97316",
              fill: "#fed7aa",
            },
          ].map(({ label, value, sub, icon, color, iconBg, series, stroke, fill }) => (
            <div key={label} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 relative overflow-hidden">
              <div className="flex items-start justify-between mb-2">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">{label}</span>
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${iconBg}`}>{icon}</div>
              </div>
              <p className={`text-3xl font-black ${color}`}>{value}</p>
              <div className="flex items-end justify-between mt-2">
                <p className="text-[11px] text-gray-400">{sub}</p>
                <Sparkline values={series} stroke={stroke} fill={fill} width={90} height={32} />
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-5 gap-5">
          {/* Priority Actions */}
          <div className="col-span-3 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-black text-gray-900">Priority Actions</h2>
                <p className="text-xs text-gray-400 mt-0.5">Top items needing attention</p>
              </div>
              {activeAlerts.length > 5 && (
                <span className="text-xs text-violet-600 font-semibold">+{activeAlerts.length - 5} more</span>
              )}
            </div>
            <div className="divide-y divide-gray-50">
              {priorityActions.length === 0 ? (
                <div className="text-center py-10 text-gray-400">
                  <TrendingUp className="w-8 h-8 mx-auto mb-2 text-green-400" />
                  <p className="text-sm font-semibold text-green-600">All products are at target margin</p>
                </div>
              ) : (
                priorityActions.map((alert, i) => {
                  const sevColor = alert.severity === "Critical" ? "text-red-600 bg-red-50" : alert.severity === "High" ? "text-orange-600 bg-orange-50" : "text-amber-600 bg-amber-50";
                  return (
                    <div key={i} className="px-5 py-3.5 flex items-center gap-4 hover:bg-gray-50 transition-colors">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <p className="text-sm font-bold text-gray-900 truncate">{alert.product.name}</p>
                          <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full shrink-0 ${sevColor}`}>{alert.severity}</span>
                        </div>
                        <p className="text-xs text-gray-400">
                          {alert.product.category || alert.product.department} · Margin <span className="text-red-600 font-semibold">{alert.product.margin}%</span> vs target <span className="font-semibold">{alert.threshold}%</span>
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-black text-violet-700">{fmt(alert.roundedPrice)}</p>
                        <p className="text-[10px] text-gray-400">+{fmt(alert.profitImpact)}/unit</p>
                      </div>
                      <ArrowRight className="w-4 h-4 text-gray-300 shrink-0" />
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Margin by category */}
          <div className="col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h2 className="text-sm font-black text-gray-900 mb-1">Margin by Category</h2>
            <p className="text-xs text-gray-400 mb-4">vs target threshold</p>
            <div className="space-y-3.5">
              {(() => {
                const map: Record<string, number[]> = {};
                products.forEach((p) => {
                  const k = p.category || p.department || "Other";
                  if (!map[k]) map[k] = [];
                  map[k].push(p.margin);
                });
                return Object.entries(map)
                  .map(([cat, margins]) => ({
                    cat,
                    avg: Math.round((margins.reduce((s, m) => s + m, 0) / margins.length) * 10) / 10,
                    threshold: thresholds.find((t) => t.department.toLowerCase() === cat.toLowerCase())?.minMargin ?? 20,
                  }))
                  .sort((a, b) => a.avg - b.avg)
                  .slice(0, 7)
                  .map(({ cat, avg, threshold }) => {
                    const below = avg < threshold;
                    return (
                      <div key={cat}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[11px] font-semibold text-gray-700 truncate max-w-[120px]">{cat}</span>
                          <span className={`text-[11px] font-black ${below ? "text-red-600" : "text-green-700"}`}>{avg}%</span>
                        </div>
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden relative">
                          <div
                            className={`h-full rounded-full ${below ? "bg-red-400" : "bg-green-500"}`}
                            style={{ width: `${Math.max(2, Math.min(100, avg))}%` }}
                          />
                          <div className="absolute top-0 h-full w-px bg-violet-400 opacity-60"
                            style={{ left: `${Math.min(100, threshold)}%` }} />
                        </div>
                      </div>
                    );
                  });
              })()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
