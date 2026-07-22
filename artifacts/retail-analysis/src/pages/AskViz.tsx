import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  ReferenceLine,
} from "recharts";
import type { AskContext, AskDelta, AskContextSparkline } from "@/lib/askStore";

/** Viz spec from the enhanced /api/ask response */
export interface VizSpec {
  type: "stat" | "line" | "multiline" | "column" | "heatmap" | "donut" | "hbar" | "scatter" | "table" | "whatif";
  x: string | null;
  y: string[];
  series: string | null;
  units: Record<string, "eur" | "pct" | "count" | "text">;
  labels: Record<string, Record<string, string>>;
  title: string;
}

interface AskVizProps {
  viz: VizSpec;
  columns: string[];
  rows: any[][];
  context?: AskContext;
}

const COLORS = ["#7c3aed", "#2563eb", "#059669", "#d97706", "#dc2626", "#8b5cf6", "#0891b2", "#be185d"];

/** Format a value based on its unit type */
function fmtUnit(val: any, unit?: string): string {
  if (val == null || val === "") return "\u2014";
  const n = typeof val === "number" ? val : parseFloat(String(val));
  if (isNaN(n)) return String(val);
  switch (unit) {
    case "eur":
      return n < 100
        ? `\u20ac${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
        : `\u20ac${Math.round(n).toLocaleString()}`;
    case "pct":
      return `${n.toFixed(1)}%`;
    case "count":
      return Math.round(n).toLocaleString();
    default:
      return String(val);
  }
}

function colIdx(columns: string[], name: string): number {
  return columns.indexOf(name);
}

function buildData(columns: string[], rows: any[][], viz: VizSpec): Record<string, any>[] {
  return rows.map((row) => {
    const obj: Record<string, any> = {};
    columns.forEach((c, i) => {
      const label = viz.labels?.[c]?.[String(row[i])] ?? row[i];
      obj[c] = label;
    });
    return obj;
  });
}

function CustomTooltip({ active, payload, unit }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-xs shadow-md">
      {payload.map((p: any, i: number) => (
        <div key={i} className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: p.color }} />
          <span className="text-gray-600 dark:text-gray-300">{p.name}:</span>
          <span className="font-semibold text-gray-900 dark:text-white">{fmtUnit(p.value, unit)}</span>
        </div>
      ))}
    </div>
  );
}

/* ===== CONTEXT BADGE ROW ===== */
function ContextBadgeRow({ context }: { context?: AskContext }) {
  if (!context) return null;
  const { period, data_through, coverage } = context;
  if (!period && !data_through && !coverage) return null;
  return (
    <div className="flex flex-wrap items-center gap-2 mb-2.5">
      {period?.label && (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-violet-100/70 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300">
          <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
          {period.label}
        </span>
      )}
      {data_through && (
        <span className="text-[10px] text-gray-400/80">
          Data up to {new Date(data_through).toLocaleDateString("en-IE", { day: "numeric", month: "short" })}
        </span>
      )}
      {coverage && (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] bg-amber-50/80 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border border-amber-200/50 dark:border-amber-800/40">
          <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          {coverage}
        </span>
      )}
    </div>
  );
}

/* ===== DELTA PILLS ===== */
function DeltaPills({ deltas }: { deltas?: AskDelta[] }) {
  if (!deltas?.length) return null;
  return (
    <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
      {deltas.map((d, i) => {
        const isUp = d.direction === "up";
        const isFlat = d.direction === "flat";
        return (
          <span
            key={i}
            className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-medium ${
              isFlat
                ? "bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400"
                : isUp
                  ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400"
                  : "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400"
            }`}
          >
            {!isFlat && (
              <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {isUp ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 15l7-7 7 7" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                )}
              </svg>
            )}
            {Math.abs(d.pct).toFixed(1)}% {d.label}
          </span>
        );
      })}
    </div>
  );
}

