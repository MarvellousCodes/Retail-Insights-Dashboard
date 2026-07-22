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

/** Viz spec from the enhanced /api/ask response */
export interface VizSpec {
  type: "stat" | "line" | "multiline" | "column" | "heatmap" | "donut" | "hbar" | "scatter" | "table";
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

function StatCard({ viz, columns, rows }: AskVizProps) {
  const yCol = viz.y[0];
  const yi = colIdx(columns, yCol);
  if (yi === -1 || !rows[0]) return null;
  const val = rows[0][yi];
  const unit = viz.units?.[yCol];
  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-5 py-4">
      <p className="text-xs text-gray-500 mb-1">{viz.title}</p>
      <p className="text-2xl font-bold text-gray-900 dark:text-white">{fmtUnit(val, unit)}</p>
      {rows.length > 1 && rows[1][yi] != null && (
        <p className="text-[11px] text-gray-400 mt-1">vs previous: {fmtUnit(rows[1][yi], unit)}</p>
      )}
    </div>
  );
}

function LineViz({ viz, columns, rows }: AskVizProps) {
  const data = buildData(columns, rows, viz);
  const xKey = viz.x || columns[0];
  const unit = viz.units?.[viz.y[0]];
  return (
    <div className="h-48">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 12, bottom: 0, left: 4 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(156,163,175,0.2)" />
          <XAxis dataKey={xKey} tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => fmtUnit(v, unit)} />
          <Tooltip content={<CustomTooltip unit={unit} />} />
          {viz.y.map((col, i) => (
            <Line key={col} type="monotone" dataKey={col} stroke={COLORS[i % COLORS.length]} strokeWidth={2} dot={false} />
          ))}
          {viz.y.length > 1 && <Legend wrapperStyle={{ fontSize: 10 }} />}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

function ColumnViz({ viz, columns, rows }: AskVizProps) {
  const data = buildData(columns, rows, viz);
  const xKey = viz.x || columns[0];
  const unit = viz.units?.[viz.y[0]];
  return (
    <div className="h-48">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 12, bottom: 0, left: 4 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(156,163,175,0.2)" />
          <XAxis dataKey={xKey} tick={{ fontSize: 9 }} interval={0} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => fmtUnit(v, unit)} />
          <Tooltip content={<CustomTooltip unit={unit} />} />
          {viz.y.map((col, i) => (
            <Bar key={col} dataKey={col} fill={COLORS[i % COLORS.length]} radius={[4, 4, 0, 0]} />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function HBarViz({ viz, columns, rows }: AskVizProps) {
  const data = buildData(columns, rows, viz);
  const xKey = viz.x || columns[0];
  const yCol = viz.y[0];
  const unit = viz.units?.[yCol];
  const total = data.reduce((s, d) => s + (parseFloat(d[yCol]) || 0), 0);
  return (
    <div style={{ height: Math.max(120, rows.length * 28 + 20) }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 4, right: 12, bottom: 0, left: 80 }}>
          <XAxis type="number" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => fmtUnit(v, unit)} />
          <YAxis type="category" dataKey={xKey} tick={{ fontSize: 10 }} axisLine={false} tickLine={false} width={76} />
          <Tooltip
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const v = payload[0].value as number;
              const pct = total > 0 ? ((v / total) * 100).toFixed(1) : "0";
              const rank = data.sort((a, b) => (b[yCol] || 0) - (a[yCol] || 0)).findIndex((d) => d[xKey] === payload[0].payload[xKey]) + 1;
              return (
                <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-xs shadow-md">
                  <p className="font-semibold text-gray-900 dark:text-white">{fmtUnit(v, unit)}</p>
                  <p className="text-gray-500">{pct}% of total, rank #{rank}</p>
                </div>
              );
            }}
          />
          <Bar dataKey={yCol} fill={COLORS[0]} radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function DonutViz({ viz, columns, rows }: AskVizProps) {
  const xKey = viz.x || columns[0];
  const yCol = viz.y[0];
  const unit = viz.units?.[yCol];
  const data = buildData(columns, rows, viz);
  const total = data.reduce((s, d) => s + (parseFloat(d[yCol]) || 0), 0);
  return (
    <div className="h-48">
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
                </div>
              );
            }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

function HeatmapViz({ viz, columns, rows }: AskVizProps) {
  const data = buildData(columns, rows, viz);
  const xKey = viz.x || columns[0];
  const yCol = viz.y[0];
  const valCol = viz.y.length > 1 ? viz.y[1] : viz.y[0];
  const unit = viz.units?.[valCol];

  // Expect rows to have day/hour/value structure
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
          <>
            <div key={`lbl-${day}`} className="text-[10px] text-gray-600 dark:text-gray-300 flex items-center">{day}</div>
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
          </>
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
                  {columns.map((c, i) => (
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

function TableViz({ viz, columns, rows }: AskVizProps) {
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

export function AskViz({ viz, columns, rows }: AskVizProps) {
  if (!viz || !columns?.length || !rows?.length) return null;

  switch (viz.type) {
    case "stat":
      return <StatCard viz={viz} columns={columns} rows={rows} />;
    case "line":
    case "multiline":
      return <LineViz viz={viz} columns={columns} rows={rows} />;
    case "column":
      return <ColumnViz viz={viz} columns={columns} rows={rows} />;
    case "hbar":
      return <HBarViz viz={viz} columns={columns} rows={rows} />;
    case "donut":
      return <DonutViz viz={viz} columns={columns} rows={rows} />;
    case "heatmap":
      return <HeatmapViz viz={viz} columns={columns} rows={rows} />;
    case "scatter":
      return <ScatterViz viz={viz} columns={columns} rows={rows} />;
    case "table":
    default:
      return <TableViz viz={viz} columns={columns} rows={rows} />;
  }
}