/* ===== MINI SPARKLINE (no axes, accent stroke) ===== */
function MiniSparkline({ sparkline }: { sparkline?: AskContextSparkline }) {
  if (!sparkline?.points?.length || sparkline.points.length < 2) return null;
  const data = sparkline.points.map(([label, val]) => ({ label, value: val }));
  return (
    <div className="h-8 mt-2 opacity-70">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 2, right: 2, bottom: 2, left: 2 }}>
          <Line type="monotone" dataKey="value" stroke="#7c3aed" strokeWidth={1.5} dot={false} />
        </LineChart>
      </ResponsiveContainer>
      <p className="text-[9px] text-gray-400 mt-0.5">{sparkline.label}</p>
    </div>
  );
}

/* ===== TOTALS LINE ===== */
function TotalsLine({ context }: { context?: AskContext }) {
  if (!context?.total) return null;
  const { label, value, unit } = context.total;
  return (
    <p className="mt-2 text-[11px] font-medium text-gray-600 dark:text-gray-300">
      {label}: {fmtUnit(value, unit)}
    </p>
  );
}

/* ===== CALLOUTS ===== */
function Callouts({ context }: { context?: AskContext }) {
  if (!context?.callouts?.length) return null;
  return (
    <div className="mt-2 space-y-0.5">
      {context.callouts.slice(0, 2).map((c, i) => (
        <p key={i} className="text-[10px] text-gray-500 dark:text-gray-400">{c}</p>
      ))}
    </div>
  );
}

/* ===== STAT CARD (enhanced) ===== */
function StatCard({ viz, columns, rows, context }: AskVizProps) {
  const yCol = viz.y[0];
  const yi = colIdx(columns, yCol);
  if (yi === -1 || !rows[0]) return null;
  const val = rows[0][yi];
  const unit = viz.units?.[yCol];
  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-5 py-4">
      <p className="text-xs text-gray-500 mb-1">{viz.title}</p>
      <div className="flex items-baseline gap-3">
        <p className="text-2xl font-bold text-gray-900 dark:text-white">{fmtUnit(val, unit)}</p>
      </div>
      <DeltaPills deltas={context?.deltas} />
      <MiniSparkline sparkline={context?.sparkline} />
    </div>
  );
}

function LineViz({ viz, columns, rows, context, onDrillThrough }: AskVizProps & { onDrillThrough?: (q: string) => void }) {
  const data = buildData(columns, rows, viz);
  const xKey = viz.x || columns[0];
  const unit = viz.units?.[viz.y[0]];

  const handleLineClick = (entry: any) => {
    if (!onDrillThrough || !entry?.activePayload?.length) return;
    const point = entry.activePayload[0]?.payload?.[xKey];
    if (!point) return;
    const q = `Sales breakdown for ${point}`;
    onDrillThrough(q);
  };

  return (
    <div className={`h-48 ${onDrillThrough ? "cursor-pointer" : ""}`}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 12, bottom: 0, left: 4 }} onClick={onDrillThrough ? handleLineClick : undefined}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(156,163,175,0.2)" />
          <XAxis dataKey={xKey} tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => fmtUnit(v, unit)} />
          <Tooltip content={<CustomTooltip unit={unit} />} />
          {viz.y.map((col, i) => (
            <Line key={col} type="monotone" dataKey={col} stroke={COLORS[i % COLORS.length]} strokeWidth={2} dot={false} activeDot={onDrillThrough ? { r: 5, strokeWidth: 2 } : undefined} />
          ))}
          {viz.y.length > 1 && <Legend wrapperStyle={{ fontSize: 10 }} />}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

function ColumnViz({ viz, columns, rows, context, onDrillThrough }: AskVizProps & { onDrillThrough?: (q: string) => void }) {
  const data = buildData(columns, rows, viz);
  const xKey = viz.x || columns[0];
  const unit = viz.units?.[viz.y[0]];
  const periodLabel = context?.period?.label || "";

  const handleBarClick = (entry: any) => {
    if (!onDrillThrough || !entry?.activePayload?.length) return;
    const category = entry.activePayload[0]?.payload?.[xKey];
    if (!category) return;
    const q = periodLabel
      ? `Sales breakdown for ${category} for ${periodLabel}`
      : `Sales breakdown for ${category}`;
    onDrillThrough(q);
  };

  return (
    <div className={`h-48 ${onDrillThrough ? "cursor-pointer" : ""}`}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 12, bottom: 0, left: 4 }} onClick={onDrillThrough ? handleBarClick : undefined}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(156,163,175,0.2)" />
          <XAxis dataKey={xKey} tick={{ fontSize: 9 }} interval={0} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => fmtUnit(v, unit)} />
          <Tooltip content={<CustomTooltip unit={unit} />} />
          {viz.y.map((col, i) => (
            <Bar key={col} dataKey={col} fill={COLORS[i % COLORS.length]} radius={[4, 4, 0, 0]} className={onDrillThrough ? "hover:opacity-80 transition-opacity" : ""} />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function HBarViz({ viz, columns, rows, context, onDrillThrough }: AskVizProps & { onDrillThrough?: (q: string) => void }) {
  const data = buildData(columns, rows, viz);
  const xKey = viz.x || columns[0];
  const yCol = viz.y[0];
  const unit = viz.units?.[yCol];
  const total = data.reduce((s, d) => s + (parseFloat(d[yCol]) || 0), 0);
  const periodLabel = context?.period?.label || "";

  const handleBarClick = (entry: any) => {
    if (!onDrillThrough || !entry?.activePayload?.length) return;
    const category = entry.activePayload[0]?.payload?.[xKey];
    if (!category) return;
    const q = periodLabel
      ? `Top 10 products in ${category} by revenue for ${periodLabel}`
      : `Top 10 products in ${category} by revenue`;
    onDrillThrough(q);
  };

  return (
    <>
      <div style={{ height: Math.max(120, rows.length * 28 + 20) }} className={onDrillThrough ? "cursor-pointer" : ""}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ top: 4, right: 12, bottom: 0, left: 80 }} onClick={onDrillThrough ? handleBarClick : undefined}>
            <XAxis type="number" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => fmtUnit(v, unit)} />
            <YAxis type="category" dataKey={xKey} tick={{ fontSize: 10 }} axisLine={false} tickLine={false} width={76} />
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const v = payload[0].value as number;
                const pct = total > 0 ? ((v / total) * 100).toFixed(1) : "0";
                const rank = [...data].sort((a, b) => (b[yCol] || 0) - (a[yCol] || 0)).findIndex((d) => d[xKey] === payload[0].payload[xKey]) + 1;
                return (
                  <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-xs shadow-md">
                    <p className="font-semibold text-gray-900 dark:text-white">{fmtUnit(v, unit)}</p>
                    <p className="text-gray-500">{pct}% of total, rank #{rank}</p>
                    {onDrillThrough && <p className="text-violet-500 mt-0.5">Click to drill down</p>}
                  </div>
                );
              }}
            />
            <Bar dataKey={yCol} fill={COLORS[0]} radius={[0, 4, 4, 0]} className={onDrillThrough ? "hover:opacity-80 transition-opacity" : ""} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <TotalsLine context={context} />
    </>
  );
}

function DonutViz({ viz, columns, rows, context, onDrillThrough }: AskVizProps & { onDrillThrough?: (q: string) => void }) {
  const xKey = viz.x || columns[0];
  const yCol = viz.y[0];
  const unit = viz.units?.[yCol];
  const data = buildData(columns, rows, viz);
  const total = data.reduce((s, d) => s + (parseFloat(d[yCol]) || 0), 0);
  const periodLabel = context?.period?.label || "";

  const handlePieClick = (_: any, index: number) => {
    if (!onDrillThrough || index < 0 || index >= data.length) return;
    const category = data[index]?.[xKey];
    if (!category) return;
    const q = periodLabel
      ? `Top 10 products in ${category} for ${periodLabel}`
      : `Top 10 products in ${category}`;
    onDrillThrough(q);
  };

  return (
    <>
      <div className={`h-48 ${onDrillThrough ? "cursor-pointer" : ""}`}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey={yCol}
              nameKey={xKey}
              cx="50%"
              cy="50%"
              innerRadius="45%"
              outerRadius="70%"
              paddingAngle={2}
              label={({ name, percent }) => `${String(name).slice(0, 12)} ${(percent * 100).toFixed(0)}%`}
              labelLine={false}
              onClick={onDrillThrough ? handlePieClick : undefined}
              className={onDrillThrough ? "hover:opacity-80 transition-opacity" : ""}
            >
              {data.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const v = payload[0].value as number;
                const pct = total > 0 ? ((v / total) * 100).toFixed(1) : "0";
                return (
                  <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-xs shadow-md">
                    <p className="font-semibold text-gray-900 dark:text-white">{payload[0].name}</p>
                    <p className="text-gray-500">{fmtUnit(v, unit)} ({pct}%)</p>
                    {onDrillThrough && <p className="text-violet-500 mt-0.5">Click to drill down</p>}
                  </div>
                );
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <TotalsLine context={context} />
    </>
  );
}

function HeatmapViz({ viz, columns, rows }: AskVizProps) {
  const data = buildData(columns, rows, viz);
  const xKey = viz.x || columns[0];
  const yCol = viz.y[0];
  const valCol = viz.y.length > 1 ? viz.y[1] : viz.y[0];
  const unit = viz.units?.[valCol];

  const dayCol = xKey;
  const hourCol = yCol;
  const valField = valCol;

  const days = [...new Set(data.map((d) => String(d[dayCol])))];
  const hours = [...new Set(data.map((d) => String(d[hourCol])))].sort((a, b) => parseInt(a) - parseInt(b));
  const vals = data.map((d) => parseFloat(d[valField]) || 0);
  const maxVal = Math.max(...vals, 1);

  const getVal = (day: string, hour: string) => {
    const row = data.find((d) => String(d[dayCol]) === day && String(d[hourCol]) === hour);
    return row ? (parseFloat(row[valField]) || 0) : 0;
  };

  return (
    <div className="overflow-x-auto">
      <div className="inline-grid gap-0.5" style={{ gridTemplateColumns: `80px repeat(${hours.length}, 28px)` }}>
        <div />
        {hours.map((h) => (
          <div key={h} className="text-[9px] text-gray-400 text-center">{h}</div>
        ))}
        {days.map((day) => (
          <React.Fragment key={`row-${day}`}>
            <div className="text-[10px] text-gray-600 dark:text-gray-300 flex items-center">{day}</div>
            {hours.map((hour) => {
              const v = getVal(day, hour);
              const intensity = maxVal > 0 ? v / maxVal : 0;
              return (
                <div
                  key={`${day}-${hour}`}
                  title={`${day} ${hour}:00 = ${fmtUnit(v, unit)}`}
                  className="w-7 h-7 rounded-sm cursor-default"
                  style={{ backgroundColor: `rgba(124, 58, 237, ${0.1 + intensity * 0.8})` }}
                />
              );
            })}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}

function ScatterViz({ viz, columns, rows }: AskVizProps) {
  const data = buildData(columns, rows, viz);
  const xKey = viz.x || columns[0];
  const yCol = viz.y[0];
  const xUnit = viz.units?.[xKey];
  const yUnit = viz.units?.[yCol];
  return (
    <div className="h-52">
      <ResponsiveContainer width="100%" height="100%">
        <ScatterChart margin={{ top: 8, right: 12, bottom: 4, left: 4 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(156,163,175,0.2)" />
          <XAxis dataKey={xKey} type="number" tick={{ fontSize: 10 }} axisLine={false} name={xKey} tickFormatter={(v) => fmtUnit(v, xUnit)} />
          <YAxis dataKey={yCol} type="number" tick={{ fontSize: 10 }} axisLine={false} name={yCol} tickFormatter={(v) => fmtUnit(v, yUnit)} />
          <ReferenceLine y={0} stroke="rgba(156,163,175,0.5)" />
          <ReferenceLine x={0} stroke="rgba(156,163,175,0.5)" />
          <Tooltip
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const d = payload[0]?.payload;
              return (
                <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-xs shadow-md">
                  {columns.map((c) => (
                    <p key={c} className="text-gray-600 dark:text-gray-300">
                      {c}: <span className="font-semibold">{fmtUnit(d?.[c], viz.units?.[c])}</span>
                    </p>
                  ))}
                </div>
              );
            }}
          />
          <Scatter data={data} fill={COLORS[0]} />
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
}

function TableViz({ viz, columns, rows, context }: AskVizProps) {
  const total = context?.total;
  return (
    <div className="overflow-x-auto max-h-64 overflow-y-auto rounded-lg border border-gray-200 dark:border-gray-700">
      <table className="text-[11px] w-full">
        <thead className="text-gray-500 border-b border-gray-200 dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-800">
          <tr>
            {columns.map((c, j) => (
              <th key={j} className="px-2.5 py-2 text-left font-semibold whitespace-nowrap">{c}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
          {rows.slice(0, 20).map((r, ri) => (
            <tr key={ri} className={ri % 2 ? "bg-gray-50/60 dark:bg-gray-900/20" : ""}>
              {r.map((v, ci) => (
                <td key={ci} className="px-2.5 py-1.5 text-gray-700 dark:text-gray-300 max-w-[180px] truncate">
                  {fmtUnit(v, viz.units?.[columns[ci]])}
                </td>
              ))}
            </tr>
          ))}
          {/* Pinned totals row */}
          {total && (
            <tr className="bg-gray-100 dark:bg-gray-700/40 font-semibold border-t border-gray-300 dark:border-gray-600">
              <td className="px-2.5 py-1.5 text-gray-800 dark:text-gray-200">{total.label}</td>
              {columns.slice(1).map((c, ci) => (
                <td key={ci} className="px-2.5 py-1.5 text-gray-800 dark:text-gray-200">
                  {viz.units?.[c] === total.unit || c === viz.y[0] ? fmtUnit(total.value, total.unit) : ""}
                </td>
              ))}
            </tr>
          )}
        </tbody>
      </table>
      {rows.length > 20 && (
        <p className="px-3 py-1.5 text-[10px] text-gray-400 border-t border-gray-100 dark:border-gray-700">
          Showing 20 of {rows.length} rows.
        </p>
      )}
    </div>
  );
}

import React from "react";
import type { WhatIfData, WhatIfItem } from "@/lib/askStore";
import { API_BASE } from "@/lib/api";

/* ===== WHAT-IF QUEUE BUTTON ===== */
function QueueDraftButton({ item }: { item: WhatIfItem }) {
  const [state, setState] = React.useState<"idle" | "loading" | "done" | "error">("idle");

  const handleQueue = async () => {
    setState("loading");
    try {
      const token = localStorage.getItem("rg-token");
      const res = await fetch(`${API_BASE}/api/price-jobs`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ product_code: item.code, new_price: item.proposed.price, draft: true, source: "ask_whatif" }),
      });
      if (res.ok) setState("done");
      else setState("error");
    } catch {
      setState("error");
    }
  };

  if (state === "done") {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400">
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
        Queued as a draft on the Price changes page
      </span>
    );
  }

  if (state === "error") {
    return <span className="text-[10px] text-red-500">Failed to queue</span>;
  }

  return (
    <button
      onClick={handleQueue}
      disabled={state === "loading"}
      className="inline-flex items-center gap-1 text-[10px] px-2 py-1 rounded-md bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 hover:bg-violet-200 dark:hover:bg-violet-800/40 transition-colors disabled:opacity-50"
    >
      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
      {state === "loading" ? "Queuing..." : "Queue for review"}
    </button>
  );
}

/* ===== WHAT-IF SINGLE PRODUCT CARD ===== */
function WhatIfProductCard({ item }: { item: WhatIfItem }) {
  return (
    <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-3">
      <p className="text-[11px] font-semibold text-gray-700 dark:text-gray-200 mb-2.5">{item.product}</p>
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
        {/* Now column */}
        <div className="space-y-1">
          <p className="text-[9px] uppercase tracking-wider text-gray-400 font-medium">Now</p>
          <p className="text-sm font-bold text-gray-800 dark:text-white">{fmtUnit(item.current.price, "eur")}</p>
          <p className="text-[10px] text-gray-500">{item.current.margin_pct.toFixed(1)}% margin</p>
          <p className="text-[10px] text-gray-500">{fmtUnit(item.current.profit, "eur")} profit</p>
        </div>
        {/* Delta pill */}
        <div className="flex flex-col items-center gap-1">
          <svg className="w-4 h-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
          <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-medium ${
            item.delta.profit >= 0
              ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400"
              : "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400"
          }`}>
            {item.delta.profit >= 0 ? (
              <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 15l7-7 7 7" /></svg>
            ) : (
              <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" /></svg>
            )}
            {item.delta.profit >= 0 ? "+" : ""}{fmtUnit(item.delta.profit, "eur")}
          </span>
        </div>
        {/* If changed column */}
        <div className="space-y-1 text-right">
          <p className="text-[9px] uppercase tracking-wider text-gray-400 font-medium">If changed</p>
          <p className="text-sm font-bold text-violet-700 dark:text-violet-300">{fmtUnit(item.proposed.price, "eur")}</p>
          <p className="text-[10px] text-gray-500">{item.proposed.margin_pct.toFixed(1)}% margin</p>
          <p className="text-[10px] text-gray-500">{fmtUnit(item.proposed.profit, "eur")} profit</p>
        </div>
      </div>
      {/* Breakeven sentence */}
      {item.breakeven && (
        <p className="mt-2.5 text-[11px] font-medium text-gray-700 dark:text-gray-200">
          {item.breakeven.direction === "can_lose"
            ? `You could sell ${item.breakeven.units} fewer units (${item.breakeven.pct.toFixed(1)}%) before being worse off.`
            : `You would need to sell ${item.breakeven.units} more units (${item.breakeven.pct.toFixed(1)}%) to break even.`
          }
        </p>
      )}
      {/* Queue button */}
      {item.queueable && (
        <div className="mt-2.5">
          <QueueDraftButton item={item} />
        </div>
      )}
    </div>
  );
}

/* ===== WHAT-IF GROUP TABLE ===== */
function WhatIfGroupTable({ data }: { data: WhatIfData }) {
  return (
    <div className="space-y-2.5">
      <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
        <table className="text-[11px] w-full">
          <thead className="text-gray-500 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
            <tr>
              <th className="px-2.5 py-2 text-left font-semibold">Product</th>
              <th className="px-2.5 py-2 text-right font-semibold">Now</th>
              <th className="px-2.5 py-2 text-right font-semibold">New price</th>
              <th className="px-2.5 py-2 text-right font-semibold">Profit change</th>
              <th className="px-2.5 py-2 text-right font-semibold"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
            {data.items.map((item, i) => (
              <tr key={i} className={i % 2 ? "bg-gray-50/60 dark:bg-gray-900/20" : ""}>
                <td className="px-2.5 py-1.5 text-gray-700 dark:text-gray-300 max-w-[180px] truncate">{item.product}</td>
                <td className="px-2.5 py-1.5 text-right text-gray-700 dark:text-gray-300">{fmtUnit(item.current.price, "eur")}</td>
                <td className="px-2.5 py-1.5 text-right text-violet-700 dark:text-violet-300 font-medium">{fmtUnit(item.proposed.price, "eur")}</td>
                <td className={`px-2.5 py-1.5 text-right font-medium ${item.delta.profit >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}>
                  {item.delta.profit >= 0 ? "+" : ""}{fmtUnit(item.delta.profit, "eur")}
                </td>
                <td className="px-2.5 py-1.5 text-right">
                  {item.queueable && <QueueDraftButton item={item} />}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {/* Totals line */}
      {data.totals && (
        <div className="flex items-center gap-3 px-2 py-1.5 rounded-md bg-gray-100 dark:bg-gray-700/40 text-[11px]">
          <span className="text-gray-500">{data.totals.items_count} items</span>
          <span className="text-gray-600 dark:text-gray-300 font-medium">
            Current: {fmtUnit(data.totals.current_profit, "eur")}
          </span>
          <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
          <span className={`font-medium ${data.totals.delta_profit >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}>
            {data.totals.delta_profit >= 0 ? "+" : ""}{fmtUnit(data.totals.delta_profit, "eur")}
          </span>
        </div>
      )}
    </div>
  );
}

/* ===== WHAT-IF CARD (main) ===== */
export function WhatIfCard({ data }: { data: WhatIfData }) {
  if (!data?.items?.length) return null;
  return (
    <div className="space-y-2.5">
      {/* Period badge */}
      {data.period && (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-violet-100/70 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300">
          <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
          {data.period.label}
        </span>
      )}

      {/* Single product or group */}
      {data.scope === "product" && data.items.length === 1 ? (
        <WhatIfProductCard item={data.items[0]} />
      ) : (
        <WhatIfGroupTable data={data} />
      )}

      {/* Assumption line (small grey translucent) */}
      {data.assumption && (
        <p className="text-[10px] text-gray-400/80 italic">{data.assumption}</p>
      )}

      {/* Warnings (subtle warn tint) */}
      {data.warnings?.map((w, i) => (
        <div key={i} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] bg-amber-50/80 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border border-amber-200/50 dark:border-amber-800/40">
          <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          {w}
        </div>
      ))}
    </div>
  );
}

export function AskViz({ viz, columns, rows, context, onDrillThrough }: AskVizProps & { onDrillThrough?: (q: string) => void }) {
  if (!viz || !columns?.length || !rows?.length) return null;

  const renderChart = () => {
    switch (viz.type) {
      case "stat":
        return <StatCard viz={viz} columns={columns} rows={rows} context={context} />;
      case "line":
      case "multiline":
        return <LineViz viz={viz} columns={columns} rows={rows} context={context} onDrillThrough={onDrillThrough} />;
      case "column":
        return <ColumnViz viz={viz} columns={columns} rows={rows} context={context} onDrillThrough={onDrillThrough} />;
      case "hbar":
        return <HBarViz viz={viz} columns={columns} rows={rows} context={context} onDrillThrough={onDrillThrough} />;
      case "donut":
        return <DonutViz viz={viz} columns={columns} rows={rows} context={context} onDrillThrough={onDrillThrough} />;
      case "heatmap":
        return <HeatmapViz viz={viz} columns={columns} rows={rows} context={context} />;
      case "scatter":
        return <ScatterViz viz={viz} columns={columns} rows={rows} context={context} />;
      case "table":
      default:
        return <TableViz viz={viz} columns={columns} rows={rows} context={context} />;
    }
  };

  return (
    <div>
      <ContextBadgeRow context={context} />
      {renderChart()}
      {viz.type !== "stat" && <TotalsLine context={context} />}
      <Callouts context={context} />
    </div>
  );
}
